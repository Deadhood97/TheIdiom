import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../start_data.json');

async function migrate() {
  try {
    console.log('📦 Starting Migration to NeonDB...');

    // 0. Reset Schema (Drop Tables to ensure new schema is applied)
    await query('DROP TABLE IF EXISTS idioms, concepts CASCADE');
    console.log('🗑️  Old tables dropped.');

    // 1. Create Tables
    await query(`
      CREATE TABLE IF NOT EXISTS concepts (
        id VARCHAR(255) PRIMARY KEY,
        universal_concept VARCHAR(255) NOT NULL,
        emoji VARCHAR(10),
        image TEXT
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS idioms (
        id SERIAL PRIMARY KEY,
        concept_id VARCHAR(255) REFERENCES concepts(id),
        script TEXT NOT NULL,
        language VARCHAR(100),
        transliteration TEXT,
        literal_translation TEXT,
        meaning TEXT,
        origin_story TEXT,
        cultural_context TEXT,
        usage_example JSONB,
        literature_reference JSONB,
        geolocation JSONB,
        voting JSONB DEFAULT '{"resonance": 0, "accuracy": 0}'::jsonb,
        audio_url TEXT,
        pronunciation_easy TEXT
      );
    `);

    console.log('✅ Tables created.');

    // 2. Read Data
    const rawData = await fs.readFile(DATA_FILE, 'utf8');
    const { concepts } = JSON.parse(rawData);

    // 3. Insert Data
    for (const concept of concepts) {
      // Insert Concept
      await query(
        'INSERT INTO concepts (id, universal_concept, emoji, image) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
        [concept.id, concept.universal_concept, concept.emoji, concept.image]
      );
      console.log(`   -> Concept: ${concept.universal_concept}`);

      // Insert Idioms
      for (const idiom of concept.idioms) {
        await query(
          `INSERT INTO idioms (
            concept_id, script, language, transliteration, literal_translation, 
            meaning, origin_story, cultural_context, usage_example, 
            literature_reference, geolocation, voting,
            audio_url, pronunciation_easy
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            concept.id,
            idiom.script,
            idiom.language,
            idiom.transliteration,
            idiom.literal_translation,
            idiom.meaning,
            idiom.origin_story,
            idiom.cultural_context,
            JSON.stringify(idiom.usage_example),
            JSON.stringify(idiom.literature_reference),
            JSON.stringify(idiom.geolocation),
            JSON.stringify(idiom.voting || { resonance: 0, accuracy: 0 }),
            idiom.audio_url,
            idiom.pronunciation_easy
          ]
        );
      }
    }

    console.log('🎉 Migration Complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration Failed:', err);
    process.exit(1);
  }
}

migrate();
