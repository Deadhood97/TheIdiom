import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = 3001;

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DATA_FILE = path.join(__dirname, '../start_data.json');

// GET /api/data
app.get('/api/data', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading data:', error);
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// POST /api/revise
app.post('/api/revise', async (req, res) => {
  const { conceptId, idiomScript, userFeedback } = req.body;

  try {
    // 1. Read current data
    const rawData = await fs.readFile(DATA_FILE, 'utf8');
    const data = JSON.parse(rawData);

    // 2. Find the concept and idiom
    const concept = data.concepts.find(c => c.id === conceptId);
    if (!concept) return res.status(404).json({ error: 'Concept not found' });

    const idiomIndex = concept.idioms.findIndex(i => i.script === idiomScript);
    if (idiomIndex === -1) return res.status(404).json({ error: 'Idiom not found' });

    const idiom = concept.idioms[idiomIndex];

    // 3. Draft Revision (The Creator)
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
      - Return ONLY the updated JSON object for this specific idiom.
    `;

    const draftResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: draftPrompt }],
      response_format: { type: "json_object" },
    });

    const draftIdiom = JSON.parse(draftResponse.choices[0].message.content);

    // 4. Verification (The Critic)
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

    // 5. Update data (Only if approved)
    concept.idioms[idiomIndex] = { ...idiom, ...draftIdiom };

    // 6. Write back to file
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 4));

    res.json({ success: true, updatedIdiom: draftIdiom, verification: verification.reason });
  } catch (error) {
    console.error('Error revising data:', error);
    res.status(500).json({ error: 'Failed to revise data' });
  }
});

// POST /api/vote
app.post('/api/vote', async (req, res) => {
  const { conceptId, idiomScript, type } = req.body;

  try {
    const rawData = await fs.readFile(DATA_FILE, 'utf8');
    const data = JSON.parse(rawData);

    const concept = data.concepts.find(c => c.id === conceptId);
    if (!concept) return res.status(404).json({ error: 'Concept not found' });

    const idiom = concept.idioms.find(i => i.script === idiomScript);
    if (!idiom) return res.status(404).json({ error: 'Idiom not found' });

    // Initialize if missing (backward compatibility)
    if (!idiom.voting) {
      idiom.voting = { resonance: 0, accuracy: 0 };
    }

    if (type === 'resonance' || type === 'accuracy') {
      idiom.voting[type] = (idiom.voting[type] || 0) + 1;
    } else {
      return res.status(400).json({ error: "Invalid vote type" });
    }

    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 4));

    res.json({ success: true, newCounts: idiom.voting });
  } catch (error) {
    console.error('Error recording vote:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
