# Dependency build-script policy

## Policy

Dependency lifecycle scripts execute arbitrary code during installation and are therefore denied by default. Mercure uses pnpm `strictDepBuilds` (enabled by default) and an exact-version `allowBuilds` map in `pnpm-workspace.yaml`.

A package may be allowlisted only when its install-time behavior has been reviewed, is required for the selected toolchain to function correctly, and the matcher is constrained to the reviewed version. New or upgraded versions require renewed review.

An explicit `false` entry records a reviewed dependency whose lifecycle script is intentionally denied. This distinguishes a deliberate security decision from an unreviewed script.

`dangerouslyAllowAllBuilds` is prohibited.

## Approved builds

### `nx@23.2.1`

- Purpose: Nx workspace orchestration.
- Script: Nx declares a `postinstall` entry that invokes its packaged post-install routine.
- Decision: approved for the exact pinned Nx version because Nx is a foundational workspace executable and its own package intentionally performs post-install initialization.

### `@parcel/watcher@2.6.0`

- Purpose: native filesystem watching used by Nx and development tooling.
- Script: `install` invokes `scripts/build-from-source.js`.
- Decision: approved for the exact resolved version. The package is a native C++ watcher and its install path prepares the native addon when necessary.

### `unrs-resolver@1.12.2`

- Purpose: native module-resolution dependency used transitively by the Nx/ESLint developer-tooling graph.
- Script: `postinstall` invokes `node postinstall.js`, which uses the package's native-binding preparation path so the platform-specific resolver binding is available at runtime.
- Decision: approved only for the exact resolved version. The install script is required for reliable native binding resolution in package-manager environments that block dependency lifecycle scripts by default; changing this version requires a fresh source/release and lockfile review.

### `esbuild@0.28.2`

- Purpose: production bundler for the NestJS API through the Nx esbuild executor.
- Script: `postinstall` prepares and verifies the platform-specific esbuild executable.
- Decision: approved only for the exact pinned version because esbuild is an intentional production build dependency. Upgrades require renewed review before the allowlist version changes.

## Explicitly denied builds

### `@scarf/scarf@1.4.0`

- Purpose: transitive package whose install lifecycle can report dependency-usage analytics.
- Decision: denied. Mercure does not require install-time analytics for build or runtime correctness, so the lifecycle script has no justified execution path in CI or developer installs.

## Review procedure

When pnpm reports `ERR_PNPM_IGNORED_BUILDS`:

1. Do not disable `strictDepBuilds`.
2. Identify the exact package and version.
3. Review the published package/source and install script.
4. Confirm whether the dependency actually requires the script for Mercure's selected path.
5. Record an exact-version `true` approval or `false` denial.
6. Document the decision in this file.
7. Re-run installation and all workspace quality gates.
