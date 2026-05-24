const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const History = require('../models/History');

async function callAI(prompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b:free',
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// ─── SUMMARY ROUTE ───────────────────────────────────────────
router.post('/summary', authMiddleware, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  try {
    const prompt = `Summarize the following topic in simple, clear points for a student:\n\n${text}`;
    const summary = await callAI(prompt);

    // Save to history
    await History.create({
      userId: req.userId,
      type: 'summary',
      input: text,
      output: summary
    });

    res.json({ summary });
  } catch (err) {
    console.error('AI error:', err);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// ─── QUIZ ROUTE ───────────────────────────────────────────────
router.post('/quiz', authMiddleware, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  try {
//     const prompt = `Generate 5 multiple choice questions from the following topic.
// Return ONLY a JSON array like this, no extra text:
// [
//   {
//     "question": "...",
//     "options": ["A", "B", "C", "D"],
//     "answer": "A"
//   }
// ]

// Topic: ${text}`;

const prompt = `Generate 5 multiple choice questions from the following topic.
Return ONLY a JSON array like this, no extra text:
[
  {
    "question": "What is React?",
    "options": ["A library for building UIs", "A database", "A backend framework", "A CSS tool"],
    "answer": "A library for building UIs"
  }
]

IMPORTANT: The "answer" field must be the EXACT full text of the correct option, not just "A" or "B".

Topic: ${text}`;

    let raw = await callAI(prompt);
    raw = raw.replace(/\`\`\`json|\`\`\`/g, '').trim();
    const quiz = JSON.parse(raw);

    // Save to history
    await History.create({
      userId: req.userId,
      type: 'quiz',
      input: text,
      output: quiz
    });

    res.json({ quiz });
  } catch (err) {
    console.error('AI error:', err);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// ─── FLASHCARDS ROUTE ─────────────────────────────────────────
router.post('/flashcards', authMiddleware, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  try {
    const prompt = `Generate 6 flashcards from the following topic.
Return ONLY a JSON array like this, no extra text:
[
  {
    "term": "...",
    "definition": "..."
  }
]

Topic: ${text}`;

    let raw = await callAI(prompt);
    raw = raw.replace(/\`\`\`json|\`\`\`/g, '').trim();
    const flashcards = JSON.parse(raw);

    // Save to history
    await History.create({
      userId: req.userId,
      type: 'flashcards',
      input: text,
      output: flashcards
    });

    res.json({ flashcards });
  } catch (err) {
    console.error('AI error:', err);
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
});

// ─── GET HISTORY ROUTE ────────────────────────────────────────
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const history = await History.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ history });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ─── DELETE HISTORY ROUTE ─────────────────────────────────────
router.delete('/history/:id', authMiddleware, async (req, res) => {
  try {
    const item = await History.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!item) {
      return res.status(404).json({ error: 'History item not found' });
    }

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete history' });
  }
});

// ─── CLEAR ALL HISTORY ────────────────────────────────────────
router.delete('/history', authMiddleware, async (req, res) => {
  try {
    await History.deleteMany({ userId: req.userId });
    res.json({ message: 'All history cleared' });
  } catch (err) {
    console.error('Clear history error:', err);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

module.exports = router;