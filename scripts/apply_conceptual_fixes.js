import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const RE_MAPPINGS = [
    { id: 4, target: 'CONC_EMPTY' }, // Telugu: Conch before deaf man
    { id: 12, target: 'CONC_EMPTY' }, // Tamil: Head or foot (Confusion)
    { id: 16, target: 'CONC_EMPTY' }, // Punjabi: Washerman's dog
    { id: 19, target: 'CONC_05' },    // Arabic: Flaw/Distress
    { id: 28, target: 'CONC_EMPTY' }, // Bengali: Rice/Salt (Shortage)
    { id: 34, target: 'CONC_04' },    // English: Snake friend (Impossibility)
    { id: 45, target: 'CONC_PATIENCE' }, // Swahili: Hurry no blessing
    { id: 46, target: 'CONC_PATIENCE' }, // Russian: Slower is further
    { id: 55, target: 'CONC_07' },    // Turkish: Empty tin can
    { id: 56, target: 'CONC_07' },    // English: Empty barrel
    { id: 61, target: 'CONC_01' },    // German: Owls to Athens
    { id: 65, target: 'CONC_06' },    // Farsi: Pit to well
];

async function applyFixes() {
    try {
        console.log(`Applying conceptual re-alignments for ${RE_MAPPINGS.length} idioms...`);

        for (const mapping of RE_MAPPINGS) {
            const res = await pool.query(
                'UPDATE idioms SET concept_id = $1 WHERE id = $2 RETURNING script, language',
                [mapping.target, mapping.id]
            );
            if (res.rowCount > 0) {
                const { script, language } = res.rows[0];
                console.log(`[ID ${mapping.id}] ${script} (${language}) -> ${mapping.target}`);
            } else {
                console.warn(`[ID ${mapping.id}] FAILED: ID not found.`);
            }
        }

        console.log("Conceptual re-alignment complete.");
    } catch (err) {
        console.error("Fix failed:", err);
    } finally {
        await pool.end();
    }
}

applyFixes();
