ALTER TABLE "ruleset_snapshots"
ADD COLUMN "deduplication_key" CHAR(64);

CREATE UNIQUE INDEX "ruleset_snapshots_deduplication_key_key"
ON "ruleset_snapshots"("deduplication_key");
