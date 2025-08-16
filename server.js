import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'vite';

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

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

app.get('/api/user', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: 1 },
  });
  res.json(user);
});

app.post('/api/user/level', async (req, res) => {
  const { level } = req.body;
  await prisma.user.update({
    where: { id: 1 },
    data: { level },
  });
  res.json({ success: true });
});

app.post('/api/test/score', async (req, res) => {
  const { score } = req.body;
  await prisma.test.create({
    data: {
      score,
    },
  });
  res.json({ success: true });
});

app.get('/api/test/best', async (req, res) => {
  const bestScore = await prisma.test.findFirst({
    orderBy: {
      score: 'desc',
    },
  });
  res.json(bestScore);
});

app.post('/api/message/send', (req, res) => {
  const { message } = req.body;
  console.log(`Sending message: ${message}`);
  // In a real application, you would have the logic to send the message
  // to Facebook Messenger here.
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
