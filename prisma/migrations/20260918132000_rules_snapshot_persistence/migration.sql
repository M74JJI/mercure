CREATE TABLE "ruleset_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_root" TEXT,
    "source_fingerprint" CHAR(64) NOT NULL,
    "content_fingerprint" CHAR(64) NOT NULL,
    "loaded_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archive_count" INTEGER NOT NULL,
    "file_count" INTEGER NOT NULL,
    "rule_count" INTEGER NOT NULL,
    "decoder_count" INTEGER NOT NULL,
    "use_case_count" INTEGER NOT NULL,
    "jira_visible_count" INTEGER NOT NULL,
    "testing_count" INTEGER NOT NULL,
    "production_count" INTEGER NOT NULL,
    "critical_count" INTEGER NOT NULL,
    "mitre_mapped_count" INTEGER NOT NULL,
    "missing_use_case_count" INTEGER NOT NULL,
    "broken_dependency_count" INTEGER NOT NULL,

    CONSTRAINT "ruleset_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ruleset_snapshot_archives" (
    "snapshot_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "modified_at" TIMESTAMPTZ(6) NOT NULL,
    "xml_files" INTEGER NOT NULL,

    CONSTRAINT "ruleset_snapshot_archives_pkey" PRIMARY KEY ("snapshot_id", "position")
);

CREATE TABLE "ruleset_snapshot_files" (
    "snapshot_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "tenant" VARCHAR(255) NOT NULL,
    "size" BIGINT NOT NULL,
    "source_type" VARCHAR(32) NOT NULL,
    "content" TEXT NOT NULL,
    "sha256" CHAR(64) NOT NULL,

    CONSTRAINT "ruleset_snapshot_files_pkey" PRIMARY KEY ("snapshot_id", "position")
);

CREATE TABLE "ruleset_snapshot_rules" (
    "snapshot_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "source_file_position" INTEGER NOT NULL,
    "rule_id" VARCHAR(64) NOT NULL,
    "level" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "status" VARCHAR(64) NOT NULL,
    "role" VARCHAR(64) NOT NULL,
    "severity" VARCHAR(32) NOT NULL,
    "jira_visible" BOOLEAN NOT NULL,
    "tenant" VARCHAR(255) NOT NULL,
    "source_section" TEXT,
    "use_case_id" VARCHAR(255) NOT NULL,
    "use_case_confidence" VARCHAR(32) NOT NULL,
    "frequency" TEXT,
    "timeframe" TEXT,
    "raw_xml" TEXT NOT NULL,

    CONSTRAINT "ruleset_snapshot_rules_pkey" PRIMARY KEY ("snapshot_id", "position")
);

CREATE TABLE "ruleset_snapshot_rule_groups" (
    "snapshot_id" UUID NOT NULL,
    "rule_position" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ruleset_snapshot_rule_groups_pkey" PRIMARY KEY ("snapshot_id", "rule_position", "position")
);

CREATE TABLE "ruleset_snapshot_rule_mitre" (
    "snapshot_id" UUID NOT NULL,
    "rule_position" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "value" VARCHAR(32) NOT NULL,

    CONSTRAINT "ruleset_snapshot_rule_mitre_pkey" PRIMARY KEY ("snapshot_id", "rule_position", "position")
);

CREATE TABLE "ruleset_snapshot_rule_dependencies" (
    "snapshot_id" UUID NOT NULL,
    "rule_position" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ruleset_snapshot_rule_dependencies_pkey" PRIMARY KEY ("snapshot_id", "rule_position", "position")
);

CREATE TABLE "ruleset_snapshot_rule_fields" (
    "snapshot_id" UUID NOT NULL,
    "rule_position" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "field_type" TEXT,
    "value" TEXT NOT NULL,

    CONSTRAINT "ruleset_snapshot_rule_fields_pkey" PRIMARY KEY ("snapshot_id", "rule_position", "position")
);

CREATE TABLE "ruleset_snapshot_rule_decoded_as" (
    "snapshot_id" UUID NOT NULL,
    "rule_position" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ruleset_snapshot_rule_decoded_as_pkey" PRIMARY KEY ("snapshot_id", "rule_position", "position")
);

CREATE TABLE "ruleset_snapshot_rule_options" (
    "snapshot_id" UUID NOT NULL,
    "rule_position" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ruleset_snapshot_rule_options_pkey" PRIMARY KEY ("snapshot_id", "rule_position", "position")
);

CREATE TABLE "ruleset_snapshot_decoders" (
    "snapshot_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "source_file_position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "parent" TEXT,
    "tenant" VARCHAR(255) NOT NULL,
    "raw_xml" TEXT NOT NULL,

    CONSTRAINT "ruleset_snapshot_decoders_pkey" PRIMARY KEY ("snapshot_id", "position")
);

CREATE TABLE "ruleset_snapshot_decoder_prematches" (
    "snapshot_id" UUID NOT NULL,
    "decoder_position" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ruleset_snapshot_decoder_prematches_pkey" PRIMARY KEY ("snapshot_id", "decoder_position", "position")
);

CREATE TABLE "ruleset_snapshot_decoder_regex" (
    "snapshot_id" UUID NOT NULL,
    "decoder_position" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ruleset_snapshot_decoder_regex_pkey" PRIMARY KEY ("snapshot_id", "decoder_position", "position")
);

CREATE TABLE "ruleset_snapshot_decoder_order_fields" (
    "snapshot_id" UUID NOT NULL,
    "decoder_position" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ruleset_snapshot_decoder_order_fields_pkey" PRIMARY KEY ("snapshot_id", "decoder_position", "position")
);

CREATE TABLE "ruleset_snapshot_issues" (
    "snapshot_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "severity" VARCHAR(32) NOT NULL,
    "type" VARCHAR(128) NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "rule_id" VARCHAR(64),
    "decoder_name" TEXT,
    "file_name" TEXT,
    "tenant" VARCHAR(255),

    CONSTRAINT "ruleset_snapshot_issues_pkey" PRIMARY KEY ("snapshot_id", "position")
);

CREATE TABLE "ruleset_snapshot_use_cases" (
    "snapshot_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "use_case_id" VARCHAR(255) NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "source" VARCHAR(32) NOT NULL,
    "created_by" TEXT NOT NULL,
    "original_created_at" TEXT,

    CONSTRAINT "ruleset_snapshot_use_cases_pkey" PRIMARY KEY ("snapshot_id", "position")
);

CREATE INDEX "ruleset_snapshots_created_at_idx" ON "ruleset_snapshots"("created_at");
CREATE INDEX "ruleset_snapshots_source_fingerprint_idx" ON "ruleset_snapshots"("source_fingerprint");
CREATE INDEX "ruleset_snapshots_content_fingerprint_idx" ON "ruleset_snapshots"("content_fingerprint");

CREATE UNIQUE INDEX "ruleset_snapshot_archives_snapshot_id_name_key"
    ON "ruleset_snapshot_archives"("snapshot_id", "name");

CREATE UNIQUE INDEX "ruleset_snapshot_files_snapshot_id_name_key"
    ON "ruleset_snapshot_files"("snapshot_id", "name");
CREATE INDEX "ruleset_snapshot_files_snapshot_id_tenant_idx"
    ON "ruleset_snapshot_files"("snapshot_id", "tenant");
CREATE INDEX "ruleset_snapshot_files_snapshot_id_source_type_idx"
    ON "ruleset_snapshot_files"("snapshot_id", "source_type");
CREATE INDEX "ruleset_snapshot_files_sha256_idx"
    ON "ruleset_snapshot_files"("sha256");

CREATE INDEX "ruleset_snapshot_rules_snapshot_id_rule_id_idx"
    ON "ruleset_snapshot_rules"("snapshot_id", "rule_id");
CREATE INDEX "ruleset_snapshot_rules_snapshot_id_tenant_idx"
    ON "ruleset_snapshot_rules"("snapshot_id", "tenant");
CREATE INDEX "ruleset_snapshot_rules_snapshot_id_severity_idx"
    ON "ruleset_snapshot_rules"("snapshot_id", "severity");
CREATE INDEX "ruleset_snapshot_rules_snapshot_id_status_idx"
    ON "ruleset_snapshot_rules"("snapshot_id", "status");
CREATE INDEX "ruleset_snapshot_rules_snapshot_id_use_case_id_idx"
    ON "ruleset_snapshot_rules"("snapshot_id", "use_case_id");

CREATE INDEX "ruleset_snapshot_rule_mitre_snapshot_id_value_idx"
    ON "ruleset_snapshot_rule_mitre"("snapshot_id", "value");

CREATE INDEX "ruleset_snapshot_decoders_snapshot_id_name_idx"
    ON "ruleset_snapshot_decoders"("snapshot_id", "name");
CREATE INDEX "ruleset_snapshot_decoders_snapshot_id_tenant_idx"
    ON "ruleset_snapshot_decoders"("snapshot_id", "tenant");

CREATE INDEX "ruleset_snapshot_issues_snapshot_id_severity_idx"
    ON "ruleset_snapshot_issues"("snapshot_id", "severity");
CREATE INDEX "ruleset_snapshot_issues_snapshot_id_type_idx"
    ON "ruleset_snapshot_issues"("snapshot_id", "type");

CREATE UNIQUE INDEX "ruleset_snapshot_use_cases_snapshot_id_use_case_id_key"
    ON "ruleset_snapshot_use_cases"("snapshot_id", "use_case_id");

ALTER TABLE "ruleset_snapshot_archives"
    ADD CONSTRAINT "ruleset_snapshot_archives_snapshot_id_fkey"
    FOREIGN KEY ("snapshot_id") REFERENCES "ruleset_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ruleset_snapshot_files"
    ADD CONSTRAINT "ruleset_snapshot_files_snapshot_id_fkey"
    FOREIGN KEY ("snapshot_id") REFERENCES "ruleset_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ruleset_snapshot_rules"
    ADD CONSTRAINT "ruleset_snapshot_rules_source_file_fkey"
    FOREIGN KEY ("snapshot_id", "source_file_position")
    REFERENCES "ruleset_snapshot_files"("snapshot_id", "position") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ruleset_snapshot_rule_groups"
    ADD CONSTRAINT "ruleset_snapshot_rule_groups_rule_fkey"
    FOREIGN KEY ("snapshot_id", "rule_position")
    REFERENCES "ruleset_snapshot_rules"("snapshot_id", "position") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ruleset_snapshot_rule_mitre"
    ADD CONSTRAINT "ruleset_snapshot_rule_mitre_rule_fkey"
    FOREIGN KEY ("snapshot_id", "rule_position")
    REFERENCES "ruleset_snapshot_rules"("snapshot_id", "position") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ruleset_snapshot_rule_dependencies"
    ADD CONSTRAINT "ruleset_snapshot_rule_dependencies_rule_fkey"
    FOREIGN KEY ("snapshot_id", "rule_position")
    REFERENCES "ruleset_snapshot_rules"("snapshot_id", "position") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ruleset_snapshot_rule_fields"
    ADD CONSTRAINT "ruleset_snapshot_rule_fields_rule_fkey"
    FOREIGN KEY ("snapshot_id", "rule_position")
    REFERENCES "ruleset_snapshot_rules"("snapshot_id", "position") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ruleset_snapshot_rule_decoded_as"
    ADD CONSTRAINT "ruleset_snapshot_rule_decoded_as_rule_fkey"
    FOREIGN KEY ("snapshot_id", "rule_position")
    REFERENCES "ruleset_snapshot_rules"("snapshot_id", "position") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ruleset_snapshot_rule_options"
    ADD CONSTRAINT "ruleset_snapshot_rule_options_rule_fkey"
    FOREIGN KEY ("snapshot_id", "rule_position")
    REFERENCES "ruleset_snapshot_rules"("snapshot_id", "position") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ruleset_snapshot_decoders"
    ADD CONSTRAINT "ruleset_snapshot_decoders_source_file_fkey"
    FOREIGN KEY ("snapshot_id", "source_file_position")
    REFERENCES "ruleset_snapshot_files"("snapshot_id", "position") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ruleset_snapshot_decoder_prematches"
    ADD CONSTRAINT "ruleset_snapshot_decoder_prematches_decoder_fkey"
    FOREIGN KEY ("snapshot_id", "decoder_position")
    REFERENCES "ruleset_snapshot_decoders"("snapshot_id", "position") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ruleset_snapshot_decoder_regex"
    ADD CONSTRAINT "ruleset_snapshot_decoder_regex_decoder_fkey"
    FOREIGN KEY ("snapshot_id", "decoder_position")
    REFERENCES "ruleset_snapshot_decoders"("snapshot_id", "position") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ruleset_snapshot_decoder_order_fields"
    ADD CONSTRAINT "ruleset_snapshot_decoder_order_fields_decoder_fkey"
    FOREIGN KEY ("snapshot_id", "decoder_position")
    REFERENCES "ruleset_snapshot_decoders"("snapshot_id", "position") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ruleset_snapshot_issues"
    ADD CONSTRAINT "ruleset_snapshot_issues_snapshot_id_fkey"
    FOREIGN KEY ("snapshot_id") REFERENCES "ruleset_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ruleset_snapshot_use_cases"
    ADD CONSTRAINT "ruleset_snapshot_use_cases_snapshot_id_fkey"
    FOREIGN KEY ("snapshot_id") REFERENCES "ruleset_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
