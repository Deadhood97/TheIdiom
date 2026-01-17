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

async function auditConceptualMapping() {
    try {
        const { rows: idioms } = await pool.query('SELECT i.*, c.universal_concept FROM idioms i JOIN concepts c ON i.concept_id = c.id ORDER BY i.id');
        const { rows: concepts } = await pool.query('SELECT * FROM concepts');

        const conceptList = concepts.map(c => `- ${c.id}: ${c.universal_concept}`).join('\n');

        console.log(`Auditing conceptual mapping for ${idioms.length} idioms...`);

        const report = [];

        for (const idiom of idioms) {
            const { id, language, script, literal_translation, meaning, universal_concept, concept_id } = idiom;

            const auditPrompt = `
        You are a World-Class Semantic Analyst and Linguistic Expert. 
        Evaluate if the following idiom is correctly mapped to its current concept.
        
        IDIOM:
        - Script: ${script}
        - Language: ${language}
        - Literal Translation: ${literal_translation}
        - Meaning: ${meaning}
        
        CURRENT CONCEPT: ${universal_concept} (ID: ${concept_id})
        
        AVAILABLE CONCEPTS:
        ${conceptList}

        TASK:
        1. Determine if the current concept is the BEST fit among the available options.
        2. If there is a much better fit, suggest it.
        3. If it doesn't fit ANY concept reasonably, suggest DELETE.
        4. If the idiom itself is fake or incorrect, suggest DELETE.
        5. Provide a brief reasoning.

        RETURN JSON:
        {
          "is_correct": true/false,
          "suggested_action": "KEEP" / "MOVE" / "DELETE",
          "target_concept_id": "ID of suggested concept (if MOVE)",
          "reasoning": "Brief explanation"
        }
      `;

            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: auditPrompt }],
                response_format: { type: "json_object" },
            });

            const result = JSON.parse(response.choices[0].message.content);

            if (!result.is_correct || result.suggested_action !== 'KEEP') {
                report.push({
                    id,
                    idiom: `${script} (${language})`,
                    current: universal_concept,
                    suggested: result.suggested_action,
                    target: result.target_concept_id,
                    reasoning: result.reasoning
                });
                console.log(`[ID ${id}] ${result.suggested_action}: ${result.reasoning}`);
            }
        }

        console.log('\n--- CONCEPTUAL MAPPING AUDIT REPORT ---');
        console.log(JSON.stringify(report, null, 2));

    } catch (err) {
        console.error("Audit failed:", err);
    } finally {
        await pool.end();
    }
}

auditConceptualMapping();
