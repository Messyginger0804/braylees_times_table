-- Create per-user progress table
CREATE TABLE IF NOT EXISTS "public"."UserProblem" (
  "userId" INTEGER NOT NULL,
  "problemId" INTEGER NOT NULL,
  "everCorrect" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserProblem_pkey" PRIMARY KEY ("userId", "problemId"),
  CONSTRAINT "UserProblem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserProblem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "public"."Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "UserProblem_userId_problemId_idx" ON "public"."UserProblem"("userId", "problemId");

