import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function audit() {
    try {
        const { rows: idioms } = await pool.query('SELECT i.*, c.universal_concept FROM idioms i JOIN concepts c ON i.concept_id = c.id ORDER BY language');

        const report = {};

        idioms.forEach(idiom => {
            const issues = [];
            const { id, language, script, literal_translation, origin_story, cultural_context, usage_example, literature_reference, universal_concept } = idiom;

            const textBlob = JSON.stringify(idiom).toLowerCase();

            // 1. Language Mismatch
            const detectedLangs = [];
            ['portuguese', 'brazil', 'spanish', 'mexic', 'french', 'german', 'japanese', 'hindi', 'farsi', 'latin', 'swahili', 'swedish', 'korean', 'irish'].forEach(l => {
                if (textBlob.includes(l)) detectedLangs.push(l);
            });

            const currentLang = (language || 'unknown').toLowerCase();

            // If language is Latin but metadata is exclusively Portuguese/Spanish
            if (currentLang === 'latin' && (textBlob.includes('portuguese') || textBlob.includes('brazil') || textBlob.includes('spanish'))) {
                issues.push(`POTENTIAL MISMATCH: Language is Latin but metadata mentions ${detectedLangs.filter(l => l !== 'latin').join(', ')}`);
            }

            // If language is Portuguese but metadata mentions Spanish etc. (except for comparisons)
            if (currentLang === 'portuguese' && textBlob.includes('mexic')) {
                issues.push('POTENTIAL MISMATCH: Language is Portuguese but mentions Mexico');
            }

            // 2. Placeholder Check
            if (!script || script.includes('???') || script === '') {
                issues.push('ERROR: Missing or placeholder script');
            }

            // 3. Script vs Language Check (simple ASCII vs non-ASCII)
            const isEnglish = currentLang === 'english';
            const hasNonAscii = /[^\x00-\x7F]/.test(script);
            if (isEnglish && hasNonAscii) {
                issues.push('WARNING: English idiom with non-ASCII script');
            }
            if (!isEnglish && !hasNonAscii && !['latin', 'swedish', 'german', 'french', 'spanish', 'portuguese', 'irish'].includes(currentLang)) {
                // Languages like Hindi, Japanese, Farsi MUST have non-ASCII
                issues.push(`WARNING: ${language} idiom with only ASCII script (missing native characters)`);
            }

            // 4. Cultural Context / Literature
            if (origin_story && origin_story.length < 10) issues.push('LOW QUALITY: Short origin story');

            if (issues.length > 0) {
                if (!report[language]) report[language] = [];
                report[language].push({ id, script, literal_translation, issues });
            }
        });

        console.log('--- INCONSISTENCY REPORT ---');
        console.log(JSON.stringify(report, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

audit();
