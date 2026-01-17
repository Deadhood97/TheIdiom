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
        const { rows: idioms } = await pool.query('SELECT i.*, c.universal_concept FROM idioms i JOIN concepts c ON i.concept_id = c.id');
        const { rows: concepts } = await pool.query('SELECT * FROM concepts');
        const conceptMap = concepts.reduce((acc, c) => ({ ...acc, [c.id]: c.universal_concept }), {});

        console.log(`Checking ${idioms.length} idioms...`);

        for (const idiom of idioms) {
            const { id, language, script, universal_concept, origin_story } = idiom;
            let needsRepair = false;
            let reason = '';

            // 1. Structural/Placeholder check
            if (script && (script.trim() === language || ['Latin', 'Arabic', 'Portuguese', 'Hindi'].includes(script.trim()))) {
                needsRepair = true;
                reason = 'Placeholder script detected';
            }

            // 2. Mismatch check (ID 16 case)
            const textBlob = JSON.stringify(idiom).toLowerCase();
            if (language === 'Latin' && (textBlob.includes('portuguese') || textBlob.includes('brazil'))) {
                needsRepair = true;
                reason = 'Latin entry with Portuguese metadata';
            }

            // 3. Missing Native Script for non-Latin
            const nonLatinLangs = ['Hindi', 'Arabic', 'Japanese', 'Chinese', 'Farsi', 'Korean', 'Tamil', 'Telugu', 'Bengali'];
            const hasNonAscii = /[^\x00-\x7F]/.test(script || '');
            if (nonLatinLangs.includes(language) && !hasNonAscii) {
                needsRepair = true;
                reason = 'Missing native characters';
            }

            // 4. Quality check
            if (origin_story && origin_story.length < 50) {
                needsRepair = true;
                reason = 'Origin story too brief';
            }

            if (needsRepair) {
                console.log(`[ID ${id}] Repairing: ${language} - ${reason}`);

                const repairPrompt = `
          You are a World-Class Linguistic Expert. 
          The following idiom entry in the archive has data corruption or metadata mismatches.
          
          ENTRY TO REPAIR:
          ${JSON.stringify(idiom, null, 2)}
          
          TARGET CONCEPT: "${universal_concept}"
          TARGET LANGUAGE: "${language}"

          ISSUE: ${reason}

          TASK:
          Re-generate the idiom data correctly for the TARGET LANGUAGE and TARGET CONCEPT.
          - If the language is Latin, it MUST be a real Latin idiom.
          - If the language is Arabic, it MUST include the native Arabic script.
          - Disentangle any mixed-up cultures (e.g., if it's Latin, don't mention Brazil).
          - Ensure the origin_story is deep and meaningful (at least 80 characters).
          - Maintain the structure below.

          RETURN JSON:
          {
            "script": "Authentic native script",
            "transliteration": "Latin phonetics",
            "literal_translation": "Word-for-word",
            "meaning": "Deeper meaning",
            "origin_story": "Detailed origin",
            "cultural_context": "Deep context",
            "usage_example": { "native": "...", "translation": "..." },
            "literature_reference": { "source": "...", "context": "..." },
            "pronunciation_easy": "Easy guide"
          }
        `;

                const response = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [{ role: "user", content: repairPrompt }],
                    response_format: { type: "json_object" },
                });

                const corrected = JSON.parse(response.choices[0].message.content);

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
                        id
                    ]
                );
                console.log(`[ID ${id}] ✅ Repaired and saved.`);
            }
        }

        console.log("Batch repair complete.");

    } catch (err) {
        console.error("Repair failed:", err);
    } finally {
        await pool.end();
    }
}

repairIdioms();
