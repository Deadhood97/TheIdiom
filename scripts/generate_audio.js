import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../start_data.json');
const AUDIO_DIR = path.join(__dirname, '../public/audio');

// Ensure audio dir exists
if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Helper to sanitize filenames
const sanitize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '_');

async function generateAudio() {
    console.log("📖 Reading data...");
    const rawData = fs.readFileSync(DATA_FILE, 'utf8');
    let data = JSON.parse(rawData);

    console.log(`🎧 Starting Audio Generation for ${data.concepts.length} concepts...`);

    let generatedCount = 0;

    for (const concept of data.concepts) {
        console.log(`\nProcessing Concept: ${concept.universal_concept}`);

        for (const idiom of concept.idioms) {
            // Create a unique filename: concept_slug + language + script_hash/prefix
            // We'll use a simplified distinct name
            const langCode = sanitize(idiom.language);
            const scriptSnippet = sanitize(idiom.script).substring(0, 15);
            const filename = `${concept.slug}_${langCode}_${scriptSnippet}.mp3`;
            const filePath = path.join(AUDIO_DIR, filename);
            const publicUrl = `/audio/${filename}`;

            // Skip if file exists and we have the URL in data
            if (fs.existsSync(filePath) && idiom.audio_url === publicUrl) {
                // console.log(`   - Skipped (Exists): ${idiom.language}`);
                continue;
            }

            console.log(`   + Generating: ${idiom.language} - "${idiom.script}"...`);

            try {
                const mp3 = await openai.audio.speech.create({
                    model: "tts-1",
                    voice: "alloy", // 'alloy' is generally neutral and clear for mixed languages
                    input: idiom.script,
                });

                const buffer = Buffer.from(await mp3.arrayBuffer());
                fs.writeFileSync(filePath, buffer);

                // Update data with the URL
                idiom.audio_url = publicUrl;
                generatedCount++;

            } catch (error) {
                console.error(`   ❌ Failed to generate audio for ${idiom.script}:`, error.message);
            }
        }
    }

    if (generatedCount > 0) {
        console.log(`\n💾 Updates! Saving ${generatedCount} new audio paths to start_data.json...`);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 4));
    } else {
        console.log("\n✨ All audio up to date.");
    }

    console.log("✅ Audio Generation Complete!");
}

generateAudio().catch(console.error);
