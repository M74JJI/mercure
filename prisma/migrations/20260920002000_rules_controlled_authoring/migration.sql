CREATE TABLE "rules_authoring_drafts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_snapshot_id" UUID,
    "source_file_position" INTEGER,
    "file_name" TEXT NOT NULL,
    "tenant" VARCHAR(255) NOT NULL,
    "source_type" VARCHAR(32) NOT NULL,
    "content" TEXT NOT NULL,
    "sha256" CHAR(64) NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "state" VARCHAR(32) NOT NULL DEFAULT 'draft',
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validated_revision" INTEGER,
    "validated_sha256" CHAR(64),
    "validated_rule_count" INTEGER,
    "validated_decoder_count" INTEGER,
    "validation_issue_count" INTEGER,
    "validation_error_count" INTEGER,
    "validation_warning_count" INTEGER,
    "validation_info_count" INTEGER,
    "validated_at" TIMESTAMPTZ(6),
    "approved_revision" INTEGER,
    "approved_sha256" CHAR(64),
    "approved_by" TEXT,
    "approved_at" TIMESTAMPTZ(6),

    CONSTRAINT "rules_authoring_drafts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "rules_authoring_drafts_source_snapshot_id_fkey"
      FOREIGN KEY ("source_snapshot_id") REFERENCES "ruleset_snapshots"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rules_authoring_drafts_source_type_check"
      CHECK ("source_type" IN ('rules', 'decoders')),
    CONSTRAINT "rules_authoring_drafts_state_check"
      CHECK ("state" IN ('draft', 'validated', 'approved')),
    CONSTRAINT "rules_authoring_drafts_revision_check"
      CHECK ("revision" >= 1)
);

CREATE INDEX "rules_authoring_drafts_updated_at_idx"
    ON "rules_authoring_drafts"("updated_at");
CREATE INDEX "rules_authoring_drafts_state_updated_at_idx"
    ON "rules_authoring_drafts"("state", "updated_at");
CREATE INDEX "rules_authoring_drafts_source_snapshot_id_source_file_position_idx"
    ON "rules_authoring_drafts"("source_snapshot_id", "source_file_position");

CREATE TABLE "rules_authoring_draft_events" (
    "id" BIGSERIAL NOT NULL,
    "draft_id" UUID NOT NULL,
    "event_type" VARCHAR(32) NOT NULL,
    "state" VARCHAR(32) NOT NULL,
    "revision" INTEGER NOT NULL,
    "actor_subject" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rules_authoring_draft_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "rules_authoring_draft_events_draft_id_fkey"
      FOREIGN KEY ("draft_id") REFERENCES "rules_authoring_drafts"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "rules_authoring_draft_events_draft_id_created_at_idx"
    ON "rules_authoring_draft_events"("draft_id", "created_at");

CREATE TABLE "rules_authoring_draft_validation_issues" (
    "draft_id" UUID NOT NULL,
    "revision" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "severity" VARCHAR(32) NOT NULL,
    "type" VARCHAR(128) NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "rule_id" VARCHAR(64),
    "decoder_name" TEXT,
    "file_name" TEXT,
    "tenant" VARCHAR(255),

    CONSTRAINT "rules_authoring_draft_validation_issues_pkey"
      PRIMARY KEY ("draft_id", "revision", "position"),
    CONSTRAINT "rules_authoring_draft_validation_issues_draft_id_fkey"
      FOREIGN KEY ("draft_id") REFERENCES "rules_authoring_drafts"("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "rules_authoring_draft_validation_issues_severity_check"
      CHECK ("severity" IN ('error', 'warning', 'info'))
);

CREATE INDEX "rules_authoring_draft_validation_issues_draft_id_revision_severity_idx"
    ON "rules_authoring_draft_validation_issues"("draft_id", "revision", "severity");
