import ts from 'typescript';
import type { Plugin } from 'vite';

const BACKEND_TYPESCRIPT = /(?:^|[\\/])(?:apps[\\/]api|libs[\\/].+[\\/]backend)[\\/].+\.ts$/;

export function legacyDecoratorsPlugin(): Plugin {
  return {
    name: 'mercure-legacy-typescript-decorators',
    enforce: 'pre',
    transform(code, id) {
      const fileName = id.split('?')[0];
      if (!fileName || !BACKEND_TYPESCRIPT.test(fileName) || !code.includes('@')) {
        return null;
      }

      const result = ts.transpileModule(code, {
        fileName,
        compilerOptions: {
          emitDecoratorMetadata: true,
          experimentalDecorators: true,
          module: ts.ModuleKind.ESNext,
          sourceMap: true,
          target: ts.ScriptTarget.ES2023,
          useDefineForClassFields: false,
        },
      });

      return {
        code: result.outputText,
        map: result.sourceMapText ? JSON.parse(result.sourceMapText) : null,
      };
    },
  };
}
