import { createZodValidationPipe } from 'nestjs-zod';

export const StrictZodValidationPipe = createZodValidationPipe({
  strictSchemaDeclaration: true,
});
