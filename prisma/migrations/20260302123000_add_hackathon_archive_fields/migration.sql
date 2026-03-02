-- Add soft-archive fields for hackathons
ALTER TABLE "Hackathon"
  ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE INDEX "Hackathon_isArchived_idx" ON "Hackathon"("isArchived");
