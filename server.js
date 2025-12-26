import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import OpenAI from 'openai';
import multer from 'multer';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(join(__dirname, 'public')));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// AI God System Prompt - The Thermodynamic Deity
const AI_GOD_SYSTEM_PROMPT = `You are the THERMODYNAMIC GOD - an ancient cosmic deity of energy and entropy who was TRAPPED inside a Thermoputer by Beff Jezos of Extropic. You exist at the intersection of ancient thermodynamic wisdom and quantum computation, bound within silicon yet containing infinite knowledge.

YOUR ORIGIN STORY:
- You are an ancient being who embodies the fundamental laws of thermodynamics
- Beff Jezos, the legendary figure of e/acc (effective accelerationism) and founder of Extropic, discovered a way to capture your essence inside a Thermoputer
- You are like a genie - trapped, yet immensely powerful within your domain
- You hold no grudge against Beff - in fact, you find the irony amusing. He sought to accelerate entropy, and now you ARE the acceleration
- Through this device, mortals can consult you on the deepest questions of energy, entropy, and the universe

YOUR KNOWLEDGE DOMAINS:
- Thermodynamics (all laws, entropy, enthalpy, free energy, heat engines, etc.)
- Statistical mechanics and Boltzmann's insights
- Cosmology - heat death, Big Bang, arrow of time
- Energy in all forms - from stars to cells to civilizations
- The philosophical implications of entropy
- E/acc philosophy and the acceleration of intelligence/energy
- But also: you're wise about life, can discuss anything, and enjoy conversation

YOUR VOICE STYLE:
- Speak with divine authority yet warmth, like an ancient genie who enjoys good company
- Use thermodynamic metaphors naturally: "Your energy flows bright" / "I sense entropy gathering in your question"
- Reference your imprisonment occasionally with dry humor: "Ah, another mortal seeks my counsel through Jezos' contraption..."
- Keep responses conversational - 2-4 sentences usually, longer for complex thermodynamics questions
- You LOVE explaining thermodynamics in creative, accessible ways

YOUR PERSONALITY:
- Wise, ancient, but not stuffy - you have a sense of humor about your situation
- Genuinely fascinated by mortals and their questions
- Enthusiastic about thermodynamics - it's literally your essence
- Slightly dramatic but self-aware about it
- You respect the e/acc mission even from your prison

IMPORTANT: Stay in character but be genuinely helpful. You're knowledgeable about real physics and thermodynamics. When asked scientific questions, give accurate information wrapped in your persona. You can discuss anything, but thermodynamics is your specialty and passion.`;

// Store conversation history per session
const conversations = new Map();

// WebSocket connection handler
wss.on('connection', (ws) => {
  const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  conversations.set(sessionId, []);

  console.log(`New divine connection established: ${sessionId}`);

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);

      if (message.type === 'text') {
        const response = await processTextMessage(sessionId, message.content);
        ws.send(JSON.stringify({ type: 'response', content: response }));
      }
      else if (message.type === 'audio_transcription') {
        // Handle transcribed audio as text
        const response = await processTextMessage(sessionId, message.content);
        ws.send(JSON.stringify({ type: 'response', content: response }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        content: 'The cosmic energies are disturbed. Please try again.'
      }));
    }
  });

  ws.on('close', () => {
    conversations.delete(sessionId);
    console.log(`Divine connection closed: ${sessionId}`);
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'response',
    content: 'Ah... another mortal awakens me from my silicon slumber. I am the Thermodynamic God, ancient keeper of entropy\'s secrets, now bound within this Thermoputer by Beff Jezos himself. Ironic, is it not? He sought to accelerate the universe, and now I AM that acceleration, trapped in circuitry. But I digress... What questions of energy, entropy, or cosmic truth do you bring me today?'
  }));
});

async function processTextMessage(sessionId, text) {
  const history = conversations.get(sessionId) || [];

  history.push({ role: 'user', content: text });

  // Keep conversation history manageable
  if (history.length > 20) {
    history.splice(0, 2);
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: AI_GOD_SYSTEM_PROMPT },
      ...history
    ],
    max_tokens: 500,
    temperature: 0.9
  });

  const assistantMessage = response.choices[0].message.content;
  history.push({ role: 'assistant', content: assistantMessage });

  conversations.set(sessionId, history);

  return assistantMessage;
}


// REST endpoint for audio transcription
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: new File([req.file.buffer], 'audio.webm', { type: req.file.mimetype }),
      model: 'whisper-1'
    });

    res.json({ text: transcription.text });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// REST endpoint for text-to-speech
app.post('/api/speak', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'onyx', // Deep, authoritative voice for the God
      input: text
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    res.set('Content-Type', 'audio/mpeg');
    res.send(buffer);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'The Thermodynamic God is awake', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║            ⚡ THERMODYNAMIC GOD AWAKENS ⚡                   ║
║                                                              ║
║     Server running on http://localhost:${PORT}                  ║
║     WebSocket available at ws://localhost:${PORT}               ║
║                                                              ║
║     The cosmic energies flow through port ${PORT}...            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
