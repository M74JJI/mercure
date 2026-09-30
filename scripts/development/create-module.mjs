#!/usr/bin/env node

import { access, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultWorkspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function names(rawName) {
  const kebab = rawName.trim().toLowerCase();
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(kebab)) {
    throw new Error(
      'Module name must be kebab-case and start with a letter. Example: client-inventory',
    );
  }
  const parts = kebab.split('-');
  return {
    kebab,
    pascal: parts.map((part) => `${part[0].toUpperCase()}${part.slice(1)}`).join(''),
    display: parts.map((part) => `${part[0].toUpperCase()}${part.slice(1)}`).join(' '),
  };
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function projectFile({ name, path, side, type, test = false }) {
  const targets = {
    typecheck: {
      executor: 'nx:run-commands',
      options: { command: `tsc --noEmit -p ${path}/tsconfig.lib.json` },
    },
  };
  if (test) {
    targets.test = {
      executor: 'nx:run-commands',
      options: { command: `vitest run --config ${path}/vitest.config.ts` },
    };
  }
  return json({
    $schema: '../../../../../node_modules/nx/schemas/project-schema.json',
    name: `${name}-${side}-${type}`,
    projectType: 'library',
    sourceRoot: `${path}/src`,
    tags: [`scope:${name}`, `side:${side}`, `type:${type}`],
    targets,
  });
}

function packageFile(name, side, type, dependencies = {}) {
  return json({
    name: `@mercure/${name}-${side}-${type}`,
    version: '0.0.0',
    private: true,
    type: side === 'backend' ? 'commonjs' : 'module',
    exports: { '.': './src/index.ts' },
    ...(Object.keys(dependencies).length > 0 ? { dependencies } : {}),
  });
}

function tsconfig(side) {
  return json({
    extends: '../../../../../tsconfig.base.json',
    compilerOptions:
      side === 'backend'
        ? {
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
            lib: ['ES2023'],
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            noEmit: true,
            target: 'ES2023',
            types: ['node', 'vitest/globals'],
          }
        : {
            jsx: 'react-jsx',
            lib: ['DOM', 'DOM.Iterable', 'ES2023'],
            module: 'ESNext',
            moduleResolution: 'Bundler',
            noEmit: true,
            target: 'ES2023',
            types: ['node', 'vitest/globals'],
          },
    include: ['src/**/*.ts', ...(side === 'frontend' ? ['src/**/*.tsx'] : []), 'vitest.config.ts'],
  });
}

const eslintConfig =
  "import baseConfig from '../../../../../eslint.config.mjs';\n\nexport default baseConfig;\n";
const vitestConfig =
  "import { defineConfig } from 'vitest/config';\n\nexport default defineConfig({ test: { environment: 'node' } });\n";

function addLibrary(files, n, side, type, sourceFiles, dependencies = {}, test = false) {
  const path = `libs/modules/${n.kebab}/${side}/${type}`;
  files.set(`${path}/project.json`, projectFile({ name: n.kebab, path, side, type, test }));
  files.set(`${path}/package.json`, packageFile(n.kebab, side, type, dependencies));
  files.set(`${path}/tsconfig.lib.json`, tsconfig(side));
  files.set(`${path}/eslint.config.mjs`, eslintConfig);
  if (test) files.set(`${path}/vitest.config.ts`, vitestConfig);
  for (const [relativePath, content] of Object.entries(sourceFiles)) {
    files.set(`${path}/src/${relativePath}`, content);
  }
}

export function buildModulePlan(rawName) {
  const n = names(rawName);
  const files = new Map();
  const domainPackage = `@mercure/${n.kebab}-backend-domain`;
  const applicationPackage = `@mercure/${n.kebab}-backend-application`;
  const presentationPackage = `@mercure/${n.kebab}-backend-presentation`;
  const uiPackage = `@mercure/${n.kebab}-frontend-ui`;
  const dataAccessPackage = `@mercure/${n.kebab}-frontend-data-access`;

  addLibrary(files, n, 'backend', 'domain', {
    'index.ts': `export interface ${n.pascal}Overview {\n  readonly module: '${n.kebab}';\n  readonly status: 'ready';\n}\n`,
  });

  addLibrary(
    files,
    n,
    'backend',
    'application',
    {
      'index.ts': `import type { ${n.pascal}Overview } from '${domainPackage}';\n\nexport class Get${n.pascal}Overview {\n  execute(): ${n.pascal}Overview {\n    return { module: '${n.kebab}', status: 'ready' };\n  }\n}\n`,
      [`lib/get-${n.kebab}-overview.spec.ts`]: `import { describe, expect, it } from 'vitest';\n\nimport { Get${n.pascal}Overview } from '../index';\n\ndescribe('Get${n.pascal}Overview', () => {\n  it('returns module readiness', () => {\n    expect(new Get${n.pascal}Overview().execute()).toEqual({ module: '${n.kebab}', status: 'ready' });\n  });\n});\n`,
    },
    { [domainPackage]: 'workspace:*' },
    true,
  );

  addLibrary(
    files,
    n,
    'backend',
    'presentation',
    {
      'index.ts': `export { ${n.pascal}Controller } from './lib/${n.kebab}.controller';\n`,
      [`lib/${n.kebab}.controller.ts`]: `import { Controller, Get } from '@nestjs/common';\n\nimport { Get${n.pascal}Overview } from '${applicationPackage}';\n\n@Controller({ path: '${n.kebab}', version: '1' })\nexport class ${n.pascal}Controller {\n  constructor(private readonly getOverview: Get${n.pascal}Overview) {}\n\n  @Get()\n  overview() {\n    return this.getOverview.execute();\n  }\n}\n`,
    },
    { [applicationPackage]: 'workspace:*', '@nestjs/common': '11.2.5' },
  );

  addLibrary(
    files,
    n,
    'backend',
    'feature',
    {
      'index.ts': `export { ${n.pascal}BackendModule } from './lib/${n.kebab}-backend.module';\n`,
      [`lib/${n.kebab}-backend.module.ts`]: `import { Module } from '@nestjs/common';\n\nimport { Get${n.pascal}Overview } from '${applicationPackage}';\nimport { ${n.pascal}Controller } from '${presentationPackage}';\n\n@Module({\n  controllers: [${n.pascal}Controller],\n  providers: [Get${n.pascal}Overview],\n  exports: [Get${n.pascal}Overview],\n})\nexport class ${n.pascal}BackendModule {}\n`,
    },
    {
      [applicationPackage]: 'workspace:*',
      [presentationPackage]: 'workspace:*',
      '@nestjs/common': '11.2.5',
    },
  );

  addLibrary(files, n, 'frontend', 'data-access', {
    'index.ts': `export interface ${n.pascal}OverviewViewModel {\n  readonly module: '${n.kebab}';\n  readonly status: 'ready';\n}\n\nexport const initial${n.pascal}Overview: ${n.pascal}OverviewViewModel = {\n  module: '${n.kebab}',\n  status: 'ready',\n};\n`,
  });

  addLibrary(
    files,
    n,
    'frontend',
    'ui',
    {
      'index.ts': `export { ${n.pascal}Overview } from './lib/${n.kebab}-overview';\n`,
      [`lib/${n.kebab}-overview.tsx`]: `import { Section, SectionContent, SectionDescription, SectionHeader, SectionTitle, StatusIndicator } from '@mercure/platform-frontend-design-system';\n\nexport function ${n.pascal}Overview() {\n  return (\n    <Section>\n      <SectionHeader>\n        <div>\n          <SectionTitle>${n.display}</SectionTitle>\n          <SectionDescription>Module foundation ready for capability implementation.</SectionDescription>\n        </div>\n        <StatusIndicator tone="positive">Ready</StatusIndicator>\n      </SectionHeader>\n      <SectionContent>Replace this boundary-safe placeholder with module-owned UI.</SectionContent>\n    </Section>\n  );\n}\n`,
    },
    { '@mercure/platform-frontend-design-system': 'workspace:*', react: '19.3.0' },
  );

  addLibrary(
    files,
    n,
    'frontend',
    'feature',
    {
      'index.ts': `export { ${n.pascal}OverviewFeature } from './lib/${n.kebab}-overview-feature';\n`,
      [`lib/${n.kebab}-overview-feature.tsx`]: `import { PageLayout, PageLayoutBody, PageLayoutDescription, PageLayoutEyebrow, PageLayoutHeader, PageLayoutHeading, PageLayoutTitle } from '@mercure/platform-frontend-design-system';\nimport { initial${n.pascal}Overview } from '${dataAccessPackage}';\nimport { ${n.pascal}Overview } from '${uiPackage}';\n\nexport function ${n.pascal}OverviewFeature() {\n  return (\n    <PageLayout>\n      <PageLayoutHeader>\n        <PageLayoutHeading>\n          <PageLayoutEyebrow>Mercure module</PageLayoutEyebrow>\n          <PageLayoutTitle>${n.display}</PageLayoutTitle>\n          <PageLayoutDescription>Isolated product capability using platform contracts.</PageLayoutDescription>\n        </PageLayoutHeading>\n      </PageLayoutHeader>\n      <PageLayoutBody data-module-status={initial${n.pascal}Overview.status}>\n        <${n.pascal}Overview />\n      </PageLayoutBody>\n    </PageLayout>\n  );\n}\n`,
    },
    {
      '@mercure/platform-frontend-design-system': 'workspace:*',
      [dataAccessPackage]: 'workspace:*',
      [uiPackage]: 'workspace:*',
      react: '19.3.0',
    },
  );

  files.set(
    `apps/web/src/app/(platform)/${n.kebab}/page.tsx`,
    `import { ${n.pascal}OverviewFeature } from '@mercure/${n.kebab}-frontend-feature';\n\nexport default function ${n.pascal}Page() {\n  return <${n.pascal}OverviewFeature />;\n}\n`,
  );

  return { files, names: n };
}

function insertBeforeMarker(source, marker, value) {
  if (!source.includes(marker)) throw new Error(`Required generator marker missing: ${marker}`);
  return source.replace(marker, `${value}\n${marker}`);
}

function sortedDependencies(packageJson, name, version) {
  return {
    ...packageJson,
    dependencies: Object.fromEntries(
      Object.entries({ ...(packageJson.dependencies ?? {}), [name]: version }).sort(([a], [b]) =>
        a.localeCompare(b),
      ),
    ),
  };
}

export async function createModule(
  rawName,
  { dryRun = false, workspaceRoot = defaultWorkspaceRoot } = {},
) {
  const plan = buildModulePlan(rawName);
  const moduleRoot = join(workspaceRoot, 'libs', 'modules', plan.names.kebab);
  try {
    await access(moduleRoot);
    throw new Error(`Module already exists: libs/modules/${plan.names.kebab}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Module already exists:')) throw error;
  }

  const centralPaths = {
    apiModule: join(workspaceRoot, 'apps/api/src/app/app.module.ts'),
    apiPackage: join(workspaceRoot, 'apps/api/package.json'),
    webPackage: join(workspaceRoot, 'apps/web/package.json'),
    navigation: join(workspaceRoot, 'libs/platform/frontend/navigation/src/lib/navigation.ts'),
  };
  for (const path of plan.files.keys()) {
    if (path.startsWith(`libs/modules/${plan.names.kebab}/`)) continue;
    try {
      await access(join(workspaceRoot, path));
      throw new Error(`Generated target already exists: ${path}`);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Generated target already exists:')) {
        throw error;
      }
    }
  }
  const originals = Object.fromEntries(
    await Promise.all(
      Object.entries(centralPaths).map(async ([key, path]) => [key, await readFile(path, 'utf8')]),
    ),
  );
  const backendPackage = `@mercure/${plan.names.kebab}-backend-feature`;
  const frontendPackage = `@mercure/${plan.names.kebab}-frontend-feature`;
  const updates = {
    apiModule: insertBeforeMarker(
      insertBeforeMarker(
        originals.apiModule,
        '// module-generator:imports',
        `import { ${plan.names.pascal}BackendModule } from '${backendPackage}';`,
      ),
      '    // module-generator:modules',
      `    ${plan.names.pascal}BackendModule,`,
    ),
    navigation: insertBeforeMarker(
      originals.navigation,
      '  // module-generator:navigation',
      `  {\n    id: '${plan.names.kebab}',\n    label: '${plan.names.display}',\n    href: '/${plan.names.kebab}',\n    icon: 'module',\n  },`,
    ),
    apiPackage: json(
      sortedDependencies(JSON.parse(originals.apiPackage), backendPackage, 'workspace:*'),
    ),
    webPackage: json(
      sortedDependencies(JSON.parse(originals.webPackage), frontendPackage, 'workspace:*'),
    ),
  };

  if (dryRun) {
    return { created: [...plan.files.keys()], updated: Object.values(centralPaths) };
  }

  const tempRoot = join(workspaceRoot, 'libs', 'modules', `.module-generator-${plan.names.kebab}`);
  const createdExternalPaths = [];
  await rm(tempRoot, { recursive: true, force: true });
  try {
    for (const [path, content] of plan.files) {
      const target = path.startsWith(`libs/modules/${plan.names.kebab}/`)
        ? join(tempRoot, path.slice(`libs/modules/${plan.names.kebab}/`.length))
        : join(workspaceRoot, path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, content, { encoding: 'utf8', flag: 'wx' });
      if (!path.startsWith(`libs/modules/${plan.names.kebab}/`)) createdExternalPaths.push(target);
    }
    await rename(tempRoot, moduleRoot);
    for (const [key, path] of Object.entries(centralPaths)) {
      await writeFile(path, updates[key], 'utf8');
    }
  } catch (error) {
    await rm(tempRoot, { recursive: true, force: true });
    await rm(moduleRoot, { recursive: true, force: true });
    for (const path of createdExternalPaths) await rm(path, { force: true });
    for (const [key, path] of Object.entries(centralPaths)) {
      await writeFile(path, originals[key], 'utf8');
    }
    throw error;
  }
  return { created: [...plan.files.keys()], updated: Object.values(centralPaths) };
}

function parseArguments(argv) {
  const dryRun = argv.includes('--dry-run');
  const name = argv.find((argument) => !argument.startsWith('--'));
  if (!name) throw new Error('Usage: pnpm module:new <kebab-case-name> [--dry-run]');
  return { dryRun, name };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { dryRun, name } = parseArguments(process.argv.slice(2));
    const result = await createModule(name, { dryRun });
    console.log(`${dryRun ? 'Would create' : 'Created'} ${result.created.length} files.`);
    console.log(
      `${dryRun ? 'Would update' : 'Updated'} ${result.updated.length} composition files.`,
    );
    console.log(
      'Next: pnpm install --frozen-lockfile=false && pnpm format:write && pnpm lint && pnpm typecheck && pnpm test',
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
