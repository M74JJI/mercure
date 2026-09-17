import json
from pathlib import Path

config = Path('libs/platform/backend/config/src/lib/platform-config.module.ts')
text = config.read_text(encoding='utf-8')
text = text.replace(
    "import { ConfigModule, ConfigService } from '@nestjs/config';",
    "import { ConfigModule, type ConfigService } from '@nestjs/config';",
)
config.write_text(text, encoding='utf-8')

problem = Path('libs/platform/backend/presentation/src/lib/problem-details.filter.ts')
text = problem.read_text(encoding='utf-8')
text = text.replace(
    "import {\n  ArgumentsHost,\n  Catch,\n  ExceptionFilter,\n  HttpException,",
    "import {\n  Catch,\n  HttpException,",
)
text = text.replace(
    "} from '@nestjs/common';\n",
    "} from '@nestjs/common';\nimport type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';\n",
    1,
)
text = text.replace(
    "import { ZodValidationException } from 'nestjs-zod';",
    "import { ZodValidationException } from 'nestjs-zod';\nimport { ZodError } from 'zod';",
)
text = text.replace(
    "const details = exception.getZodError().issues.map((issue) => ({\n        path: issue.path.map(String).join('.'),\n        code: issue.code,\n        message: issue.message,\n      }));",
    "const zodError = exception.getZodError();\n      const details =\n        zodError instanceof ZodError\n          ? zodError.issues.map((issue) => ({\n              path: issue.path.map(String).join('.'),\n              code: issue.code,\n              message: issue.message,\n            }))\n          : [];",
)
problem.write_text(text, encoding='utf-8')

http = Path('libs/platform/backend/http/src/lib/api-http.ts')
text = http.read_text(encoding='utf-8')
old = (
    "  await app.register(helmet, {\n"
    "    strictTransportSecurity: config.nodeEnvironment === 'production' ? undefined : false,\n"
    "    contentSecurityPolicy: config.openApiEnabled\n"
    "      ? {\n"
    "          directives: {\n"
    "            defaultSrc: [\"'self'\"],\n"
    "            styleSrc: [\"'self'\", \"'unsafe-inline'\"],\n"
    "            scriptSrc: [\"'self'\", \"'unsafe-inline'\"],\n"
    "            imgSrc: [\"'self'\", 'data:'],\n"
    "          },\n"
    "        }\n"
    "      : undefined,\n"
    "  });"
)
new = (
    "  const transportSecurity =\n"
    "    config.nodeEnvironment === 'production' ? {} : { strictTransportSecurity: false };\n\n"
    "  if (config.openApiEnabled) {\n"
    "    await app.register(helmet, {\n"
    "      ...transportSecurity,\n"
    "      contentSecurityPolicy: {\n"
    "        directives: {\n"
    "          defaultSrc: [\"'self'\"],\n"
    "          styleSrc: [\"'self'\", \"'unsafe-inline'\"],\n"
    "          scriptSrc: [\"'self'\", \"'unsafe-inline'\"],\n"
    "          imgSrc: [\"'self'\", 'data:'],\n"
    "        },\n"
    "      },\n"
    "    });\n"
    "  } else {\n"
    "    await app.register(helmet, transportSecurity);\n"
    "  }"
)
if old not in text:
    raise SystemExit('Expected Helmet block was not found.')
http.write_text(text.replace(old, new), encoding='utf-8')

for manifest_path in [
    'libs/platform/backend/http/package.json',
    'libs/platform/backend/presentation/package.json',
]:
    manifest = Path(manifest_path)
    data = json.loads(manifest.read_text(encoding='utf-8'))
    if 'fastify' in data.get('dependencies', {}):
        data['dependencies']['fastify'] = '5.12.5'
    if manifest_path.endswith('/presentation/package.json'):
        data['dependencies']['zod'] = '4.5.4'
    manifest.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')

webpack = Path('apps/api/webpack.config.cjs')
text = webpack.read_text(encoding='utf-8')
text = text.replace(
    "const { join } = require('node:path');\nconst { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');",
    "// CommonJS is required by the isolated Nx Webpack configuration loader.\n"
    "// eslint-disable-next-line @typescript-eslint/no-require-imports\n"
    "const { join } = require('node:path');\n"
    "// eslint-disable-next-line @typescript-eslint/no-require-imports\n"
    "const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');",
)
webpack.write_text(text, encoding='utf-8')
