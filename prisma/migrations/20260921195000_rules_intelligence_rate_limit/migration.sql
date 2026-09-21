CREATE TABLE "rules_intelligence_rate_limits" (
    "key" CHAR(64) NOT NULL,
    "window_start" TIMESTAMPTZ(6) NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "rules_intelligence_rate_limits_pkey" PRIMARY KEY ("key"),
    CONSTRAINT "rules_intelligence_rate_limits_count_check" CHECK ("count" >= 1)
);

CREATE INDEX "rules_intelligence_rate_limits_window_start_idx"
ON "rules_intelligence_rate_limits"("window_start");
