
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

async function testSpecificIdioms() {
    try {
        // Fetch IDs 10 (Hindi) and 16 (Punjabi)
        const { rows: idioms } = await pool.query('SELECT i.*, c.universal_concept, c.description, c.keywords FROM idioms i JOIN concepts c ON i.concept_id = c.id WHERE i.id IN (10, 16)');
        const { rows: allConcepts } = await pool.query('SELECT id, universal_concept, description, keywords FROM concepts');

        const conceptMatrix = allConcepts.map(c => `ID: ${c.id}\nTitle: ${c.universal_concept}\nLogic: ${c.description}\nKeywords: ${c.keywords}\n---`).join('\n');

        console.log(`\n🧪 Testing Refined Semantic Logic for ${idioms.length} target idioms...\n`);

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
           - EXAMPLE: In Hindi, "lighting ghee lamps" is a reference to Lord Rama's return (Extreme Joy), even if literally it sounds "redundant".
        2. Is there another concept in the Matrix that is a SIGNIFICANTLY better fit? 
        3. If it's a "Close Fit" OR "Culturally Specific Match", KEEP it. If it's a "Strong Divergence", MOVE it.

        RETURN JSON:
        {
          "suggested_action": "KEEP" / "MOVE" / "DELETE",
          "score_current": 1-10,
          "reasoning": "Detailed explanation of cultural alignment"
        }
      `;

            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: auditPrompt }],
                response_format: { type: "json_object" },
            });

            const result = JSON.parse(response.choices[0].message.content);
            console.log(`--------------------------------------------------`);
            console.log(`[ID ${id}] ${language}: "${script}"`);
            console.log(`Action: ${result.suggested_action} (${result.score_current}/10)`);
            console.log(`REASONING: ${result.reasoning}`);
            console.log(`--------------------------------------------------\n`);
        }

    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        await pool.end();
    }
}

testSpecificIdioms();
