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

async function enrichLinguist() {
    console.log("📖 Reading data...");
    const rawData = await fs.readFile(DATA_FILE, 'utf8');
    let data = JSON.parse(rawData);

    console.log(`📚 Starting linguistic enrichment for ${data.concepts.length} concepts...`);

    for (let i = 0; i < data.concepts.length; i++) {
        const concept = data.concepts[i];

        // Target V2 concepts for re-enrichment to ensure quality
        const forceEnrich = ["CONC_HASTE", "CONC_PATIENCE", "CONC_EMPTY", "CONC_PEARLS"].includes(concept.id);

        // Filter for idioms that need enrichment OR belong to V2 concepts we want to upgrade
        const idiomsToEnrich = concept.idioms.filter(idiom =>
            forceEnrich ||
            !idiom.literature_reference ||
            !idiom.usage_example ||
            (typeof idiom.literature_reference === 'string' && idiom.literature_reference.length < 10)
        ).map(id => ({ script: id.script, language: id.language }));

        if (idiomsToEnrich.length === 0) {
            console.log(`\nSkipping: ${concept.universal_concept} (All idioms already enriched)`);
            continue;
        }

        console.log(`\nProcessing: ${concept.universal_concept} (${i + 1}/${data.concepts.length}) - Enriching ${idiomsToEnrich.length} idioms`);

        const prompt = `
      Universal Concept: "${concept.universal_concept}"
      Idioms to Enrich: ${JSON.stringify(idiomsToEnrich)}
      
      Task:
      For EACH idiom provided above, generate:
      1. 'usage_example': A realistic sentence using the idiom in its native language (with English translation).
      2. 'literature_reference': A specific reference to where this idiom (or similar sentiment) appears in literature, pop culture, history, or oral tradition. Use "Oral Tradition" if no specific book/movie exists but it's folk wisdom.
      
      Return JSON format:
      {
        "enrichments": {
           "Idiom_Script_Here": {
              "usage_example": {
                 "native": "Original sentence string",
                 "translation": "English translation string"
              },
              "literature_reference": {
                 "source": "Title of Book / Movie / 'Oral Tradition'",
                 "context": "Brief explanation of how it is used there."
              }
           }
        }
      }
    `;

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
            });

            const result = JSON.parse(response.choices[0].message.content);
            const enrichments = result.enrichments;

            let updateCount = 0;
            concept.idioms = concept.idioms.map(idiom => {
                // If this idiom was in our target list, try to update it
                if (enrichments && enrichments[idiom.script]) {
                    updateCount++;
                    return { ...idiom, ...enrichments[idiom.script] };
                }
                return idiom;
            });

            console.log(`   + Enriched ${updateCount} idioms.`);
        } catch (error) {
            console.error(`   ❌ Failed to enrich concept: ${error.message}`);
        }
    }

    console.log("\n💾 Saving linguistic data...");
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 4));
    console.log("✅ Done!");
}

enrichLinguist().catch(console.error);
