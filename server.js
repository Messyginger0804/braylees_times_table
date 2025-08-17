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

// POST /api/users/level { level }
app.post('/api/users/level', async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const { level } = req.body || {};
  const next = parseInt(level, 10);
  if (!Number.isInteger(next) || next < 1 || next > 2) {
    return res.status(400).json({ error: 'Level must be 1 or 2' });
  }

  try {
    // Guard: require level 1 completion before allowing level 2
    if (next === 2) {
      const problems = await prisma.problem.findMany();
      const level1Ids = problems
        .filter(p => {
          const [aStr, bStr] = p.problem.split(' x ');
          const a = parseInt(aStr, 10), b = parseInt(bStr, 10);
          return a <= 5 && b <= 5;
        })
        .map(p => p.id);
      const done = await prisma.userProblem.findMany({
        where: { userId, problemId: { in: level1Ids }, everCorrect: true },
        select: { problemId: true },
      });
      if (done.length !== level1Ids.length) {
        return res.status(400).json({ error: 'Complete all Level 1 problems in practice before unlocking Level 2' });
      }
    }
    const updated = await prisma.user.update({ where: { id: userId }, data: { level: next } });
    res.json({ id: updated.id, name: updated.name, level: updated.level, image: updated.image });
  } catch (e) {
    console.error('Failed to update level', e);
    res.status(500).json({ error: 'Failed to update level' });
  }
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
  let problems = await prisma.problem.findMany();
  // Auto-seed if empty to ensure problems always exist
  if (!problems || problems.length === 0) {
    const data = [];
    for (let i = 1; i <= 12; i++) {
      for (let j = 1; j <= 12; j++) {
        data.push({ problem: `${i} x ${j}`, answer: i * j });
      }
    }
    try {
      await prisma.problem.createMany({ data });
      problems = await prisma.problem.findMany();
    } catch (e) {
      console.error('Auto-seed failed:', e);
      // Even if seeding fails, return whatever we have (likely [])
    }
  }
  res.json(problems);
});

app.get('/api/problems/count', async (req, res) => {
  const count = await prisma.problem.count();
  res.json({ count });
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

// Bulk last-5 per user across all problems
app.get('/api/attempts/last5', async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  try {
    const attempts = await prisma.attempt.findMany({
      where: { userId },
      orderBy: [
        { problemId: 'asc' },
        { createdAt: 'desc' },
      ],
      select: { id: true, problemId: true, isCorrect: true, createdAt: true },
    });

    const summaries = {};
    for (const a of attempts) {
      const key = String(a.problemId);
      if (!summaries[key]) summaries[key] = { attempts: [], correctCount: 0, totalCount: 0 };
      const s = summaries[key];
      if (s.attempts.length < 5) {
        s.attempts.push(a);
        s.totalCount++;
        if (a.isCorrect) s.correctCount++;
      }
    }
    res.json({ summaries });
  } catch (e) {
    console.error('Error fetching bulk last5', e);
    res.status(500).json({ error: 'Failed to fetch attempt summaries' });
  }
});

// Record a single attempt (for last-5 tracking)
app.post('/api/problems/:id/attempt', async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const { id } = req.params;
  const { correct } = req.body;
  const problemId = parseInt(id, 10);

  if (!Number.isInteger(problemId)) {
    return res.status(400).json({ error: 'Invalid problem id' });
  }
  if (typeof correct !== 'boolean') {
    return res.status(400).json({ error: 'Missing boolean `correct`' });
  }

  try {
    // Create new attempt
    const created = await prisma.attempt.create({
      data: { problemId, userId, isCorrect: correct },
      select: { id: true, createdAt: true }
    });

    // Keep only last 5 per user+problem (including the one just created)
    const toDelete = await prisma.attempt.findMany({
      where: { problemId, userId },
      orderBy: { createdAt: 'desc' },
      skip: 5,
      select: { id: true },
    });
    if (toDelete.length) {
      await prisma.attempt.deleteMany({ where: { id: { in: toDelete.map(a => a.id) } } });
    }

    // Maintain aggregate counters on Problem (global)
    await prisma.problem.update({
      where: { id: problemId },
      data: correct ? { correct: { increment: 1 } } : { incorrect: { increment: 1 } },
    });

    // Update per-user progress if correct
    if (correct) {
      try {
        await prisma.userProblem.upsert({
          where: { userId_problemId: { userId, problemId } },
          update: { everCorrect: true },
          create: { userId, problemId, everCorrect: true },
        });
      } catch (e) {
        console.error('Failed to upsert user progress', e);
      }
    }

    res.json({ success: true });
  } catch (e) {
    console.error('Error recording attempt', e);
    res.status(500).json({ error: 'Failed to record attempt' });
  }
});

// Get summary of the last 5 attempts for a problem
app.get('/api/problems/:id/last5', async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const { id } = req.params;
  const problemId = parseInt(id, 10);
  if (!Number.isInteger(problemId)) {
    return res.status(400).json({ error: 'Invalid problem id' });
  }

  try {
    const attempts = await prisma.attempt.findMany({
      where: { problemId, userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const correctCount = attempts.filter(a => a.isCorrect).length;
    res.json({ correctCount, totalCount: attempts.length, attempts });
  } catch (e) {
    console.error('Error fetching last5', e);
    res.status(500).json({ error: 'Failed to fetch last 5' });
  }
});

// Progress summary for current user: which problemIds have ever been answered correctly
app.get('/api/progress/summary', async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  try {
    const rows = await prisma.userProblem.findMany({
      where: { userId, everCorrect: true },
      select: { problemId: true },
    });
    res.json({ problemIds: rows.map(r => r.problemId) });
  } catch (e) {
    console.error('Error fetching progress summary', e);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Level status: are all problems for a given level completed (ever correct in practice)?
app.get('/api/progress/level/:level/status', async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const level = parseInt(req.params.level, 10);
  if (![1, 2].includes(level)) return res.status(400).json({ error: 'Invalid level' });
  try {
    const problems = await prisma.problem.findMany();
    const levelProblems = problems.filter(p => {
      const [aStr, bStr] = p.problem.split(' x ');
      const a = parseInt(aStr, 10), b = parseInt(bStr, 10);
      if (level === 1) return a <= 5 && b <= 5;
      return true;
    });
    const ids = levelProblems.map(p => p.id);
    const done = await prisma.userProblem.findMany({
      where: { userId, problemId: { in: ids }, everCorrect: true },
      select: { problemId: true },
    });
    const doneSet = new Set(done.map(d => d.problemId));
    const correctCount = doneSet.size;
    const total = ids.length;
    res.json({ level, total, correctCount, allCorrect: correctCount === total });
  } catch (e) {
    console.error('Error fetching level status', e);
    res.status(500).json({ error: 'Failed to fetch level status' });
  }
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

app.listen(3001, () => {
  console.log('Server listening on http://localhost:3001');
});
