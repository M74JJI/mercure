# Security policy

Mercure is a security-sensitive application. Please report suspected vulnerabilities privately and avoid disclosing exploit details in public issues, pull requests, discussions, or commit messages.

## Supported versions

Mercure is under active development. Security fixes are applied to the current `main` line and to any explicitly maintained release line documented by the project. Older unmaintained commits should not be assumed to receive security fixes.

## Reporting a vulnerability

Use GitHub private vulnerability reporting for this repository when the **Report a vulnerability** option is available under the repository Security tab.

If private vulnerability reporting is not available, contact the repository maintainer through an established private channel and include only enough information to establish contact. Do not open a public issue containing vulnerability details.

A useful report includes:

- the affected commit or release;
- the affected endpoint, component, or trust boundary;
- reproducible steps or a minimal proof of concept;
- expected versus observed behavior;
- realistic impact and preconditions;
- any evidence that credentials, tokens, personal data, or production systems may have been exposed.

Do not include live credentials, access tokens, private keys, customer data, or other third-party secrets in the report. If exposure is suspected, rotate or revoke the affected credential first.

## Coordinated disclosure

Please allow time to reproduce the issue, prepare a fix, validate regressions, and coordinate disclosure. Mercure will prefer a security advisory or release note that accurately describes the affected versions, impact, and remediation without publishing unnecessary exploit detail before users can update.

## Scope

Security reports are especially relevant for:

- OIDC/JWKS verification and session handling;
- authentication or capability-authorization bypass;
- cross-tenant data access;
- Rules archive path traversal, decompression, parser, or resource-exhaustion issues;
- disclosure of raw XML, filesystem paths, tokens, cookies, or secrets;
- authoring approval/export integrity;
- PostgreSQL isolation, locking, or rate-limit bypass;
- CI/CD, dependency, release-artifact, or supply-chain compromise.

Feature requests, ordinary bugs, and configuration questions should use normal project channels rather than the vulnerability-reporting path.
