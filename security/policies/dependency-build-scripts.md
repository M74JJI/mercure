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

## Review procedure

When pnpm reports `ERR_PNPM_IGNORED_BUILDS`:

1. Do not disable `strictDepBuilds`.
2. Identify the exact package and version.
3. Review the published package/source and install script.
4. Confirm the dependency is necessary.
5. Add only an exact-version approval or an explicit denial.
6. Document the decision in this file.
7. Re-run installation and all workspace quality gates.
