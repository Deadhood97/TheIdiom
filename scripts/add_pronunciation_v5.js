import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_FILE = path.join(__dirname, '../start_data.json');

// Map of ID/Language to Pronunciation
const PRONUNCIATIONS = {
    // V2 Concepts
    "Paradox of Haste": {
        "Italian": "La gat-ta fret-to-lo-sa...",
        "Japanese": "Ee-so-ga-ba ma-wa-re",
        "Estonian": "Ta-sa so-uad, kau-ge-le yo-uad",
        "Swahili": "Ha-ra-ka ha-ra-ka ha-ee-na ba-ra-ka",
        "Russian": "Tee-she ye-desh dal-she boo-desh"
    },
    "Art of Patience": {
        "Hindi": "Boond boond say saa-gar bhar-ta hay",
        "Japanese": "Chi-ri mo tsu-mo-re-ba ya-ma to na-ru",
        "Latin": "Goo-ta ka-vat la-pi-dem",
        "Persian": "Sabr talkh ast, ve-lee-kan bar-e shee-reen da-rad",
        "Vietnamese": "Kaw kong mai sat, kaw ngay nen kim"
    },
    "Noise of Emptiness": {
        "Hindi": "Adh-jal gag-ree chhal-kat ja-ay",
        "Spanish": "Moo-cho rwee-do ee po-kas nwe-ses",
        "Bengali": "Kha-li kol-shi ba-jay be-shi",
        "Turkish": "Bosh te-ne-ke chok ses chi-ka-rir",
        "Russian": "Poos-ta-ya boch-ka poosh-che gre-meet"
    },
    "Tragedy of Unappreciated Value": {
        "Hindi": "Ban-dar kya jaa-nay ad-rak ka swaad",
        "Tamil": "Ka-zhu-thaik-ku te-ri-yu-ma kar-poo-ra vaa-sa-nai",
        "English": "Casting pearls before swine", // Already exists but safe to have
        "Japanese": "Bu-ta ni shin-ju",
        "German": "Oy-len nahkh A-ten tra-gen"
    },
    // V3 Enriched (Sparse Concepts)
    "Summit of Joy": {
        "Persian": "Dar poost-e khod na-gon-jee-dan"
    },
    "Chaos of Activity": {
        "Russian": "Kroo-teet-sya kak bel-ka v ko-le-se",
        "Turkish": "Ee-kee a-ya-gi bir pa-boo-ja gir-mek"
    },
    "Inescapable Nature": {
        "Swahili": "Mwa-na wa nyo-ka nee nyo-ka"
    }
};

try {
    const raw = fs.readFileSync(TARGET_FILE, 'utf8');
    const data = JSON.parse(raw);
    let updatedCount = 0;

    data.concepts.forEach(c => {
        // Determine lookup key (using the new titles or slugs)
        // Our map keys are approximate matches to the titles
        let lookupKey = null;
        if (c.universal_concept.includes("Haste")) lookupKey = "Paradox of Haste";
        else if (c.universal_concept.includes("Patience")) lookupKey = "Art of Patience";
        else if (c.universal_concept.includes("Emptiness")) lookupKey = "Noise of Emptiness";
        else if (c.universal_concept.includes("Unappreciated")) lookupKey = "Tragedy of Unappreciated Value";
        else if (c.universal_concept.includes("Summit of Joy")) lookupKey = "Summit of Joy";
        else if (c.universal_concept.includes("Chaos")) lookupKey = "Chaos of Activity";
        else if (c.universal_concept.includes("Inescapable")) lookupKey = "Inescapable Nature";

        if (lookupKey && PRONUNCIATIONS[lookupKey]) {
            c.idioms.forEach(idiom => {
                if (PRONUNCIATIONS[lookupKey][idiom.language]) {
                    if (!idiom.pronunciation_easy) {
                        idiom.pronunciation_easy = PRONUNCIATIONS[lookupKey][idiom.language];
                        updatedCount++;
                    }
                }
            });
        }
    });

    data.metadata.version = "2.5 (Phonetic Guides)";

    fs.writeFileSync(TARGET_FILE, JSON.stringify(data, null, 4));
    console.log(`Success! Added pronunciation guides to ${updatedCount} idioms.`);

} catch (err) {
    console.error("Error:", err);
    process.exit(1);
}
