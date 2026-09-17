# Dependency build-script policy

## Policy

Dependency lifecycle scripts execute arbitrary code during installation and are therefore denied by default. Mercure uses pnpm `strictDepBuilds` (enabled by default) and an exact-version `allowBuilds` map in `pnpm-workspace.yaml`.

A package may be allowlisted only when its install-time behavior has been reviewed, is required for the selected toolchain to function correctly, and the matcher is constrained to the reviewed version. New or upgraded versions require renewed review.

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

- Purpose: production bundler for the NestJS API through `@nx/esbuild`.
- Script: esbuild uses its install lifecycle to verify and prepare the platform-specific native executable used by the JavaScript API and CLI.
- Decision: approved only for the exact pinned version. The build pipeline directly depends on the esbuild native binary; any esbuild upgrade requires renewed lifecycle-script and build-output review before the allowlist entry changes.

## Review procedure

When pnpm reports `ERR_PNPM_IGNORED_BUILDS`:

1. Do not disable `strictDepBuilds`.
2. Identify the exact package and version.
3. Review the published package/source and install script.
4. Confirm the dependency is necessary.
5. Add only an exact-version approval or an explicit denial.
6. Document the decision in this file.
7. Re-run installation and all workspace quality gates.
