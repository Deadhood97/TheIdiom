
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const MOVES = [
    { id: 4, target: 'CONC_PEARLS' }, // Telugu Conch: Unappreciated Value
    { id: 12, target: 'CONC_HASTE' },  // Tamil Head/Foot: Overwhelming/Haste
    { id: 16, target: 'CONC_05' },     // Punjabi Dog: Chaos/Aimlessness
    { id: 28, target: 'CONC_05' },     // Bengali Salt/Rice: Chaos/Frantic Cycle
    { id: 34, target: 'CONC_06' },     // Punjabi Snake: Inescapable Nature
    { id: 45, target: 'CONC_HASTE' },  // Swahili Haste: Paradox of Haste
    { id: 65, target: 'CONC_HASTE' }   // Farsi Pit/Well: Paradox of Haste
];

async function run() {
    try {
        for (const move of MOVES) {
            const res = await pool.query('UPDATE idioms SET concept_id = $1 WHERE id = $2', [move.target, move.id]);
            console.log(`✅ Moved ID ${move.id} to ${move.target} (Rows updated: ${res.rowCount})`);
        }
        console.log('--- SEMANTIC RE-ALIGNMENT COMPLETE ---');
    } catch (e) {
        console.error('Batch fix failed:', e);
    } finally {
        await pool.end();
    }
}

run();
