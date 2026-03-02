ALTER TABLE "Hackathon"
  ADD COLUMN "organizerEmails" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
