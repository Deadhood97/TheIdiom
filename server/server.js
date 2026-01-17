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
