import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.problem.deleteMany({});

  await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      level: 1,
    },
  });

  const problems = [];
  for (let i = 1; i <= 5; i++) {
    for (let j = 1; j <= 5; j++) {
      problems.push({ problem: `${i} x ${j}`, answer: i * j });
    }
  }

  for (const problem of problems) {
    await prisma.problem.create({
      data: problem,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });