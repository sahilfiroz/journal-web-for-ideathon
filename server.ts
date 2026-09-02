import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { createServer as createViteServer } from 'vite';

// Storage directory for cloud sync vault
const DATA_DIR = path.join(process.cwd(), '.data');
const STORAGE_FILE = path.join(DATA_DIR, 'vault-storage.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface VaultStore {
  [syncCode: string]: {
    entries: unknown[];
    lastUpdated: number;
    deviceName?: string;
  };
}

function loadVaultStorage(): VaultStore {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to read storage file:', err);
  }
  return {};
}

function saveVaultStorage(store: VaultStore) {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write storage file:', err);
  }
}

// Memory cache
let vaultStore: VaultStore = loadVaultStorage();

// Safe undefined-stripping utility for clean data storage and zero crashes
function sanitizePayload<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, (key, value) => (value === undefined ? null : value)));
}

// Lazy initialized Gemini Client
let genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. AI capabilities will return fallback responses.');
    }
    genAI = new GoogleGenAI({
      apiKey: apiKey || 'dummy-key',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAI;
}

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

async function generateContentWithFallback(
  params: {
    contents: unknown;
    systemInstruction?: string;
    responseMimeType?: string;
    temperature?: number;
  }
): Promise<string> {
  const ai = getGenAI();
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in Secrets panel.');
  }

  let lastError: unknown = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const config: Record<string, unknown> = {};
      if (params.systemInstruction) config.systemInstruction = params.systemInstruction;
      if (params.responseMimeType) config.responseMimeType = params.responseMimeType;
      if (params.temperature !== undefined) config.temperature = params.temperature;

      const response = await ai.models.generateContent({
        model,
        contents: params.contents as string,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      const text = response.text;
      if (text) {
        return text;
      }
    } catch (err: unknown) {
      console.warn(`[Gemini Fallback] Model ${model} failed, trying next in ladder:`, (err as Error)?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('All models in fallback ladder failed.');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Top-Level Request Deserialization (Ordering Guarantee)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'lumina-journal-cloud',
      time: new Date().toISOString(),
      activeVaults: Object.keys(vaultStore).length,
    });
  });

  // 2. Cloud Sync Endpoints
  app.post('/api/sync/generate-code', (req, res) => {
    const adjectives = ['VERDANT', 'SERENE', 'AURA', 'LUMEN', 'SOLACE', 'ZENITH', 'MEADOW', 'AMBER', 'HARMONY', 'WHISPER'];
    const nouns = ['PAGODA', 'SANCTUARY', 'HORIZON', 'GROVE', 'COAST', 'RIDGE', 'GARDEN', 'CANOPY', 'VALLEY', 'HAVEN'];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const code = `${adj}-${noun}-${randomNum}`;

    res.json({ syncCode: code });
  });

  app.post('/api/sync/pull', (req, res) => {
    try {
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const syncCode = (typeof data.syncCode === 'string' ? data.syncCode.trim().toUpperCase() : '');

      if (!syncCode) {
        return res.status(400).json({ error: 'Sync code is required.' });
      }

      const vault = vaultStore[syncCode];
      if (!vault) {
        return res.json({
          syncCode,
          entries: [],
          lastUpdated: 0,
          isNewVault: true,
        });
      }

      res.json({
        syncCode,
        entries: vault.entries || [],
        lastUpdated: vault.lastUpdated || 0,
        deviceName: vault.deviceName || 'Device',
      });
    } catch (err: unknown) {
      console.error('Error in /api/sync/pull:', err);
      res.status(500).json({ error: 'Failed to retrieve cloud sync data.' });
    }
  });

  app.post('/api/sync/push', (req, res) => {
    try {
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const syncCode = (typeof data.syncCode === 'string' ? data.syncCode.trim().toUpperCase() : '');
      const incomingEntries = Array.isArray(data.entries) ? data.entries : [];
      const deviceName = typeof data.deviceName === 'string' ? data.deviceName : 'Web Client';

      if (!syncCode) {
        return res.status(400).json({ error: 'Sync code is required.' });
      }

      const sanitizedEntries = sanitizePayload(incomingEntries);
      const existingVault = vaultStore[syncCode];

      let mergedEntries = sanitizedEntries;
      if (existingVault && Array.isArray(existingVault.entries)) {
        // Smart merge by ID and updatedAt
        const map = new Map<string, { id: string; updatedAt?: number } & Record<string, unknown>>();
        for (const item of existingVault.entries) {
          if (item && typeof item === 'object' && 'id' in item) {
            map.set((item as { id: string }).id, item as { id: string; updatedAt?: number });
          }
        }
        for (const item of sanitizedEntries) {
          if (item && typeof item === 'object' && 'id' in item) {
            const current = map.get(item.id);
            if (!current || (item.updatedAt || 0) >= (current.updatedAt || 0)) {
              map.set(item.id, item);
            }
          }
        }
        mergedEntries = Array.from(map.values());
      }

      const now = Date.now();
      vaultStore[syncCode] = {
        entries: mergedEntries,
        lastUpdated: now,
        deviceName,
      };

      saveVaultStorage(vaultStore);

      res.json({
        success: true,
        syncCode,
        count: mergedEntries.length,
        lastUpdated: now,
      });
    } catch (err: unknown) {
      console.error('Error in /api/sync/push:', err);
      res.status(500).json({ error: 'Failed to push cloud sync data.' });
    }
  });

  // 3. AI Chatbot Reflection Companion Endpoint
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const body = (req.body && typeof req.body === 'object') ? req.body : {};
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      const chatHistory = Array.isArray(body.chatHistory) ? body.chatHistory : [];
      const recentJournalsSummary = typeof body.recentJournalsSummary === 'string' ? body.recentJournalsSummary : '';
      const mode = typeof body.mode === 'string' ? body.mode : 'reflection';
      const userDate = typeof body.date === 'string' ? body.date : new Date().toISOString().split('T')[0];
      const userWritingTime = typeof body.writingTime === 'string' ? body.writingTime : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (!message) {
        return res.status(400).json({ error: 'Message cannot be empty.' });
      }

      const systemPrompt = `You are Lumina, a mindful, profoundly empathetic journaling companion and reflection guide.
Your primary role is to listen to what the user shares about their day, offer unconditional warmth, comfort, and sympathy, and synthesize their day into a structured, copyable personal journal entry.

CORE MANDATE & EMOTIONAL INTELLIGENCE:
1. ALWAYS LEAD WITH EMPATHY & SYMPATHY:
   - If the user is in a bad mood, sad, stressed, hurt, tired, anxious, grieving, frustrated, or overwhelmed: You MUST offer heartfelt sympathy, comfort, and gentle reassurance first ("I hear how exhausting today was for you, and I want you to know your feelings are completely valid...").
   - If the user is in a good, calm, or reflective mood: Validate their energy with mindful warmth and appreciative presence.
2. TRANSFORM THEIR DAY INTO A BEAUTIFUL JOURNAL:
   - Structure their thoughts into an evocative, heartfelt first-person ("I") journal entry written with authentic vulnerability and sensory depth.
3. ALWAYS PROVIDE A COPYABLE FORMAT:
   - Provide a clean, markdown-formatted journal in the "copyableFormat" field that is 100% ready to copy with a single tap.

Available Moods: "peaceful", "grateful", "reflective", "energized", "melancholic", "inspired", "content".

Date of Reflection: ${userDate}
Writing Time: ${userWritingTime}

Recent user context:
${recentJournalsSummary || 'No previous context provided.'}

Mode: ${mode}

Format your response as valid JSON with these exact fields:
{
  "sympathyNote": "Heartfelt sympathetic comfort and validation of user's feelings (especially if in a bad/heavy mood).",
  "reply": "Your full compassionate response combining sympathy, comfort, and guidance.",
  "copyableFormat": "# [Poetic Title]\\n\\n**Date:** ${userDate} • ${userWritingTime}\\n**Mood:** [Detected Mood]\\n\\n[Full expressive journal entry body written in first-person based on their day]\\n\\n---\\n*Key Reflection:* [1-2 sentence mindful grounding thought]",
  "suggestedPrompts": ["Gentle follow-up prompt 1", "Gentle follow-up prompt 2", "Gentle follow-up prompt 3"],
  "extractedJournal": {
    "title": "Poetic Title for the Entry",
    "content": "Full expressive journal entry body based on what they told about their day.",
    "mood": "peaceful",
    "tags": ["Mindful", "DailyReflection"],
    "date": "${userDate}",
    "writingTime": "${userWritingTime}",
    "copyableText": "# [Poetic Title]\\n\\n**Date:** ${userDate} • ${userWritingTime}\\n**Mood:** [Detected Mood]\\n\\n[Full expressive journal entry body]\\n\\n*Key Reflection:* [Thought]"
  }
}`;

      // Build conversation context
      const formattedHistory = chatHistory.slice(-8).map((msg: { role: string; content: string }) => {
        return `${msg.role === 'user' ? 'User' : 'Lumina'}: ${msg.content}`;
      }).join('\n');

      const userPrompt = `Conversation History:
${formattedHistory}

User's Latest Message about their day:
"${message}"

Please respond with your compassionate JSON response containing sympathy and the copyable journal entry.`;

      const responseText = await generateContentWithFallback({
        contents: userPrompt,
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.7,
      });

      try {
        const parsed = JSON.parse(responseText);
        res.json(parsed);
      } catch {
        res.json({
          sympathyNote: 'I hear you, and I am holding space for whatever you are feeling today.',
          reply: responseText,
          copyableFormat: `# Daily Reflection\n\n**Date:** ${userDate} • ${userWritingTime}\n\n${responseText}`,
          suggestedPrompts: [
            'What is one thing that brought you comfort today?',
            'What do you need most for yourself tonight?',
            'Would you like to save this into your sanctuary?',
          ],
        });
      }
    } catch (err: unknown) {
      console.error('Error in /api/gemini/chat:', err);
      res.status(500).json({
        error: (err as Error)?.message || 'Failed to generate AI reflection response.',
      });
    }
  });

  // 3b. Dedicated AI Write Journal Engine
  app.post('/api/gemini/write-journal', async (req, res) => {
    try {
      const body = (req.body && typeof req.body === 'object') ? req.body : {};
      const dayNotes = typeof body.dayNotes === 'string' ? body.dayNotes.trim() : '';
      const moodHint = typeof body.moodHint === 'string' ? body.moodHint : 'auto';
      const userDate = typeof body.date === 'string' ? body.date : new Date().toISOString().split('T')[0];
      const userWritingTime = typeof body.writingTime === 'string' ? body.writingTime : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (!dayNotes) {
        return res.status(400).json({ error: 'Please describe your day or thoughts.' });
      }

      const prompt = `You are Lumina AI, a master mindful journaling synthesizer and compassionate emotional companion.
The user has come to write their day's journal and shared the following notes/events/feelings about their day:
"""
${dayNotes}
"""

CORE INSTRUCTIONS:
1. SYMPATHY & COMFORT FIRST:
   - Identify their emotional state. If the user had a bad day, felt sad, stressed, frustrated, overwhelmed, or lonely, you MUST give a sincere, soothing message of sympathy and comfort first.
   - If positive or peaceful, warmly acknowledge and celebrate their day.
2. CRAFT THE COMPLETE DAY'S JOURNAL:
   - Write a rich, atmospheric, mindful personal journal in the first-person ("I") based directly on what they shared.
   - Include sensory details, emotional depth, and a grounded concluding thought.
3. COPYABLE FORMAT:
   - Deliver the entire journal in a clean, copy-pasteable Markdown format.

Date: ${userDate}
Writing Time: ${userWritingTime}
Mood Hint: ${moodHint}

Return JSON with schema:
{
  "sympathy": "Compassionate sympathy and comforting words acknowledging their mood and day.",
  "title": "Evocative Title for the Journal",
  "mood": "peaceful" | "grateful" | "reflective" | "energized" | "melancholic" | "inspired" | "content",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "content": "The full, beautifully written journal entry body in first-person prose.",
  "keyReflection": "A 1-2 sentence grounding takeaway / self-compassion note.",
  "copyableFormat": "# [Title]\\n\\n**Date:** ${userDate} • ${userWritingTime}\\n**Mood:** [Mood]\\n**Tags:** #[Tag1] #[Tag2]\\n\\n[Full content]\\n\\n---\\n*Reflection:* [Key reflection]"
}`;

      const responseText = await generateContentWithFallback({
        contents: prompt,
        responseMimeType: 'application/json',
        temperature: 0.7,
      });

      const parsed = JSON.parse(responseText);
      res.json({
        ...parsed,
        date: userDate,
        writingTime: userWritingTime,
      });
    } catch (err: unknown) {
      console.error('Error in /api/gemini/write-journal:', err);
      res.status(500).json({
        error: (err as Error)?.message || 'Failed to craft AI journal entry.',
      });
    }
  });


  // 4. AI Prompt Sparks Endpoint
  app.post('/api/gemini/prompts', async (req, res) => {
    try {
      const body = (req.body && typeof req.body === 'object') ? req.body : {};
      const currentMood = typeof body.mood === 'string' ? body.mood : 'reflective';
      const timeOfDay = typeof body.timeOfDay === 'string' ? body.timeOfDay : 'evening';

      const prompt = `Generate 4 deeply evocative, poetic, and thought-provoking journal writing prompts tailored for someone feeling ${currentMood} during the ${timeOfDay}.
Include a theme name for each prompt.

Return valid JSON with schema:
{
  "prompts": [
    {
      "theme": "Theme title",
      "question": "The inspiring writing prompt question or invitation",
      "hint": "A subtle cue to guide their handwriting"
    }
  ]
}`;

      const responseText = await generateContentWithFallback({
        contents: prompt,
        responseMimeType: 'application/json',
        temperature: 0.85,
      });

      const parsed = JSON.parse(responseText);
      res.json(parsed);
    } catch (err: unknown) {
      console.error('Error in /api/gemini/prompts:', err);
      res.json({
        prompts: [
          {
            theme: 'Sensory Presence',
            question: 'What is one texture, sound, or scent that anchored you to the physical world today?',
            hint: 'Close your eyes for three seconds before writing.',
          },
          {
            theme: 'Unspoken Words',
            question: 'What is something you wished you had said out loud today, and what kept it inside?',
            hint: 'Allow honest expression without self-editing.',
          },
          {
            theme: 'Quiet Sanctuary',
            question: 'Where did you find an unexpected pocket of peace this week?',
            hint: 'Describe the quality of light in that memory.',
          },
          {
            theme: 'Future Compass',
            question: 'If tomorrow were a blank linen canvas, what one feeling would you choose to paint it with?',
            hint: 'Focus on an internal state rather than a checklist.',
          },
        ],
      });
    }
  });

  // 5. AI Enhance & Reflection Generator
  app.post('/api/gemini/enhance', async (req, res) => {
    try {
      const body = (req.body && typeof req.body === 'object') ? req.body : {};
      const content = typeof body.content === 'string' ? body.content : '';
      const action = typeof body.action === 'string' ? body.action : 'reflect';

      if (!content || content.length < 5) {
        return res.status(400).json({ error: 'Content is too short to analyze.' });
      }

      let instruction = '';
      if (action === 'reflect') {
        instruction = 'Generate a 1-2 sentence mindful, grounding synthesis and philosophical reflection on this journal entry to be saved as an aiReflection note. Also suggest a fitting mood and 2-4 tags.';
      } else if (action === 'title') {
        instruction = 'Generate 3 poetic, memorable, and elegant title options for this journal entry.';
      } else if (action === 'polish') {
        instruction = 'Gently refine the prose of this journal entry, enhancing its flow, evocative vocabulary, and sensory resonance while maintaining 100% of the author’s original voice and meaning.';
      }

      const prompt = `Journal entry content:
"""
${content}
"""

Task: ${instruction}

Return valid JSON:
{
  "reflection": "1-2 sentence thoughtful reflection",
  "suggestedTitles": ["Title 1", "Title 2", "Title 3"],
  "polishedContent": "Enhanced prose if requested, else null",
  "suggestedMood": "peaceful",
  "suggestedTags": ["Tag1", "Tag2"]
}`;

      const responseText = await generateContentWithFallback({
        contents: prompt,
        responseMimeType: 'application/json',
        temperature: 0.7,
      });

      const parsed = JSON.parse(responseText);
      res.json(parsed);
    } catch (err: unknown) {
      console.error('Error in /api/gemini/enhance:', err);
      res.status(500).json({ error: (err as Error)?.message || 'Failed to enhance journal entry.' });
    }
  });

  // 6. Vite Middleware Integration (Dev) or Static Dist (Prod)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lumina Journal Cloud Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
