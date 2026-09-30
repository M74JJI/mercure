import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { buildModulePlan, createModule } from './create-module.mjs';

test('creates complete module plan with enforced Nx tags', () => {
  const plan = buildModulePlan('client-inventory');
  assert.equal(plan.names.pascal, 'ClientInventory');
  assert.equal(plan.files.size, 42);
  assert.match(
    plan.files.get('libs/modules/client-inventory/backend/domain/project.json'),
    /"scope:client-inventory"/,
  );
  assert.match(
    plan.files.get('libs/modules/client-inventory/frontend/feature/project.json'),
    /"type:feature"/,
  );
  assert.ok(plan.files.has('apps/web/src/app/(platform)/client-inventory/page.tsx'));
});

test('rejects unsafe or ambiguous module names', () => {
  for (const name of ['Client Inventory', '../escape', 'rules_', '9module']) {
    assert.throws(() => buildModulePlan(name), /kebab-case/);
  }
});

test('writes module and updates composition files atomically', async () => {
  const root = await mkdtemp(join(tmpdir(), 'mercure-module-generator-'));
  const fixtures = {
    'apps/api/src/app/app.module.ts':
      "import { Module } from '@nestjs/common';\n// module-generator:imports\n@Module({ imports: [\n    // module-generator:modules\n] })\nexport class AppModule {}\n",
    'apps/api/package.json': '{"name":"@mercure/api","dependencies":{}}\n',
    'apps/web/package.json': '{"name":"@mercure/web","dependencies":{}}\n',
    'libs/platform/frontend/navigation/src/lib/navigation.ts':
      'export const platformNavigation = [\n  // module-generator:navigation\n];\n',
  };

  try {
    for (const [path, content] of Object.entries(fixtures)) {
      const target = join(root, path);
      await mkdir(join(target, '..'), { recursive: true });
      await writeFile(target, content, 'utf8');
    }

    await createModule('client-inventory', { workspaceRoot: root });

    const apiModule = await readFile(join(root, 'apps/api/src/app/app.module.ts'), 'utf8');
    const navigation = await readFile(
      join(root, 'libs/platform/frontend/navigation/src/lib/navigation.ts'),
      'utf8',
    );
    assert.match(apiModule, /ClientInventoryBackendModule/);
    assert.match(navigation, /href: '\/client-inventory'/);
    assert.match(
      await readFile(
        join(root, 'libs/modules/client-inventory/backend/domain/project.json'),
        'utf8',
      ),
      /scope:client-inventory/,
    );
    await assert.rejects(
      createModule('client-inventory', { workspaceRoot: root }),
      /Module already exists/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
