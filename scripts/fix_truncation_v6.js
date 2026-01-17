import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_FILE = path.join(__dirname, '../start_data.json');

// Map of truncated strings to full sentences
const REPLACEMENTS = {
    // Paradox of Haste
    "La gatta frettolosa...": "La gatta frettolosa fece i gattini ciechi.",
    "Ära kiirusta...": "Ära kiirusta, tasa sõuad, kaugele jõuad.",
    "Don't rush the project. Tishe yedesh...": "Don't rush the project. Tishe yedesh, dal'she budesh.",

    // Art of Patience
    "Boond boond se sagar...": "Boond boond se sagar bharta hai.",
    "Chiri mo tsumoreba...": "Chiri mo tsumoreba yama to naru.",
    "Be patient. Sabr talkh ast...": "Be patient. Sabr talkh ast, velikan bar-e shirin darad.",
    "Keep studying. Co cong mai sat...": "Keep studying. Co cong mai sat, co ngay nen kim.",

    // Noise of Emptiness
    "He's just an Adhjal gagri...": "He's just an Adhjal gagri chhal-kat jaay.",
    "Mucho ruido...": "Mucho ruido y pocas nueces.",
    "Ignore his bragging...": "Ignore his bragging; empty vessels make the most noise.",
    "Ignore his threats. Pustaya bochka...": "Ignore his threats. Pustaya bochka pushche gremit.",

    // Tragedy of Value
    "Bandar kya jaane...": "Bandar kya jaane adrak ka swaad.",
    "He doesn't appreciate the music...": "He doesn't appreciate the music; it's like casting pearls before swine.",

    // Hypocrisy
    "Why blame me...": "Why blame me? The finger never points at itself."
};

try {
    const raw = fs.readFileSync(TARGET_FILE, 'utf8');
    const data = JSON.parse(raw);
    let updatedCount = 0;

    data.concepts.forEach(c => {
        c.idioms.forEach(idiom => {
            // Fix usage_example.native
            if (idiom.usage_example && idiom.usage_example.native) {
                for (const [truncated, full] of Object.entries(REPLACEMENTS)) {
                    if (idiom.usage_example.native.includes(truncated)) {
                        idiom.usage_example.native = full;
                        updatedCount++;
                    }
                }
            }
            // Fix transliteration if it was also truncated (saw one case in grep)
            if (idiom.transliteration) {
                for (const [truncated, full] of Object.entries(REPLACEMENTS)) {
                    // Heuristic: if transliteration ends in "...", replace it
                    if (idiom.transliteration.endsWith("...") && full.toLowerCase().includes(idiom.transliteration.replace("...", "").toLowerCase().trim())) {
                        idiom.transliteration = full; // This might be too aggressive, but let's see
                        updatedCount++;
                    }
                }
            }
            // Specific fix for "Finger neber say look here..." transliteration
            if (idiom.language === "Jamaican Patois" && idiom.transliteration === "Finger neber say look here...") {
                idiom.transliteration = "Finger neber say 'look here,' him say 'look yonder'";
                updatedCount++;
            }
        });
    });

    data.metadata.version = "2.6 (Unabridged)";

    fs.writeFileSync(TARGET_FILE, JSON.stringify(data, null, 4));
    console.log(`Success! Fixed truncation in ${updatedCount} entries.`);

} catch (err) {
    console.error("Error:", err);
    process.exit(1);
}
