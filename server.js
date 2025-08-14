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