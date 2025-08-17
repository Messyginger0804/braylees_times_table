-- Add userId column to Attempt for per-user tracking
ALTER TABLE "public"."Attempt"
ADD COLUMN IF NOT EXISTS "userId" INTEGER;

-- Create index to optimize per-user last-5 queries
CREATE INDEX IF NOT EXISTS "Attempt_userId_problemId_createdAt_idx"
ON "public"."Attempt"("userId", "problemId", "createdAt");

-- Add foreign key to User (nullable to preserve existing data)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Attempt_userId_fkey'
  ) THEN
    ALTER TABLE "public"."Attempt"
    ADD CONSTRAINT "Attempt_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

