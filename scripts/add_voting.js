import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../start_data.json');

async function addVotingData() {
    try {
        console.log("Reading data...");
        const rawData = await fs.readFile(DATA_FILE, 'utf8');
        const data = JSON.parse(rawData);

        console.log("Adding voting fields...");
        let updatedCount = 0;

        data.concepts.forEach(concept => {
            concept.idioms.forEach(idiom => {
                if (!idiom.voting) {
                    idiom.voting = {
                        resonance: Math.floor(Math.random() * 50) + 10, // Simulated initial data
                        accuracy: Math.floor(Math.random() * 20) + 5
                    };
                    updatedCount++;
                }
            });
        });

        console.log(`Updated ${updatedCount} idioms with voting data.`);

        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 4));
        console.log("💾 Saved updated data.");

    } catch (e) {
        console.error("Error:", e);
    }
}

addVotingData();
