import { describe, expect, it } from 'vitest';

import {
  parseCreateRulesUseCaseForm,
  parseUpdateRulesUseCaseForm,
  validateDeleteConfirmation,
} from './rules-use-case-administration-form';

function validForm(): FormData {
  const form = new FormData();
  form.set('id', 'uc_admin_config');
  form.set('name', 'Administrator configuration change');
  form.set('shortName', 'Admin config');
  form.set('description', 'Tracks privileged configuration changes.');
  form.set('component', 'firewall');
  form.set('vendor', 'Fortinet');
  form.set('product', 'FortiGate');
  form.set('domain', 'network');
  form.set('category', 'configuration');
  return form;
}

describe('Rules use-case administration form validation', () => {
  it('parses valid create input without server-owned fields', () => {
    const result = parseCreateRulesUseCaseForm(validForm());

    expect(result).toMatchObject({
      ok: true,
      value: {
        id: 'uc_admin_config',
        name: 'Administrator configuration change',
      },
    });
    expect(JSON.stringify(result)).not.toContain('createdBy');
    expect(JSON.stringify(result)).not.toContain('source');
  });

  it('returns field-specific validation errors', () => {
    const form = validForm();
    form.set('id', 'UC_ADMIN_CONFIG');

    expect(parseCreateRulesUseCaseForm(form)).toEqual({
      ok: false,
      error: {
        field: 'id',
        message: 'Use-case ID must start with uc_ and use lowercase letters, digits, or underscores.',
      },
    });

    form.set('id', 'uc_admin_config');
    form.set('description', '   ');

    expect(parseUpdateRulesUseCaseForm(form)).toMatchObject({
      ok: false,
      error: {
        field: 'description',
      },
    });
  });

  it('requires exact destructive confirmation', () => {
    const form = new FormData();
    form.set('confirmation', 'uc_other');

    expect(validateDeleteConfirmation(form, 'uc_admin_config')).toMatchObject({
      field: 'confirmation',
    });

    form.set('confirmation', 'uc_admin_config');
    expect(validateDeleteConfirmation(form, 'uc_admin_config')).toBeNull();
  });
});
