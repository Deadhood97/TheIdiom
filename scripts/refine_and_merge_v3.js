import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_FILE = path.join(__dirname, '../start_data.json');

const TITLE_UPDATES = {
    "CONC_01": "The Paradox of Redundancy", // Was: Doing something pointless...
    "CONC_02": "The Summit of Joy", // Was: Sudden, overwhelming joy...
    "CONC_03": "The Mirror of Hypocrisy", // Was: Criticizing someone...
    "CONC_04": "The Horizon of Impossibility", // Was: Something that will never happen
    "CONC_05": "The Chaos of Activity", // Was: Being extremely busy...
    "CONC_06": "The Inescapable Nature", // Was: A person cannot change...
    "CONC_07": "The Hollow Thunder" // Was: Someone who threatens...
};

const ENRICHMENTS = {
    "CONC_HASTE": {
        "Italian": "A traditional warning from Italian folklore, emphasizing that patience is the mother of perfection, while haste leads to flawed results (blind kittens).",
        "Japanese": "Derived from a Renga poem about crossing Lake Biwa, this proverb advises that the 'safe' land route, though longer, is faster than the risky water shortcut.",
        "Estonian": "A maritime wisdom deeply rooted in Estonian culture, teaching that steady, rhythmic rowing conquers the distance better than a frantic, exhausting sprint."
    },
    "CONC_PATIENCE": {
        "Hindi": "A cornerstone of Indian wisdom, often used to teach patience and savings. It visualizes the immense power of accumulation over time.",
        "Japanese": "A profound concept from Japanese philosophy (often linked to Zen), illustrating how even the most insignificant particles, given enough time, can form majestic mountains.",
        "Latin": "From Ovid's 'Epistulae ex Ponto', this classic phrase reminds us that soft water conquers hard stone not by force, but by relentless persistence."
    },
    "CONC_EMPTY": {
        "Hindi": "A poetic observation often attributed to the Bhakti poet Kabir, describing those with superficial knowledge who boast loudly, unlike the quiet confidence of the truly wise.",
        "Spanish": "A classic Spanish proverb dating back centuries (appearing in 'Don Quixote'), contrasting the loud cracking of a nut with the disappointment of finding it empty inside.",
        "Bengali": "A folk saying from the Bengal region, using the acoustic properties of pitchers to mock empty braggarts."
    },
    "CONC_PEARLS": { // Merging into this one
        "Hindi": "A sharp folk critique of offering refinement to the uncultured. The monkey, seeking only sweet fruit, discards the spicy, sophisticated ginger as trash.",
        "Tamil": "A scent-based metaphor from South India. The donkey, a symbol of brute labor, lacks the spiritual sensitivity to appreciate Camphor's divine fragrance.",
        "English": "A biblical warning from the Sermon on the Mount, advising against sharing sacred wisdom with those who will only trample it in their ignorance."
    }
};

try {
    const raw = fs.readFileSync(TARGET_FILE, 'utf8');
    const data = JSON.parse(raw);

    // 1. Update Titles
    data.concepts.forEach(c => {
        if (TITLE_UPDATES[c.id]) {
            console.log(`Renaming ${c.slug} -> ${TITLE_UPDATES[c.id]}`);
            c.universal_concept = TITLE_UPDATES[c.id];
        }
    });

    // 2. Merge Duplicates (CONC_08 into CONC_PEARLS)
    const conc08Index = data.concepts.findIndex(c => c.id === "CONC_08");
    const concPearlsIndex = data.concepts.findIndex(c => c.id === "CONC_PEARLS");

    if (conc08Index !== -1 && concPearlsIndex !== -1) {
        console.log("Merging CONC_08 into CONC_PEARLS...");
        const conc08 = data.concepts[conc08Index];
        const concPearls = data.concepts[concPearlsIndex];

        // Merge idioms
        conc08.idioms.forEach(idiom => {
            if (!concPearls.idioms.find(i => i.language === idiom.language)) {
                concPearls.idioms.push(idiom);
            }
        });

        // Remove CONC_08
        data.concepts.splice(conc08Index, 1);
    }

    // 3. Enrich Data
    data.concepts.forEach(c => {
        if (ENRICHMENTS[c.id]) {
            c.idioms.forEach(idiom => {
                if (ENRICHMENTS[c.id][idiom.language]) {
                    idiom.literature_reference.context = ENRICHMENTS[c.id][idiom.language];
                }
            });
        }
    });

    // Update Metadata
    data.metadata.version = "2.3 (Enriched & Polished)";
    data.metadata.total_concepts = data.concepts.length;

    fs.writeFileSync(TARGET_FILE, JSON.stringify(data, null, 4));
    console.log(`Success! Total concepts: ${data.concepts.length}`);

} catch (err) {
    console.error("Error:", err);
    process.exit(1);
}
