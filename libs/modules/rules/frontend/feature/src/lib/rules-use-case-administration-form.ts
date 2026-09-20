import type {
  RulesUseCaseCreateInput,
  RulesUseCaseUpdateInput,
} from '@mercure/rules-frontend-data-access';

export type RulesUseCaseFormField =
  | 'id'
  | 'name'
  | 'shortName'
  | 'description'
  | 'component'
  | 'vendor'
  | 'product'
  | 'domain'
  | 'category'
  | 'confirmation';

export interface RulesUseCaseFormError {
  readonly field: RulesUseCaseFormField;
  readonly message: string;
}

export type RulesUseCaseFormResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: RulesUseCaseFormError };

const limits = {
  id: 255,
  name: 255,
  shortName: 120,
  description: 4_096,
  component: 255,
  vendor: 255,
  product: 255,
  domain: 255,
  category: 255,
} as const;

function text(
  formData: FormData,
  field: Exclude<RulesUseCaseFormField, 'confirmation'>,
): RulesUseCaseFormResult<string> {
  const raw = formData.get(field);
  if (typeof raw !== 'string') {
    return {
      ok: false,
      error: { field, message: 'This field is required.' },
    };
  }

  const value = raw.trim();
  if (!value) {
    return {
      ok: false,
      error: { field, message: 'This field is required.' },
    };
  }

  if (value.length > limits[field]) {
    return {
      ok: false,
      error: {
        field,
        message: 'This field exceeds the maximum allowed length.',
      },
    };
  }

  return { ok: true, value };
}

function editableFields(formData: FormData): RulesUseCaseFormResult<RulesUseCaseUpdateInput> {
  const name = text(formData, 'name');
  if (!name.ok) return name;
  const shortName = text(formData, 'shortName');
  if (!shortName.ok) return shortName;
  const description = text(formData, 'description');
  if (!description.ok) return description;
  const component = text(formData, 'component');
  if (!component.ok) return component;
  const vendor = text(formData, 'vendor');
  if (!vendor.ok) return vendor;
  const product = text(formData, 'product');
  if (!product.ok) return product;
  const domain = text(formData, 'domain');
  if (!domain.ok) return domain;
  const category = text(formData, 'category');
  if (!category.ok) return category;

  return {
    ok: true,
    value: {
      name: name.value,
      shortName: shortName.value,
      description: description.value,
      component: component.value,
      vendor: vendor.value,
      product: product.value,
      domain: domain.value,
      category: category.value,
    },
  };
}

export function parseCreateRulesUseCaseForm(
  formData: FormData,
): RulesUseCaseFormResult<RulesUseCaseCreateInput> {
  const id = text(formData, 'id');
  if (!id.ok) return id;

  if (!/^uc_[a-z0-9_]+$/.test(id.value)) {
    return {
      ok: false,
      error: {
        field: 'id',
        message:
          'Use-case ID must start with uc_ and use lowercase letters, digits, or underscores.',
      },
    };
  }

  const editable = editableFields(formData);
  if (!editable.ok) return editable;

  return {
    ok: true,
    value: {
      id: id.value,
      ...editable.value,
    },
  };
}

export function parseUpdateRulesUseCaseForm(
  formData: FormData,
): RulesUseCaseFormResult<RulesUseCaseUpdateInput> {
  return editableFields(formData);
}

export function parseUseCaseId(formData: FormData): RulesUseCaseFormResult<string> {
  const id = text(formData, 'id');
  if (!id.ok) return id;

  if (!/^uc_[a-z0-9_]+$/.test(id.value)) {
    return {
      ok: false,
      error: {
        field: 'id',
        message: 'Use-case ID is invalid.',
      },
    };
  }

  return id;
}

export function validateDeleteConfirmation(
  formData: FormData,
  useCaseId: string,
): RulesUseCaseFormError | null {
  const raw = formData.get('confirmation');
  const confirmation = typeof raw === 'string' ? raw.trim() : '';

  if (confirmation !== useCaseId) {
    return {
      field: 'confirmation',
      message: 'Type the exact use-case ID to confirm deletion.',
    };
  }

  return null;
}
