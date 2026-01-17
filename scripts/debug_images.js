import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../start_data.json');

async function debugImages() {
    console.log("📖 Reading data...");
    const rawData = await fs.readFile(DATA_FILE, 'utf8');
    let data = JSON.parse(rawData);

    const images = {
        "redundant-effort": "/assets/concepts/redundant-effort.png",
        "extreme-happiness": "/assets/concepts/extreme-happiness.png",
        "hypocrisy": "/assets/concepts/hypocrisy.png",
        "impossibility": "/assets/concepts/impossibility.png",
        "frantic-activity": "/assets/concepts/frantic-activity.png",
        "unchangeable-nature": "/assets/concepts/unchangeable-nature.png",
        "all-talk": "/assets/concepts/all-talk.png",
        "unrequited-wisdom": "/assets/concepts/unrequited-wisdom.png"
    };

    let updatedCount = 0;
    data.concepts = data.concepts.map(c => {
        console.log(`Checking slug: '${c.slug}'`);
        if (images[c.slug]) {
            console.log(`   -> Match found! Adding image: ${images[c.slug]}`);
            updatedCount++;
            return { ...c, image: images[c.slug] };
        } else {
            console.log(`   -> NO MATCH for '${c.slug}'`);
        }
        return c;
    });

    console.log(`\nUpdated ${updatedCount} concepts.`);
    console.log(`Writing to: ${DATA_FILE}`);
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 4));
    console.log("💾 Saved.");

    const verify = await fs.readFile(DATA_FILE, 'utf8');
    console.log("Verify first 200 chars:", verify.substring(0, 200));
    console.log("✅ Done!");
}

debugImages().catch(console.error);
