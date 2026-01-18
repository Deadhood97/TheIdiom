
import dotenv from 'dotenv';
import pkg from 'pg';
import OpenAI from 'openai';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function deepSemanticAudit() {
    try {
        const { rows: idioms } = await pool.query('SELECT i.*, c.universal_concept, c.description, c.keywords FROM idioms i JOIN concepts c ON i.concept_id = c.id ORDER BY i.id');
        const { rows: allConcepts } = await pool.query('SELECT id, universal_concept, description, keywords FROM concepts');

        const conceptMatrix = allConcepts.map(c => `ID: ${c.id}\nTitle: ${c.universal_concept}\nLogic: ${c.description}\nKeywords: ${c.keywords}\n---`).join('\n');

        console.log(`Deep Semantic Audit: Checking ${idioms.length} idioms against updated concept metadata...`);

        const report = [];

        for (const idiom of idioms) {
            const { id, language, script, literal_translation, meaning, origin_story, cultural_context, universal_concept, description, keywords } = idiom;

            const auditPrompt = `
        You are a World-Class Semantic Analyst and Linguistic Expert. 
        Evaluate if the following idiom is CORRECTLY mapped to its current concept based on our NEW semantic definitions and cultural context.
        
        IDIOM TO CHECK:
        - Script: ${script}
        - Language: ${language}
        - Literal Translation: ${literal_translation}
        - Meaning: ${meaning || "N/A"}
        - Origin Story: ${origin_story || "N/A"}
        - Cultural Context: ${cultural_context || "N/A"}
        
        CURRENTLY ASSIGNED TO:
        - Title: ${universal_concept}
        - Concept Logic: ${description}
        - Key Metaphors: ${keywords}
        
        AVAILABLE CONCEPTS MATRIX:
        ${conceptMatrix}

        TASK:
        1. Does the idiom's MEANING, METAPHOR, or CULTURAL USAGE align with the CURRENT concept's Logic and Keywords?
           - CRITICAL: Prioritize Cultural Etymology, Mythology, and Actual Usage over Literal Logic.
           - EXAMPLE: In Hindi, "lighting ghee lamps" is a reference to Lord Rama's return (Extreme Joy), even if literally it sounds "redundant" or "extravagant".
           - EXAMPLE: In Punjabi, "to become a garden" means to be overjoyed.
        2. Is there another concept in the Matrix that is a SIGNIFICANTLY better fit? 
        3. If it's a "Close Fit" OR "Culturally Specific Match", KEEP it. If it's a "Strong Divergence", MOVE it.
        4. If the idiom/concept mapping feels "fishy" or forced, identify why.

        RETURN JSON:
        {
          "is_correct": true/false,
          "suggested_action": "KEEP" / "MOVE" / "DELETE",
          "target_concept_id": "ID of suggested concept (if MOVE)",
          "score_current": 1-10,
          "reasoning": "Brief explanation focused on the comparison of metaphors and cultural context"
        }
      `;

            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: auditPrompt }],
                response_format: { type: "json_object" },
            });

            const result = JSON.parse(response.choices[0].message.content);

            if (!result.is_correct || result.score_current < 7) {
                report.push({
                    id,
                    idiom: `${script} (${language})`,
                    current: universal_concept,
                    suggested: result.suggested_action,
                    target: result.target_concept_id,
                    score: result.score_current,
                    reasoning: result.reasoning
                });
                console.log(`[ID ${id}] ${result.suggested_action} (${result.score_current}/10): ${result.reasoning}`);
            }
        }

        console.log('\n--- DEEP SEMANTIC AUDIT REPORT ---');
        console.log(JSON.stringify(report, null, 2));

    } catch (err) {
        console.error("Audit failed:", err);
    } finally {
        await pool.end();
    }
}

deepSemanticAudit();
