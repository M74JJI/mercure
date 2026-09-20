DROP INDEX "ruleset_snapshots_deduplication_key_key";

ALTER TABLE "ruleset_snapshots"
DROP COLUMN "deduplication_key";
