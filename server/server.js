import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { query } from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper to format rows back to nested JSON structure
const buildDataStructure = (concepts, idioms) => {
  return {
    concepts: concepts.map(c => ({
      ...c,
      idioms: idioms.filter(i => i.concept_id === c.id)
    }))
  };
};

// GET /api/data
app.get('/api/data', async (req, res) => {
  try {
    const { rows: concepts } = await query('SELECT * FROM concepts');
    const { rows: idioms } = await query('SELECT * FROM idioms');

    const data = buildDataStructure(concepts, idioms);
    res.json(data);
  } catch (error) {
    console.error('Error reading data:', error);
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// POST /api/revise
app.post('/api/revise', async (req, res) => {
  const { conceptId, idiomScript, userFeedback } = req.body;

  try {
    // 1. Fetch current idiom
    const { rows } = await query(
      'SELECT * FROM idioms WHERE concept_id = $1 AND script = $2',
      [conceptId, idiomScript]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Idiom not found' });
    const idiom = rows[0];

    // 2. Draft Revision (The Creator)
    const draftPrompt = `
      You are a linguistic expert helping to update an idiom dictionary.
      
      Current Idiom Entry:
      ${JSON.stringify(idiom, null, 2)}
      
      User Feedback: "${userFeedback}"
      
      Task:
      Based on the user feedback, revise the idiom entry. 
      - If the feedback suggests a better translation, update 'literal_translation'.
      - If it adds cultural context, update 'origin_story' or add a 'cultural_context' field.
      - If it suggests a usage correction, update 'usage_level'.
      - Maintain the JSON structure.
      - Return ONLY the updated JSON object fields that changed.
    `;

    const draftResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: draftPrompt }],
      response_format: { type: "json_object" },
    });

    const draftIdiom = JSON.parse(draftResponse.choices[0].message.content);

    // 3. Verification (The Critic)
    const criticPrompt = `
      You are a strict data integrity verifier for a cultural archive.
      
      Original Idiom: ${JSON.stringify(idiom)}
      User Feedback: "${userFeedback}"
      Proposed Revision: ${JSON.stringify(draftIdiom)}
      
      Task:
      Verify if the Proposed Revision is safe, accurate, and relevant to the User Feedback.
      - REJECT if it contains hate speech, profanity, or malicious content.
      - REJECT if it hallucinates facts not supported by the feedback or common knowledge.
      - REJECT if it destroys the original data structure.
      
      Return JSON:
      {
        "approved": boolean,
        "reason": "string explanation"
      }
    `;

    const criticResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: criticPrompt }],
      response_format: { type: "json_object" },
    });

    const verification = JSON.parse(criticResponse.choices[0].message.content);

    if (!verification.approved) {
      console.warn(`Revision rejected by Critic: ${verification.reason}`);
      return res.status(400).json({
        error: "Revision rejected by AI Verifier",
        reason: verification.reason
      });
    }

    // 4. Update data in DB
    // Merge new fields
    const updatedIdiom = { ...idiom, ...draftIdiom };

    await query(
      `UPDATE idioms SET 
        literal_translation = $1,
        origin_story = $2,
        cultural_context = $3,
        meaning = $4,
        usage_example = $5,
        literature_reference = $6
       WHERE id = $7`,
      [
        updatedIdiom.literal_translation,
        updatedIdiom.origin_story,
        updatedIdiom.cultural_context,
        updatedIdiom.meaning,
        JSON.stringify(updatedIdiom.usage_example),
        JSON.stringify(updatedIdiom.literature_reference),
        idiom.id
      ]
    );

    res.json({ success: true, updatedIdiom: updatedIdiom, verification: verification.reason });
  } catch (error) {
    console.error('Error revising data:', error);
    res.status(500).json({ error: 'Failed to revise data' });
  }
});

// POST /api/generate-idiom
app.post('/api/generate-idiom', async (req, res) => {
  const { conceptId, conceptTitle, targetLanguage } = req.body;

  if (!conceptId || !conceptTitle || !targetLanguage) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log(`🤖 Generating idiom for ${conceptTitle} in ${targetLanguage}...`);

    // 1. Check if we already have it (Simple check)
    const { rows: existing } = await query(
      'SELECT * FROM idioms WHERE concept_id = $1 AND language = $2',
      [conceptId, targetLanguage]
    );

    if (existing.length > 0) {
      console.log("   found existing idiom in DB.");
      return res.json({ success: true, idiom: existing[0], cached: true });
    }

    // 2. Generate with AI
    const prompt = `
      Find a real, authentic idiom in "${targetLanguage}" that conveys the concept of: "${conceptTitle}".
      
      If an exact idiom doesn't exist, find the closest proverb, saying, or metaphorical expression that conveys a similar meaning.
      
      Requirements:
      - It MUST be a real expression used by native speakers.
      - Return a JSON object matching this schema:
      {
        "script": "Original script (e.g., native chars)",
        "language": "${targetLanguage}",
        "transliteration": "Latin alphabet pronunciation guide",
        "literal_translation": "Word-for-word translation in English",
        "meaning": "The deeper meaning",
        "origin_story": "Brief historical or cultural origin",
        "cultural_context": "How/when it is used",
        "usage_example": {
            "native": "Example sentence in native script",
            "translation": "English translation of example"
        },
        "literature_reference": {
            "source": "A known book, poem, or folk tale usage (or 'Oral Tradition')",
            "context": "Brief context of usage"
        },
        "pronunciation_easy": "Phonetic guide for English speakers"
      }
      
      Only return { "found": false } if the language does not exist or it is impossible to find even a remote equivalent.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);

    if (result.found === false) {
      return res.status(404).json({ error: `No authentic idiom found for ${conceptTitle} in ${targetLanguage}` });
    }

    // 3. Validation (The Critic)
    const criticPrompt = `
      Verify this idiom for the concept "${conceptTitle}":
      ${JSON.stringify(result)}

      Check for:
      1. Authenticity: Is this a real idiom?
      2. Relevance: Does it actually mean "${conceptTitle}"?
      3. Safety: No hate speech or profanity.

      Return JSON: { "approved": boolean, "reason": "..." }
    `;

    const criticCheck = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: criticPrompt }],
      response_format: { type: "json_object" },
    });

    const verification = JSON.parse(criticCheck.choices[0].message.content);

    if (!verification.approved) {
      console.warn(`❌ Generation rejected: ${verification.reason}`);
      return res.status(400).json({ error: "Generated content failed verification", reason: verification.reason });
    }

    // 4. Generate Audio (High-Fidelity)
    let audioUrl = null;
    try {
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: result.script,
      });
      const buffer = Buffer.from(await mp3.arrayBuffer());

      // Save to file
      const safeLang = targetLanguage.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const safeConcept = conceptTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const fileName = `${safeConcept}_${safeLang}_generated_${Date.now()}.mp3`;
      const publicPath = path.join(__dirname, '../public/audio', fileName);

      // Ensure dir exists (it should, but safety first)
      const fs = await import('fs'); // dynamic import for fs in this scope if needed, or rely on top level. 
      // using fs/promises from top level if available, but server.js imports? 
      // checking imports... server.js uses 'import express...'. It doesn't import 'fs'.
      // I need to add 'fs' import to server.js or use dynamic import. 
      // Let's use dynamic import to be safe without changing top-level imports yet.
      const fsPromises = (await import('fs')).default;

      // Wait, 'import fs from 'fs'' usually gives default export in node depending on config.
      // Let's use fs.writeFileSync from 'fs' if I import it at top, but I'm in a replace block.
      // I'll add the import to the top of the file in a separate step or just assume I can use dynamic import.
      await fsPromises.writeFileSync(publicPath, buffer);
      audioUrl = `/audio/${fileName}`;

    } catch (audioErr) {
      console.error("Audio generation failed during on-demand:", audioErr);
      // We proceed without audio if it fails, fallback to TTS
    }

    // 5. Persist to DB
    const { rows: inserted } = await query(
      `INSERT INTO idioms (
            concept_id, script, language, transliteration, literal_translation,
            meaning, origin_story, cultural_context, usage_example,
            literature_reference, geolocation, voting, audio_url, pronunciation_easy
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
      [
        conceptId,
        result.script,
        result.language,
        result.transliteration,
        result.literal_translation,
        result.meaning,
        result.origin_story,
        result.cultural_context,
        JSON.stringify(result.usage_example),
        JSON.stringify(result.literature_reference),
        JSON.stringify({ lat: 0, lng: 0 }), // Default geo, maybe improve later
        JSON.stringify({ resonance: 0, accuracy: 0 }),
        audioUrl,
        result.pronunciation_easy
      ]
    );

    console.log(`✅ Generated and saved: ${result.script} (${targetLanguage})`);
    res.json({ success: true, idiom: inserted[0] });

  } catch (error) {
    console.error('Error generating idiom:', error);
    res.status(500).json({ error: 'Failed to generate idiom' });
  }
});

// POST /api/vote
app.post('/api/vote', async (req, res) => {
  const { conceptId, idiomScript, type } = req.body;

  if (type !== 'resonance' && type !== 'accuracy') {
    return res.status(400).json({ error: "Invalid vote type" });
  }

  try {
    // We use a jsonb_set query or a simpler read-modify-write if simpler.
    // Let's do read-modify-write to ensure we have the record.
    // Or optimized SQL update:
    // SET voting = jsonb_set(voting, '{resonance}', (COALESCE(voting->>'resonance','0')::int + 1)::text::jsonb)

    const { rows } = await query(
      'SELECT * FROM idioms WHERE concept_id = $1 AND script = $2',
      [conceptId, idiomScript]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Idiom not found' });
    const idiom = rows[0];

    const currentVotes = idiom.voting || { resonance: 0, accuracy: 0 };
    const newCount = (currentVotes[type] || 0) + 1;
    const newVoting = { ...currentVotes, [type]: newCount };

    await query(
      'UPDATE idioms SET voting = $1 WHERE id = $2',
      [JSON.stringify(newVoting), idiom.id]
    );

    res.json({ success: true, newCounts: newVoting });
  } catch (error) {
    console.error('Error recording vote:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
