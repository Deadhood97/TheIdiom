import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../start_data.json');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function enrich() {
    console.log("📖 Reading data...");
    const rawData = await fs.readFile(DATA_FILE, 'utf8');
    let data = JSON.parse(rawData);

    console.log(`🌍 Starting enrichment for ${data.concepts.length} concepts...`);

    for (let i = 0; i < data.concepts.length; i++) {
        const concept = data.concepts[i];
        console.log(`\nProcessing: ${concept.universal_concept} (${i + 1}/${data.concepts.length})`);

        // 1. Generate New Idioms & Geodata
        const prompt = `
      Universal Concept: "${concept.universal_concept}"
      Current Idioms: ${JSON.stringify(concept.idioms.map(id => id.language))}
      
      Task:
      1. Generate 5 NEW idioms from diverse regions (e.g., Japan, Nigeria, Brazil, Germany, Middle East) that match this concept.
      2. For each new idiom, provide: language, script, pronunciation_easy, literal_translation, origin_story, usage_level, risk_level.
      3. For ALL idioms (both new and existing provided above), determine a 'geolocation' { lat: number, lng: number } representing the rough origin city/region.
      4. For ALL idioms, add a 'historical_period' string (e.g., "Edo Period", "19th Century").
      
      Return JSON format:
      {
        "new_idioms": [ ... ],
        "geolocation_map": { 
           "Original_Idiom_Script_Or_Language": { lat: 0, lng: 0, period: "" } // Map keys to identify them
        }
      }
    `;

        const draftResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
        });

        const draft = JSON.parse(draftResponse.choices[0].message.content);

        // 2. Verification (The Critic)
        const criticPrompt = `
      Verify these new idioms for the concept "${concept.universal_concept}":
      ${JSON.stringify(draft.new_idioms)}
      
      Are these real idioms? Do they actually mean "${concept.universal_concept}"?
      Reject any that are literal translations of the English phrase or hallucinations.
      
      Return JSON:
      {
        "approved_indices": [0, 1, 3] // List of indices of safe/real idioms.
      }
    `;

        const criticResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: criticPrompt }],
            response_format: { type: "json_object" },
        });

        const verdict = JSON.parse(criticResponse.choices[0].message.content);
        const validNewIdioms = draft.new_idioms.filter((_, idx) => verdict.approved_indices.includes(idx));

        console.log(`   + Added ${validNewIdioms.length} validated idioms.`);

        // 3. Merge Data
        // Add geodata to existing idioms
        concept.idioms = concept.idioms.map(idiom => {
            // Try to find matching geodata by language or script
            const geo = draft.geolocation_map[idiom.script] || draft.geolocation_map[idiom.language];
            if (geo) {
                return { ...idiom, geolocation: { lat: geo.lat, lng: geo.lng }, historical_period: geo.period };
            }
            return idiom;
        });

        // Valid new idioms with geodata
        const enrichedNewIdioms = validNewIdioms.map(idiom => {
            const geo = draft.geolocation_map[idiom.script] || draft.geolocation_map[idiom.language]; // Fallback
            if (geo) {
                return { ...idiom, geolocation: { lat: geo.lat, lng: geo.lng }, historical_period: geo.period };
            }
            return idiom; // Should rarely happen if LLM follows instructions
        });

        // Combine
        concept.idioms = [...concept.idioms, ...enrichedNewIdioms];
    }

    console.log("\n💾 Saving enriched data...");
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 4));
    console.log("✅ Done!");
}

enrich().catch(console.error);
