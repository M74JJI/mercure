import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const useCaseIdSchema = z
  .string()
  .trim()
  .regex(/^uc_[a-z0-9_]+$/)
  .max(255);

const editableFields = {
  name: z.string().trim().min(1).max(255),
  shortName: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(4_096),
  component: z.string().trim().min(1).max(255),
  vendor: z.string().trim().min(1).max(255),
  product: z.string().trim().min(1).max(255),
  domain: z.string().trim().min(1).max(255),
  category: z.string().trim().min(1).max(255),
};

export class RulesUseCaseCreateDto extends createZodDto(
  z
    .object({
      id: useCaseIdSchema,
      ...editableFields,
    })
    .strict(),
) {}

export class RulesUseCaseUpdateDto extends createZodDto(z.object(editableFields).strict()) {}

export class RulesUseCaseAdministrationParamsDto extends createZodDto(
  z
    .object({
      useCaseId: useCaseIdSchema,
    })
    .strict(),
) {}
