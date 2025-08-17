import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'vite';
import cookieParser from 'cookie-parser';

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use(cookieParser());

// helper
function requireUserId(req, res) {
  const id = parseInt(req.cookies.userId || '', 10);
  if (!id) {
    res.status(401).json({ error: 'Not logged in' });
    return null;
  }
  return id;
}

// POST /api/auth/login { name, pin }
app.post('/api/auth/login', async (req, res) => {
  const { name, pin } = req.body || {};
  if (!name || !name.trim() || !pin) {
    return res.status(400).json({ error: 'Name and PIN required' });
  }

  const user = await prisma.user.findUnique({
    where: { name },
  });

  if (!user || user.pin !== pin) {
    return res.status(401).json({ error: 'Invalid name or PIN' });
  }

  // httpOnly cookie (session-lite)
  res.cookie('userId', String(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    // secure: true, // enable if behind HTTPS
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30d
  });

  res.json({ id: user.id, name: user.name, level: user.level, image: user.image });
});

// POST /api/auth/register { name, pin }
app.post('/api/auth/register', async (req, res) => {
  const { name, pin } = req.body || {};
  if (!name || !name.trim() || !pin || !/^\d{4}$/.test(pin)) {
    return res.status(400).json({ error: 'Name and a 4-digit PIN are required' });
  }

  try {
    const user = await prisma.user.create({
      data: {
        name,
        pin,
      },
    });

    // Log the user in immediately after registration
    res.cookie('userId', String(user.id), {
      httpOnly: true,
      sameSite: 'lax',
      // secure: true, // enable if behind HTTPS
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30d
    });

    res.json({ id: user.id, name: user.name, level: user.level, image: user.image });
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return res.status(400).json({ error: 'Name already taken' });
    }
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', async (req, res) => {
  const id = requireUserId(req, res);
  if (!id) return;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('userId');
  res.json({ success: true });
});

// Update your existing test score route to attach userId
// POST /api/test/score { score }
app.post('/api/test/score', async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const { score } = req.body || {};
  if (typeof score !== 'number') return res.status(400).json({ error: 'Score required' });

  await prisma.test.create({ data: { score, userId } });
  res.json({ success: true });
});

// Best score should be per-user (not global)
app.get('/api/test/best', async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const bestScore = await prisma.test.findFirst({
    where: { userId },
    orderBy: { score: 'desc' },
  });
  res.json(bestScore || null);
});

app.get('/api/problems', async (req, res) => {
  const problems = await prisma.problem.findMany();
  res.json(problems);
});

app.post('/api/problems/:id/score', async (req, res) => {
  const { id } = req.params;
  const { correct } = req.body;

  const problem = await prisma.problem.findUnique({
    where: { id: parseInt(id) },
  });

  if (correct) {
    await prisma.problem.update({
      where: { id: parseInt(id) },
      data: { correct: problem.correct + 1 },
    });
  } else {
    await prisma.problem.update({
      where: { id: parseInt(id) },
      data: { incorrect: problem.incorrect + 1 },
    });
  }

  res.json({ success: true });
});

// Record a single attempt (for last-5 tracking)
app.post('/api/problems/:id/attempt', async (req, res) => {
  const { id } = req.params;
  const { correct } = req.body;
  const problemId = parseInt(id);

  if (typeof correct !== 'boolean') {
    return res.status(400).json({ error: 'Missing boolean `correct`' });
  }

  // Create attempt row
  await prisma.attempt.create({
    data: { problemId, isCorrect: correct },
  });

  // Optionally keep existing aggregate counters in sync
  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (problem) {
    if (correct) {
      await prisma.problem.update({ where: { id: problemId }, data: { correct: problem.correct + 1 } });
    } else {
      await prisma.problem.update({ where: { id: problemId }, data: { incorrect: problem.incorrect + 1 } });
    }
  }

  res.json({ success: true });
});

// Get summary of the last 5 attempts for a problem
app.get('/api/problems/:id/last5', async (req, res) => {
  const { id } = req.params;
  const problemId = parseInt(id);
  const attempts = await prisma.attempt.findMany({
    where: { problemId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  const correctCount = attempts.filter(a => a.isCorrect).length;
  res.json({ correctCount, totalCount: attempts.length, attempts });
});

app.post('/api/problems/:id/mastered', async (req, res) => {
  const { id } = req.params;
  await prisma.problem.update({
    where: { id: parseInt(id) },
    data: { mastered: true },
  });
  res.json({ success: true });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
} else {
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
}

app.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});