CREATE TABLE "rules_use_case_catalog" (
    "id" VARCHAR(255) NOT NULL,
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
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rules_use_case_catalog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rules_use_case_catalog_component_name_idx"
    ON "rules_use_case_catalog"("component", "name");

CREATE INDEX "rules_use_case_catalog_source_idx"
    ON "rules_use_case_catalog"("source");

CREATE INDEX "rules_use_case_catalog_updated_at_idx"
    ON "rules_use_case_catalog"("updated_at");
