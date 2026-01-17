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

async function repairIdioms() {
    try {
        // Explicitly target IDs that are known to be broken or common candidates
        const { rows: idioms } = await pool.query('SELECT i.*, c.universal_concept FROM idioms i JOIN concepts c ON i.concept_id = c.id WHERE i.id IN (16, 18, 19, 25, 26, 37, 24, 39)');

        for (const idiom of idioms) {
            console.log(`[ID ${idiom.id}] Forcing targeted repair for ${idiom.language}...`);

            const repairPrompt = `
        You are a World-Class Linguistic Expert. 
        The following idiom entry is CORRUPT. 
        The "script" field contains a placeholder like "Latin" or "Portuguese" instead of an actual idiom.
        Or the metadata is mixed with the wrong culture.

        ENTRY TO REPAIR:
        ${JSON.stringify(idiom, null, 2)}
        
        CONCEPT: "${idiom.universal_concept}"
        LANGUAGE: "${idiom.language}"

        CRITICAL INSTRUCTIONS:
        1. Find a REAL, AUTHENTIC idiom in "${idiom.language}" for the concept "${idiom.universal_concept}".
        2. The "script" field MUST NOT be the name of the language (e.g., do not return "Latin", return "Gutta cavat lapidem").
        3. If the language is "${idiom.language}", ALL cultural context, usage examples, and origin stories MUST belong to "${idiom.language}" culture.
        4. If it's a non-Latin language (Arabic, Hindi, etc.), use the NATIVE SCRIPT.
        5. Return a deep, high-quality entry.

        RETURN JSON:
        {
          "script": "Authentic script (NATIVE CHARS if applicable)",
          "transliteration": "Latin phonetics",
          "literal_translation": "English translation",
          "meaning": "Deeper meaning",
          "origin_story": "Detailed historical/folkloric origin (min 100 chars)",
          "cultural_context": "How it reflects ${idiom.language} culture",
          "usage_example": { "native": "Sentence in native script", "translation": "English" },
          "literature_reference": { "source": "Book/Author/Era", "context": "Context" },
          "pronunciation_easy": "English-friendly phonetics"
        }
      `;

            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: repairPrompt }],
                response_format: { type: "json_object" },
            });

            const corrected = JSON.parse(response.choices[0].message.content);

            // Final safety check: if AI still returns the language name as script, we abort for that ID
            if (corrected.script.trim().toLowerCase() === idiom.language.toLowerCase()) {
                console.error(`[ID ${idiom.id}] ❌ AI returned placeholder again. Skipping.`);
                continue;
            }

            await pool.query(
                `UPDATE idioms SET 
          script = $1,
          transliteration = $2,
          literal_translation = $3,
          meaning = $4,
          origin_story = $5,
          cultural_context = $6,
          usage_example = $7,
          literature_reference = $8,
          pronunciation_easy = $9
         WHERE id = $10`,
                [
                    corrected.script,
                    corrected.transliteration,
                    corrected.literal_translation,
                    corrected.meaning,
                    corrected.origin_story,
                    corrected.cultural_context,
                    JSON.stringify(corrected.usage_example),
                    JSON.stringify(corrected.literature_reference),
                    corrected.pronunciation_easy,
                    idiom.id
                ]
            );
            console.log(`[ID ${idiom.id}] ✅ Fixed: ${corrected.script}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

repairIdioms();
