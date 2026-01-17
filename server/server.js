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
    const { rows: idiomRows } = await query(
      'SELECT * FROM idioms WHERE concept_id = $1 AND script = $2',
      [conceptId, idiomScript]
    );

    if (idiomRows.length === 0) return res.status(404).json({ error: 'Idiom not found' });
    const idiom = idiomRows[0];

    // 2. Fetch all concepts (to allow moving)
    const { rows: concepts } = await query('SELECT * FROM concepts');
    const conceptList = concepts.map(c => `- ${c.id}: "${c.universal_concept}" (${c.emoji})`).join('\n');

    // 3. Linguistic Expert Evaluation
    const expertPrompt = `
      You are a World-Class Linguistic Expert and Cultural Consultant.
      
      Current Idiom Entry:
      - Language: ${idiom.language}
      - Script: ${idiom.script}
      - Current Concept: "${concepts.find(c => c.id === conceptId)?.universal_concept}" (${conceptId})
      - Current Meaning: "${idiom.meaning}"
      
      User Feedback: "${userFeedback}"
      
      Available Concepts in the Archive:
      ${conceptList}
      
      Task:
      Evaluate the user feedback seriously. Your goal is the highest linguistic accuracy.
      
      Decisions:
      - "KEEP": The feedback is incorrect, malicious, or the current mapping is already optimal.
      - "UPDATE": The idiom belongs in this concept, but the translation, meaning, or context needs refinement based on the feedback.
      - "MOVE": The idiom is valid but belongs in a DIFFERENT concept. Specify the new 'concept_id' from the list above.
      - "DELETE": The idiom is fundamentally fake, incorrect, or doesn't fit ANY of the available concepts, and the feedback correctly identifies it as a mismatch that cannot be fixed by an update.
      
      Return JSON:
      {
        "decision": "KEEP" | "UPDATE" | "MOVE" | "DELETE",
        "reason": "Clear explanation of your linguistic reasoning",
        "new_concept_id": "string if decision is MOVE",
        "updated_fields": {
           "literal_translation": "...",
           "meaning": "...",
           "origin_story": "...",
           "cultural_context": "...",
           "usage_example": { "native": "...", "translation": "..." },
           "literature_reference": { "source": "...", "context": "..." }
        } (only if decision is UPDATE or MOVE)
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: expertPrompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log(`🤖 AI Decision for "${idiomScript}": ${result.decision} - ${result.reason}`);

    if (result.decision === 'KEEP') {
      return res.json({ success: true, action: 'KEEP', reason: result.reason });
    }

    if (result.decision === 'DELETE') {
      await query('DELETE FROM idioms WHERE id = $1', [idiom.id]);
      return res.json({ success: true, action: 'DELETE', reason: result.reason });
    }

    if (result.decision === 'UPDATE' || result.decision === 'MOVE') {
      const targetConceptId = result.decision === 'MOVE' ? result.new_concept_id : conceptId;

      // Merge updates
      const updated = { ...idiom, ...result.updated_fields };

      await query(
        `UPDATE idioms SET 
          concept_id = $1,
          literal_translation = $2,
          origin_story = $3,
          cultural_context = $4,
          meaning = $5,
          usage_example = $6,
          literature_reference = $7
         WHERE id = $8`,
        [
          targetConceptId,
          updated.literal_translation,
          updated.origin_story,
          updated.cultural_context,
          updated.meaning,
          JSON.stringify(updated.usage_example),
          JSON.stringify(updated.literature_reference),
          idiom.id
        ]
      );

      return res.json({
        success: true,
        action: result.decision,
        reason: result.reason,
        updatedIdiom: { ...updated, concept_id: targetConceptId }
      });
    }

    res.status(500).json({ error: 'Unexpected AI decision' });

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
        "pronunciation_easy": "Phonetic guide for English speakers",
        "geolocation": {
            "lat": 12.34, 
            "lng": 56.78,
            "country": "Country of origin"
        }
      }
      
      IMPORTANT: You MUST include 'geolocation' with approximate coordinates for the center of the language's region.
      
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

      // Import S3 Service dynamically to avoid top-level issues if we messed up imports
      const { uploadToS3, isS3Enabled } = await import('./services/s3Service.js');

      if (isS3Enabled()) {
        // Cloud Mode: Upload to S3
        const safeLang = targetLanguage.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const safeConcept = conceptTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const fileName = `${safeConcept}_${safeLang}_generated_${Date.now()}.mp3`;

        console.log("☁️ Uploading audio to S3...");
        audioUrl = await uploadToS3(buffer, fileName);
        console.log("✅ S3 Upload complete:", audioUrl);
      } else {
        // Local Mode: Write to Disk
        const safeLang = targetLanguage.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const safeConcept = conceptTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const fileName = `${safeConcept}_${safeLang}_generated_${Date.now()}.mp3`;
        const publicPath = path.join(__dirname, '../public/audio', fileName);

        const fs = (await import('fs')).default;
        fs.writeFileSync(publicPath, buffer);
        audioUrl = `/audio/${fileName}`;
        console.log("💾 Saved audio locally:", audioUrl);
      }

    } catch (audioErr) {
      console.error("Audio generation failed:", audioErr);
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

// Export app for Lambda/Tests
export { app };

// Only start server if run directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}
