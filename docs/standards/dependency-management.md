# Dependency management standard

Mercure treats dependency resolution as part of the security boundary.

## Rules

- Direct dependencies are exact-version pinned.
- pnpm runs with `autoInstallPeers: false` and `strictPeerDependencies: true` so peer contracts are explicit and reviewable.
- Newly published versions are quarantined for seven days by default.
- Install/build scripts are denied by default and individually approved by exact version.
- Optional integrations that Mercure does not use are excluded rather than installed merely to silence peer warnings.
- Peer dependencies required by a selected integration are installed explicitly. For example, `@nx/next` depends on `copy-webpack-plugin`, whose Webpack peer is satisfied by the pinned workspace Webpack version.
- An unsupported major is not adopted simply because it is newer. Conversely, Mercure avoids holding back on an EOL major when a supported direct-integration path exists.

## ESLint and Next.js

Mercure uses ESLint 10 with `@next/eslint-plugin-next` directly instead of `eslint-config-next`. The direct-plugin approach is documented by Next.js for complex configurations and prevents unrelated legacy plugin peer ranges bundled by the shareable config from forcing the workspace back to ESLint 9.

The official React Hooks ESLint plugin is included separately so Rules of Hooks and compiler-oriented checks remain enforced under ESLint 10.

## Optional Nx integrations

`@nx/next` depends on `@nx/react`, which declares `@nx/vite` as an optional dependency. Mercure does not use Vite, so `@nx/vite` is excluded through pnpm's `ignoredOptionalDependencies` rather than introducing an unused build stack and its peer dependencies.
