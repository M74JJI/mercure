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
    CONSTRAINT "rules_authoring_drafts_source_file_fkey"
      FOREIGN KEY ("source_snapshot_id", "source_file_position")
      REFERENCES "ruleset_snapshot_files"("snapshot_id", "position")
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rules_authoring_drafts_source_type_check"
      CHECK ("source_type" IN ('rules', 'decoders')),
    CONSTRAINT "rules_authoring_drafts_state_check"
      CHECK ("state" IN ('draft', 'validated', 'approved')),
    CONSTRAINT "rules_authoring_drafts_revision_check"
      CHECK ("revision" >= 1),
    CONSTRAINT "rules_authoring_drafts_content_check"
      CHECK (
        OCTET_LENGTH("content") BETWEEN 1 AND 1048576
        AND "content" ~ '[^[:space:]]'
      ),
    CONSTRAINT "rules_authoring_drafts_sha256_check"
      CHECK ("sha256" ~ '^[0-9a-f]{64}$'),
    CONSTRAINT "rules_authoring_drafts_actor_check"
      CHECK (
        "created_by" ~ '[^[:space:]]'
        AND "updated_by" ~ '[^[:space:]]'
      ),
    CONSTRAINT "rules_authoring_drafts_identity_check"
      CHECK (
        "file_name" ~ '[^[:space:]]'
        AND "tenant" ~ '[^[:space:]]'
      ),
    CONSTRAINT "rules_authoring_drafts_source_provenance_check"
      CHECK (
        ("source_snapshot_id" IS NULL AND "source_file_position" IS NULL)
        OR
        ("source_snapshot_id" IS NOT NULL AND "source_file_position" IS NOT NULL)
      ),
    CONSTRAINT "rules_authoring_drafts_validation_state_check"
      CHECK (
        (
          "state" = 'draft'
          AND "validated_revision" IS NULL
          AND "validated_sha256" IS NULL
          AND "validated_rule_count" IS NULL
          AND "validated_decoder_count" IS NULL
          AND "validation_issue_count" IS NULL
          AND "validation_error_count" IS NULL
          AND "validation_warning_count" IS NULL
          AND "validation_info_count" IS NULL
          AND "validated_at" IS NULL
        )
        OR (
          "state" IN ('validated', 'approved')
          AND "validated_revision" IS NOT NULL
          AND "validated_revision" = "revision"
          AND "validated_sha256" IS NOT NULL
          AND "validated_sha256" = "sha256"
          AND "validated_rule_count" IS NOT NULL
          AND "validated_rule_count" >= 0
          AND "validated_decoder_count" IS NOT NULL
          AND "validated_decoder_count" >= 0
          AND "validation_issue_count" IS NOT NULL
          AND "validation_error_count" IS NOT NULL
          AND "validation_warning_count" IS NOT NULL
          AND "validation_info_count" IS NOT NULL
          AND "validated_at" IS NOT NULL
        )
      ),
    CONSTRAINT "rules_authoring_drafts_approval_state_check"
      CHECK (
        (
          "state" <> 'approved'
          AND "approved_revision" IS NULL
          AND "approved_sha256" IS NULL
          AND "approved_by" IS NULL
          AND "approved_at" IS NULL
        )
        OR (
          "state" = 'approved'
          AND "approved_revision" IS NOT NULL
          AND "approved_revision" = "revision"
          AND "approved_sha256" IS NOT NULL
          AND "approved_sha256" = "sha256"
          AND "approved_by" IS NOT NULL
          AND "approved_by" ~ '[^[:space:]]'
          AND "approved_at" IS NOT NULL
          AND "validation_error_count" = 0
        )
      ),
    CONSTRAINT "rules_authoring_drafts_validation_counts_check"
      CHECK (
        (
          "validation_issue_count" IS NULL
          AND "validation_error_count" IS NULL
          AND "validation_warning_count" IS NULL
          AND "validation_info_count" IS NULL
        )
        OR (
          "validation_issue_count" >= 0
          AND "validation_error_count" >= 0
          AND "validation_warning_count" >= 0
          AND "validation_info_count" >= 0
          AND "validation_issue_count" =
            "validation_error_count" + "validation_warning_count" + "validation_info_count"
        )
      )
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
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "rules_authoring_draft_events_event_type_check"
      CHECK ("event_type" IN ('create', 'edit', 'validate', 'approve')),
    CONSTRAINT "rules_authoring_draft_events_state_check"
      CHECK ("state" IN ('draft', 'validated', 'approved')),
    CONSTRAINT "rules_authoring_draft_events_transition_check"
      CHECK (
        ("event_type" IN ('create', 'edit') AND "state" = 'draft')
        OR ("event_type" = 'validate' AND "state" = 'validated')
        OR ("event_type" = 'approve' AND "state" = 'approved')
      ),
    CONSTRAINT "rules_authoring_draft_events_revision_check"
      CHECK ("revision" >= 1),
    CONSTRAINT "rules_authoring_draft_events_actor_subject_check"
      CHECK ("actor_subject" ~ '[^[:space:]]')
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
      CHECK ("severity" IN ('error', 'warning', 'info')),
    CONSTRAINT "rules_authoring_draft_validation_issues_revision_check"
      CHECK ("revision" >= 1),
    CONSTRAINT "rules_authoring_draft_validation_issues_position_check"
      CHECK ("position" >= 0)
);

CREATE INDEX "rules_authoring_draft_validation_issues_draft_id_revision_severity_idx"
    ON "rules_authoring_draft_validation_issues"("draft_id", "revision", "severity");
