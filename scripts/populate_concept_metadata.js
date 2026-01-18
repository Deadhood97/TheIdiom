
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;
dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const METADATA = {
    'CONC_01': {
        desc: 'Performing a redundant or useless act by bringing something to a place where it is already plentiful.',
        keys: 'carrying coals to Newcastle, lighting a lamp in front of the sun, redundant effort, useless act'
    },
    'CONC_02': {
        desc: 'A state of absolute happiness, ecstatic delight, or supreme bliss.',
        keys: 'seventh heaven, over the moon, highest joy, pure bliss'
    },
    'CONC_03': {
        desc: 'The act of criticizing others for flaws that one possesses themselves, often in greater measure.',
        keys: 'pot calling the kettle black, sieve laughing at the needle, double standards, hypocrite'
    },
    'CONC_04': {
        desc: 'Something that is fundamentally impossible or absurd and will never happen.',
        keys: 'when pigs fly, when hens have teeth, fetching water with a sieve, impossible'
    },
    'CONC_05': {
        desc: 'Performing work that leads to more chaos, or frantic, aimless activity without real progress.',
        keys: 'running in circles, frantic activity, aimless effort, busy for nothing'
    },
    'CONC_06': {
        desc: 'A fundamental character trait, nature, or fate that cannot be changed despite effort.',
        keys: 'leopard spots, snake and milk, inherent nature, unchangeable, destiny'
    },
    'CONC_07': {
        desc: 'Making a loud noise or boastful claim but having no real substance, value, or power inside.',
        keys: 'all bark no bite, all talk no action, hollow thunder, boisterous but weak'
    },
    'CONC_EMPTY': {
        desc: 'The sound or presence of something that lacks substance, depth, or true knowledge.',
        keys: 'empty vessel, loud but shallow, lack of depth, hollow drum'
    },
    'CONC_HASTE': {
        desc: 'The irony that rushing often leads to mistakes, poorer results, or slower overall progress.',
        keys: 'more haste less speed, hurry hurry has no blessing, rushing leads to waste'
    },
    'CONC_PATIENCE': {
        desc: 'The virtue of waiting or moving slowly and steadily to achieve a great goal over time.',
        keys: 'patience, slow and steady, mountain carved by water, drop by drop'
    },
    'CONC_PEARLS': {
        desc: 'Offering something of high value or beauty to those who are incapable of appreciating its worth.',
        keys: 'pearls before swine, diamonds to dust, unappreciated value, wasted wisdom'
    }
};

const run = async () => {
    try {
        for (const [id, meta] of Object.entries(METADATA)) {
            await pool.query('UPDATE concepts SET description = $1, "keywords" = $2 WHERE id = $3', [meta.desc, meta.keys, id]);
            console.log('✅ Updated:', id);
        }
        console.log('--- ALL CONCEPTS ENRICHED ---');
    } catch (e) {
        console.error('Population failed:', e.message);
    } finally {
        await pool.end();
    }
};
run();
