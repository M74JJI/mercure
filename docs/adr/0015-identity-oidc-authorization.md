# ADR-0015: Identity, OIDC and authorization boundary

- Status: Accepted
- Date: 2026-09-19
- Legacy behavioral reference: `M74JJI/m-rules@21b1f5d9d4d91ecfd297ac211ce50ac5cd2e2028`

## Context

Mercure now has a stable platform foundation and a completed approved non-AI Rules migration scope. Authentication and authorization were intentionally deferred until the backend, frontend, persistence, API contracts and module boundaries were stable.

The legacy Rules application authenticates users with Keycloak through NextAuth and maps Keycloak realm/client roles and groups to the application roles `admin` and `user`. That behavior is useful, but authorization currently lives in frontend-oriented guards and cannot be copied into Mercure because NestJS is the authoritative backend boundary.

Mercure currently renders Rules data through Next.js server components. Those server components call the NestJS API through the generated typed API client. This creates a natural backend-for-frontend boundary in which the browser receives an HTTP-only application session while NestJS receives a short-lived Keycloak access token.

The design must prevent frontend-only authorization, token leakage, permissive fallback access, duplicated password storage, and security logic inside product modules.

## Decision

### Identity provider

Keycloak remains the external OpenID Connect identity provider.

Mercure does not store passwords and does not implement local username/password authentication.

The web application uses the OpenID Connect authorization-code flow through a server-side authentication/session library. The application session is held only in secure HTTP-only cookies. Keycloak access and refresh tokens remain server-side and are never returned to browser components, serialized into page props, or exposed through public API responses.

### Backend-for-frontend behavior

`apps/web` remains a thin composition root.

Authenticated Next.js server code obtains the current application session and injects the current Keycloak access token into server-to-server calls made by the generated Mercure API client.

Browser components do not receive bearer tokens.

The existing explicit API origin configuration remains. Authentication does not require credentialed browser CORS because authenticated product API calls are made server-to-server.

### NestJS authentication boundary

`apps/api` is the authoritative authentication and authorization enforcement point.

The API validates Keycloak bearer access tokens against the configured issuer and its OIDC/JWKS metadata. Validation must verify, at minimum:

- signature using an explicitly accepted asymmetric algorithm;
- issuer;
- expiration and not-before constraints;
- the configured Mercure API audience/resource;
- a non-empty subject;
- structurally valid role/group claims.

JWKS retrieval is cached and bounded. Unknown key identifiers may trigger refresh subject to throttling so attacker-controlled tokens cannot create unbounded outbound requests.

Tokens, authorization headers, cookies, client secrets and refresh tokens must remain covered by structured-log redaction.

### Protected-by-default API

Product API routes are authenticated by default.

Anonymous access is restricted to explicitly marked platform endpoints that need to operate before authentication, initially:

- liveness;
- readiness.

OpenAPI exposure remains controlled by its existing environment configuration and is not made public merely because identity exists.

A route must opt out of authentication through an explicit platform-level public-route mechanism. Product modules must not implement ad-hoc authentication bypasses.

### Authorization model

Mercure initially preserves the legacy application roles:

- `admin`;
- `user`.

Role resolution is centralized in the identity/security platform library.

Keycloak realm roles, configured client roles and group names may contribute authorities. Configuration maps accepted external authorities to Mercure roles.

Defaults are deny-by-default:

- an authenticated principal with no mapped Mercure role is rejected;
- there is no production equivalent of `AUTH_ALLOW_UNMAPPED_USERS=true`;
- `admin` implies the capabilities granted to `user`, but authorization checks operate on capabilities rather than scattered string comparisons where practical.

The initial capability model is intentionally small:

- `platform:read`;
- `rules:read`;
- `rules:import`;
- `rules:admin`.

`user` receives read capabilities. `admin` receives read and mutating Rules capabilities.

Future modules add capabilities through their own architecture/product work without redefining authentication.

### Rules authorization

Existing read-only Rules endpoints require `rules:read`.

Rules import requires `rules:import`.

Future public Rules catalog administration or other mutation requires an explicit mutating capability such as `rules:admin` and must not be exposed before the relevant feature is implemented.

Internal application/domain use cases remain transport-independent and do not import authentication framework code.

### Frontend route behavior

Platform and Rules pages require an authenticated mapped Mercure user.

Unauthenticated users are redirected to sign-in with a sanitized same-origin callback path.

Authenticated users without a mapped application role receive a forbidden state.

Redirect targets must reject protocol-relative URLs, external origins, authentication callback paths and framework-internal paths.

### Session and token lifetime

Application sessions do not extend Keycloak security state indefinitely.

The server-side session layer tracks access-token expiry and refreshes through Keycloak when required. Refresh failure invalidates the application session and requires reauthentication.

Session cookies are secure in production, HTTP-only and SameSite protected. Production deployments must provide the configured authentication secret and trusted host/origin settings explicitly.

### Persistence

No authentication/user table is introduced solely to make SSO work.

Keycloak remains the source of authentication identity. Mercure may add application-owned user preferences, audit attribution or provisioning state later through a separate bounded requirement.

### Testing

Identity work must include deterministic tests for:

- issuer/audience/signature/expiry validation;
- malformed and missing bearer tokens;
- unknown `kid` handling without unbounded JWKS fetches;
- role/group normalization;
- deny-by-default unmapped users;
- role-to-capability mapping;
- public-route metadata;
- global authentication enforcement;
- authorization failures returning 401/403 correctly;
- server-side API token injection without exposing tokens to browser-facing data;
- safe callback-path handling;
- Rules read/import capability separation.

Integration tests must use local deterministic signing keys or a purpose-built local fixture. CI must not depend on a live external Keycloak service.

## Consequences

- NestJS becomes the final authorization authority for every product API.
- The frontend can render role-aware UX, but hiding UI never substitutes for backend authorization.
- Mercure preserves the useful Keycloak SSO behavior from the legacy application without importing its frontend-centric security architecture.
- Access tokens stay server-side in normal web use.
- Product modules consume a stable principal/capability abstraction instead of Keycloak-specific claims.
- Public mutating Rules features can be added later without weakening the security boundary.
- Identity becomes a platform capability rather than a Rules dependency.

## Deferred

This ADR does not introduce:

- local passwords;
- self-registration;
- social-login providers;
- API keys or service accounts;
- SCIM provisioning;
- per-tenant identity realms;
- fine-grained ABAC;
- persistence of Keycloak tokens;
- public user/role administration APIs.

Those require concrete requirements and separate decisions.
