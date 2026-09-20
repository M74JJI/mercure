import { describe, expect, it } from 'vitest';

import { safeErrorTrace } from './problem-details.filter';

describe('ProblemDetailsFilter error logging', () => {
  it('keeps stack frames without logging exception-message content', () => {
    const secretXml = '<rule id="999999"><description>sensitive customer XML</description></rule>';
    const error = new Error(secretXml);
    error.stack = [
      'Error: ' + secretXml,
      '    at ValidateRulesAuthoringDraft.execute (/app/rules-authoring.ts:250:12)',
      '    at async RulesAuthoringController.validate (/app/rules-authoring.controller.ts:220:5)',
    ].join('\n');

    const trace = safeErrorTrace(error);

    expect(trace).toContain('ValidateRulesAuthoringDraft.execute');
    expect(trace).toContain('RulesAuthoringController.validate');
    expect(trace).not.toContain('sensitive customer XML');
    expect(trace).not.toContain('<rule');
  });

  it('returns undefined when no call frames are available', () => {
    const error = new Error('sensitive detail');
    error.stack = 'Error: sensitive detail';

    expect(safeErrorTrace(error)).toBeUndefined();
  });
});
