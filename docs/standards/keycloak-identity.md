# Keycloak identity deployment standard

Mercure identity follows ADR-0015. Keycloak authenticates users, the Next.js web application owns the HTTP-only application session, and NestJS remains the authoritative API authorization boundary.

## Keycloak clients

Use separate clients for the browser-facing authorization-code flow and the protected API resource.

### `mercure-web`

- Confidential OpenID Connect client used by Auth.js.
- Standard authorization-code flow enabled.
- Direct access grants are not required.
- Valid redirect URIs must be restricted to the deployed Mercure web origin and Auth.js callback path.
- Web origins must be restricted to the deployed Mercure web origin.
- The client secret is provided only to the Next.js server through `AUTH_KEYCLOAK_SECRET`.
- The access token issued through this client must include the Mercure API audience described below.

### `mercure-api`

- Represents the NestJS API resource and the default client-role namespace consumed by Mercure.
- The backend `OIDC_AUDIENCE` must match the audience value emitted into web-client access tokens.
- The backend `OIDC_CLIENT_ID` selects the `resource_access[client]` role namespace.
- The frontend `WEB_AUTH_AUTHORITY_CLIENT_ID` must select the same role namespace when client roles contribute to presentation-role mapping.

If different client identifiers are used in a deployment, keep these values aligned explicitly rather than relying on defaults.

## API audience

A token acquired by `mercure-web` is forwarded server-to-server to NestJS. Therefore its `aud` claim must contain the configured Mercure API audience, default `mercure-api`.

Configure a Keycloak audience mapper or equivalent client-scope mapper so access tokens issued to `mercure-web` include that audience. Do not weaken the NestJS audience check to make a misconfigured token pass.

## Application roles

Mercure maps external authorities to the application roles `admin` and `user`.

Authorities may come from:

- realm roles;
- roles in the configured client-role namespace;
- Keycloak groups.

The web and API authority mappings must describe the same application policy. The frontend mapping is only for route/presentation behavior. NestJS capabilities remain authoritative.

Default mappings are:

- admin: `admin`, `/security-admins`;
- user: `user`, `/security-users`.

An authenticated identity with no mapped role is denied.

## Production web configuration

The Next.js deployment must provide:

- `AUTH_SECRET`: strong application-session encryption secret;
- `AUTH_URL`: canonical HTTPS Mercure web origin;
- `AUTH_TRUST_HOST=true`: only behind the deployment's trusted host/proxy boundary;
- `AUTH_KEYCLOAK_ID`: authorization-code client identifier, normally `mercure-web`;
- `AUTH_KEYCLOAK_SECRET`: confidential client secret;
- `AUTH_KEYCLOAK_ISSUER`: HTTPS Keycloak realm issuer;
- `WEB_AUTH_AUTHORITY_CLIENT_ID`: client-role namespace, normally `mercure-api`.

Optional policy/lifetime controls:

- `WEB_AUTH_ADMIN_AUTHORITIES`;
- `WEB_AUTH_USER_AUTHORITIES`;
- `WEB_AUTH_REFRESH_SKEW_SECONDS`;
- `WEB_AUTH_REFRESH_TIMEOUT_MS`;
- `WEB_AUTH_SESSION_MAX_AGE_SECONDS`.

Production startup/build validation fails closed when required identity settings are absent or use an insecure origin.

## Production API configuration

The NestJS deployment must provide:

- `OIDC_ISSUER_URL`;
- `OIDC_AUDIENCE`;
- `OIDC_CLIENT_ID`.

`OIDC_JWKS_URL` is optional; when omitted, Mercure derives the standard Keycloak JWKS endpoint from the issuer. Authority mappings and bounded JWKS timing controls remain configurable through the existing `OIDC_*` settings.

## Token boundary

- Access and refresh tokens stay in the encrypted HTTP-only Auth.js session.
- Browser-facing session data contains no bearer or refresh token.
- Server-to-server API requests replace any pre-existing Authorization header with the current Keycloak access token.
- Browser cookies are stripped before the API request is sent.
- Refresh failure invalidates usable provider token state and requires reauthentication.
- NestJS validates signature, issuer, audience, lifetime and mapped capabilities independently of frontend state.
