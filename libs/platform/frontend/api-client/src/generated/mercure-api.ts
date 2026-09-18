// This file is generated from the Mercure NestJS OpenAPI contract. Do not edit manually.

export interface paths {
  '/api/v1/health/live': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Process liveness probe */
    get: operations['HealthController_live'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/health/ready': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Service readiness probe */
    get: operations['HealthController_ready'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/rules/snapshots/import': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Import and persist the configured Rules manager snapshot */
    post: operations['RulesSnapshotsController_importSnapshot'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/rules/snapshots': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List immutable Rules snapshots */
    get: operations['RulesSnapshotsController_listSnapshots'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/rules/snapshots/{snapshotId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get one immutable Rules snapshot */
    get: operations['RulesSnapshotsController_getSnapshot'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/rules/snapshots/{snapshotId}/rules': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List normalized rules in a snapshot */
    get: operations['RulesSnapshotsController_listRules'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/rules/snapshots/{snapshotId}/decoders': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List normalized decoders in a snapshot */
    get: operations['RulesSnapshotsController_listDecoders'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/rules/snapshots/{snapshotId}/issues': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List validation issues in a snapshot */
    get: operations['RulesSnapshotsController_listIssues'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    LivenessResponseDocument: {
      /** @enum {string} */
      status: 'up';
    };
    ReadinessResponseDocument: {
      /** @enum {string} */
      status: 'ready';
      checks: {
        [key: string]: 'up';
      };
    };
    RulesSnapshotParamsDto: {
      /** Format: uuid */
      snapshotId: string;
    };
    RulesSnapshotListQueryDto: {
      /** @default 0 */
      offset: number;
      /** @default 50 */
      limit: number;
    };
    RulesSnapshotRulesQueryDto: {
      /** @default 0 */
      offset: number;
      /** @default 50 */
      limit: number;
      tenant?: string;
      /** @enum {string} */
      severity?: 'informational' | 'low' | 'medium' | 'high' | 'critical';
      status?: string;
      useCaseId?: string;
      ruleId?: string;
      /** @enum {string} */
      jiraVisible?: 'true' | 'false';
    };
    RulesSnapshotDecodersQueryDto: {
      /** @default 0 */
      offset: number;
      /** @default 50 */
      limit: number;
      tenant?: string;
      name?: string;
    };
    RulesSnapshotIssuesQueryDto: {
      /** @default 0 */
      offset: number;
      /** @default 50 */
      limit: number;
      /** @enum {string} */
      severity?: 'error' | 'warning' | 'info';
      type?: string;
    };
    RulesSnapshotDocument: {
      /** Format: uuid */
      id: string;
      sourceFingerprint: string;
      contentFingerprint: string;
      loadedAt: string;
      createdAt: string;
      complete: boolean;
      sourceErrorCount: number;
      archiveCount: number;
      fileCount: number;
      ruleCount: number;
      decoderCount: number;
      useCaseCount: number;
      jiraVisibleCount: number;
      testingCount: number;
      productionCount: number;
      criticalCount: number;
      mitreMappedCount: number;
      missingUseCaseCount: number;
      brokenDependencyCount: number;
    };
    RulesSnapshotPageDocument: {
      offset: number;
      limit: number;
      total: number;
      items: {
        /** Format: uuid */
        id: string;
        sourceFingerprint: string;
        contentFingerprint: string;
        loadedAt: string;
        createdAt: string;
        complete: boolean;
        sourceErrorCount: number;
        archiveCount: number;
        fileCount: number;
        ruleCount: number;
        decoderCount: number;
        useCaseCount: number;
        jiraVisibleCount: number;
        testingCount: number;
        productionCount: number;
        criticalCount: number;
        mitreMappedCount: number;
        missingUseCaseCount: number;
        brokenDependencyCount: number;
      }[];
    };
    RulesSnapshotRulePageDocument: {
      offset: number;
      limit: number;
      total: number;
      items: {
        id: string;
        level: number;
        description: string;
        groups: string[];
        status: string;
        role: string;
        /** @enum {string} */
        severity: 'informational' | 'low' | 'medium' | 'high' | 'critical';
        jiraVisible: boolean;
        tenant: string;
        sourceFile: string;
        sourceSection?: string;
        useCaseId: string;
        /** @enum {string} */
        useCaseConfidence: 'confirmed' | 'inferred' | 'unassigned';
        mitre: string[];
        dependencies: {
          /** @enum {string} */
          type: 'if_sid' | 'if_group' | 'if_matched_sid' | 'if_matched_group' | 'decoded_as';
          value: string;
        }[];
        fields: {
          name: string;
          type?: string;
          value: string;
        }[];
        frequency?: string;
        timeframe?: string;
        decodedAs: string[];
        options: string[];
      }[];
    };
    RulesSnapshotDecoderPageDocument: {
      offset: number;
      limit: number;
      total: number;
      items: {
        name: string;
        parent?: string;
        prematch: string[];
        regex: string[];
        orderFields: string[];
        tenant: string;
        sourceFile: string;
      }[];
    };
    RulesSnapshotIssuePageDocument: {
      offset: number;
      limit: number;
      total: number;
      items: {
        /** @enum {string} */
        severity: 'error' | 'warning' | 'info';
        type: string;
        title: string;
        detail: string;
        ruleId?: string;
        decoderName?: string;
        fileName?: string;
        tenant?: string;
      }[];
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  HealthController_live: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['LivenessResponseDocument'];
        };
      };
    };
  };
  HealthController_ready: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ReadinessResponseDocument'];
        };
      };
      /** @description One or more readiness dependencies are unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  RulesSnapshotsController_importSnapshot: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['RulesSnapshotDocument'];
        };
      };
      /** @description No usable Rules source files are currently available to import. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  RulesSnapshotsController_listSnapshots: {
    parameters: {
      query?: {
        offset?: number;
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['RulesSnapshotPageDocument'];
        };
      };
    };
  };
  RulesSnapshotsController_getSnapshot: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        snapshotId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['RulesSnapshotDocument'];
        };
      };
      /** @description Rules snapshot not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  RulesSnapshotsController_listRules: {
    parameters: {
      query?: {
        offset?: number;
        limit?: number;
        tenant?: string;
        severity?: 'informational' | 'low' | 'medium' | 'high' | 'critical';
        status?: string;
        useCaseId?: string;
        ruleId?: string;
        jiraVisible?: 'true' | 'false';
      };
      header?: never;
      path: {
        snapshotId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['RulesSnapshotRulePageDocument'];
        };
      };
      /** @description Rules snapshot not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  RulesSnapshotsController_listDecoders: {
    parameters: {
      query?: {
        offset?: number;
        limit?: number;
        tenant?: string;
        name?: string;
      };
      header?: never;
      path: {
        snapshotId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['RulesSnapshotDecoderPageDocument'];
        };
      };
      /** @description Rules snapshot not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  RulesSnapshotsController_listIssues: {
    parameters: {
      query?: {
        offset?: number;
        limit?: number;
        severity?: 'error' | 'warning' | 'info';
        type?: string;
      };
      header?: never;
      path: {
        snapshotId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['RulesSnapshotIssuePageDocument'];
        };
      };
      /** @description Rules snapshot not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
}
