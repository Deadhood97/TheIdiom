import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../start_data.json');

async function addImages() {
    console.log("📖 Reading data...");
    const rawData = await fs.readFile(DATA_FILE, 'utf8');
    let data = JSON.parse(rawData);

    const images = {
        "redundant-effort": "/assets/concepts/redundant-effort.png",
        "sudden-joy": "/assets/concepts/sudden-joy.png",
        "hypocrisy": "/assets/concepts/hypocrisy.png",
        "impossible": "/assets/concepts/impossible.png",
        "panic-chaos": "/assets/concepts/panic-chaos.png",
        "fixed-nature": "/assets/concepts/fixed-nature.png",
        "all-bark-no-bite": "/assets/concepts/all-bark-no-bite.png",
        "wasted-value": "/assets/concepts/wasted-value.png"
    };

    data.concepts = data.concepts.map(c => {
        if (images[c.slug]) {
            return { ...c, image: images[c.slug] };
        }
        return c;
    });

    console.log("\n💾 Saving image paths...");
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 4));
    console.log("✅ Done!");
}

addImages().catch(console.error);
