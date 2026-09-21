CREATE TABLE "ruleset_import_leases" (
    "key" VARCHAR(64) NOT NULL,
    "owner" UUID NOT NULL,
    "acquired_at" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ruleset_import_leases_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "ruleset_import_leases_expires_at_idx"
ON "ruleset_import_leases"("expires_at");
