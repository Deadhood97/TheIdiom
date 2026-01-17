import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function thoroughAudit() {
    try {
        const { rows: idioms } = await pool.query('SELECT * FROM idioms ORDER BY language, id');

        const report = [];

        idioms.forEach(idiom => {
            const { id, language, script, transliteration, literal_translation, meaning, origin_story, cultural_context, usage_example, literature_reference } = idiom;

            const errors = [];

            // 1. Structural Mismatch: Script field contains the language name instead of the actual idiom
            if (script && (script.trim() === language || script.trim() === 'Latin' || script.trim() === 'Arabic')) {
                errors.push('STRUCTURAL: Script field contains the language name, not the idiom text.');
            }

            // 2. Metadata Mismatch: Language vs Origin/Usage
            const text = JSON.stringify(idiom).toLowerCase();

            const langMapping = {
                'Latin': ['portuguese', 'brazil', 'spanish', 'mexico', 'hindi', 'farsi'],
                'Hindi': ['portuguese', 'brazil', 'spanish', 'latin'],
                'Japanese': ['korean', 'chinese', 'english'], // Japanese often borrows from Chinese (Kanji), so be careful
                'Farsi': ['hindi', 'arabic'], // Often related, but check for total mismatch
            };

            if (langMapping[language]) {
                langMapping[language].forEach(forbidden => {
                    if (text.includes(forbidden) && !text.includes('similar to') && !text.includes('translated as')) {
                        errors.push(`METADATA: ${language} entry contains references to ${forbidden} culture/language without clear comparison context.`);
                    }
                });
            }

            // 3. Native Script Missing for non-Latin languages
            const nonLatinLangs = ['Hindi', 'Arabic', 'Japanese', 'Chinese', 'Farsi', 'Korean', 'Tamil', 'Telugu', 'Bengali'];
            if (nonLatinLangs.includes(language)) {
                const hasNonAscii = /[^\x00-\x7F]/.test(script);
                if (!hasNonAscii) {
                    errors.push(`SCRIPT: ${language} entry is missing native characters (only ASCII found).`);
                }
            }

            // 4. Duplicate Meaning/Translation
            if (literal_translation === meaning) {
                errors.push('DATA: literal_translation and meaning are identical (lazy generation).');
            }

            // 5. Short content
            if (origin_story && origin_story.length < 50) {
                errors.push('QUALITY: origin_story is too brief.');
            }

            if (errors.length > 0) {
                report.push({ id, language, script, errors });
            }
        });

        console.log('--- FINAL AUDIT REPORT ---');
        console.log(JSON.stringify(report, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

thoroughAudit();
