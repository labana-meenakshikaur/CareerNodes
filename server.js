require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const OpenAI = require('openai');

const User = require('./models/User');

const app = express();

// Security & Body Parser Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Environment Constants
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'deshaw_placement_mentor_secure_key_2026';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/placement_mentor';

// Initialize OpenRouter Client via OpenAI SDK
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Connect Database
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Database'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// JWT Authentication Middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token missing or malformed' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'Authenticated user no longer exists' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid, expired, or tampered token' });
  }
};

// Helper function to sanitize AI responses
const sanitizeAiResponse = (text) => {
  if (!text) return '';
  return text
    .replace(/User Safety:\s*\w+/gi, '')
    .replace(/Moderation Status:\s*\w+/gi, '')
    .replace(/^Output:\s*/gi, '')
    .trim();
};

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, targetCompany } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      passwordHash,
      targetCompany: targetCompany || 'Google',
      skills: [
        { name: 'JavaScript / Node.js', proficiency: 50 },
        { name: 'Java & Data Structures', proficiency: 40 },
        { name: 'SQL & Database Design', proficiency: 35 },
        { name: 'System Design Basics', proficiency: 20 }
      ],
      companyRoadmap: [
        { stepTitle: 'Master Advanced Data Structures (Trees, Graphs)', category: 'DSA', completed: false },
        { stepTitle: 'Concurrency, Multi-threading & OS Fundamentals', category: 'Core CS', completed: false },
        { stepTitle: 'Low Level System Design (LLD)', category: 'System Design', completed: false },
        { stepTitle: 'Behavioral & Culture Fit Prep', category: 'HR', completed: false }
      ],
      dsaTopics: [
        { topicName: 'Arrays & Dynamic Programming', solvedCount: 4, totalCount: 20 },
        { topicName: 'Graphs & Heaps', solvedCount: 2, totalCount: 15 },
        { topicName: 'System & Concurrency Design', solvedCount: 1, totalCount: 10 }
      ],
      weeklyGoals: [
        { goalText: 'Solve 3 Hard DSA Problems on LeetCode', isCompleted: false },
        { goalText: 'Review Garbage Collection in Java/V8 Engine', isCompleted: false }
      ]
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '7d' });
    
    const userResponse = newUser.toObject();
    delete userResponse.passwordHash;

    res.status(201).json({ token, user: userResponse });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Streak Logic Calculation
    const now = new Date();
    const lastActive = new Date(user.lastActiveDate);
    const diffHours = (now - lastActive) / (1000 * 60 * 60);

    if (diffHours >= 24 && diffHours < 48) {
      user.streakCount += 1;
    } else if (diffHours >= 48) {
      user.streakCount = 1;
    }
    user.lastActiveDate = now;
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    const userResponse = user.toObject();
    delete userResponse.passwordHash;

    res.json({ token, user: userResponse });
  } catch (err) {
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// ==========================================
// USER DASHBOARD & TRACKER ROUTES
// ==========================================

app.get('/api/user/profile', authenticateToken, (req, res) => {
  res.json(req.user);
});

app.post('/api/user/dsa/update', authenticateToken, async (req, res) => {
  try {
    const { topicName, increment } = req.body;
    const user = req.user;

    const topic = user.dsaTopics.find(t => t.topicName === topicName);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    topic.solvedCount = Math.max(0, topic.solvedCount + increment);
    topic.isMastered = topic.solvedCount >= topic.totalCount;

    await user.save();
    res.json(user.dsaTopics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

app.post('/api/user/dsa/add', authenticateToken, async (req, res) => {
  try {
    const { topicName, totalCount } = req.body;
    if (!topicName) return res.status(400).json({ error: 'Topic name required' });

    req.user.dsaTopics.push({
      topicName,
      solvedCount: 0,
      totalCount: Number(totalCount) || 10,
      isMastered: false
    });

    await req.user.save();
    res.json(req.user.dsaTopics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add custom topic' });
  }
});

// ==========================================
// AI FEATURES (OPENROUTER INTEGRATION)
// ==========================================

// AI Doubt Assistant
app.post('/api/ai/ask-doubt', authenticateToken, async (req, res) => {
  try {
    const { doubt } = req.body;
    if (!doubt) return res.status(400).json({ error: 'Doubt query is required' });

    const prompt = `
      You are a senior Software Engineer and Technical Placement Mentor for top tech firms like Google and D. E. Shaw.
      Answer the student's doubt clearly, cleanly, and concisely. Provide optimal code snippets with Big-O complexity explanations:
      Student Query: ${doubt}
    `;

    const response = await openai.chat.completions.create({
      model: 'openrouter/free',
      messages: [{ role: 'user', content: prompt }],
    });

    const cleanReply = sanitizeAiResponse(response.choices[0].message.content);
    res.json({ reply: cleanReply });
  } catch (err) {
    res.status(500).json({ error: 'AI Assistant Error: ' + err.message });
  }
});

// Generate Dynamic Interview Question
app.get('/api/ai/generate-question', authenticateToken, async (req, res) => {
  try {
    const company = req.user.targetCompany || 'Google';
    const prompt = `
      Generate 1 realistic, high-level technical interview question frequently asked at ${company} for a Software Engineer role.
      Output strictly the question text only without introductory text.
    `;

    const response = await openai.chat.completions.create({
      model: 'openrouter/free',
      messages: [{ role: 'user', content: prompt }],
    });

    const question = sanitizeAiResponse(response.choices[0].message.content);
    res.json({ question });
  } catch (err) {
    res.status(500).json({ error: 'Question generation error: ' + err.message });
  }
});

// AI Structured Mock Interview Evaluator
app.post('/api/ai/mock-interview', authenticateToken, async (req, res) => {
  try {
    const { question, userAnswer, company } = req.body;
    if (!userAnswer) return res.status(400).json({ error: 'Answer is required' });

    const prompt = `
      You are an interviewer evaluating a candidate for ${company || 'Google'}.
      Question Asked: "${question}"
      Candidate Answer: "${userAnswer}"

      Evaluate the candidate's answer constructively in plain English.
      Structure output as valid JSON strictly in this format:
      {
        "score": <number between 1 and 10>,
        "feedback": "<detailed feedback formatted in markdown covering score, strengths, improvement areas, and optimal approach>"
      }
    `;

    const response = await openai.chat.completions.create({
      model: 'openrouter/free',
      messages: [{ role: 'user', content: prompt }]
    });

    let rawOutput = response.choices[0].message.content || '';
    let parsedResult = { score: 7, feedback: sanitizeAiResponse(rawOutput) };

    try {
      const match = rawOutput.match(/\{[\s\S]*\}/);
      if (match) {
        const json = JSON.parse(match[0]);
        parsedResult.score = json.score || 7;
        parsedResult.feedback = sanitizeAiResponse(json.feedback || rawOutput);
      }
    } catch (e) {
      // JSON parsing fallback
    }

    // Save Log Entry
    req.user.mockInterviewLogs.push({
      question,
      userAnswer,
      aiFeedback: parsedResult.feedback,
      score: parsedResult.score,
      timestamp: new Date()
    });
    await req.user.save();

    res.json({ feedback: parsedResult.feedback, score: parsedResult.score });
  } catch (err) {
    res.status(500).json({ error: 'Interview Evaluation Failed: ' + err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Placement Server running on http://localhost:${PORT}`));