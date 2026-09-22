# Production observability contract

Mercure's application-level observability starts with structured request logging, server-generated request IDs, bounded problem details, liveness/readiness probes, and explicit audit/provenance records for Rules authoring. Production deployments must connect those signals to an operational monitoring system rather than treating application stdout as sufficient observability.

## Existing application signals

The API emits structured Pino HTTP logs with:

- service and environment identity;
- a server-generated `x-request-id` for request correlation;
- request/response lifecycle information and duration from the HTTP logger;
- centralized secret/body redaction for authorization headers, cookies, tokens, passwords, XML/content fields, and other sensitive values.

Problem responses include the request ID so an operator can correlate a user-visible failure with server logs without exposing stack traces or secrets.

The API also exposes:

- `GET /api/v1/health/live` for process liveness;
- `GET /api/v1/health/ready` for bounded dependency readiness.

Both health routes are infrastructure probes and must be restricted to trusted deployment networks as described in `production-readiness.md`.

## Production collection requirements

A production environment should:

1. collect API and web stdout/stderr into a centralized, access-controlled log platform;
2. preserve timestamps in UTC and keep host/container clocks synchronized;
3. index request ID, service, environment, status code, route, and request duration where available;
4. apply a retention policy appropriate for operational/security investigations;
5. prevent raw tokens, cookies, database credentials, Rules XML, archive contents, and private filesystem data from entering the telemetry backend;
6. collect deployment-platform CPU, memory, restart, filesystem, and network saturation signals independently of application logs.

## Minimum alerts

Alert thresholds should be tuned to the real environment, but monitoring should detect at least:

- sustained API 5xx responses or readiness failures;
- repeated process/container restarts;
- PostgreSQL connectivity/readiness failures;
- abnormal authentication failures or authorization-denial spikes;
- Rules intelligence saturation/rate-limit responses;
- repeated import conflicts or service-unavailable outcomes;
- material request-latency regression on protected Rules endpoints;
- release/deployment health-check failure.

Do not alert on a single expected 401/403, rate-limit response, or transient health probe without context; alerts should reflect sustained or security-relevant conditions.

## Metrics and tracing

Mercure intentionally does not add a second distributed observability stack before there is a demonstrated deployment requirement. Structured request logs and platform metrics are sufficient for the current single-web/single-API architecture.

If cross-service tracing, OpenTelemetry collection, or a dedicated application metrics endpoint becomes necessary, introduce it as a bounded platform capability with explicit data-cardinality, privacy, authentication, retention, and failure-mode decisions. Telemetry must never become a path for raw Rules content or identity secrets.
