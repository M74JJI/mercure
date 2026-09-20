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
  '/api/v1/rules/snapshots/{snapshotId}/rules/{position}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get one normalized rule record from a snapshot */
    get: operations['RulesSnapshotsController_getRule'];
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
  '/api/v1/rules/snapshots/{snapshotId}/decoders/{position}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get one normalized decoder record from a snapshot */
    get: operations['RulesSnapshotsController_getDecoder'];
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
  '/api/v1/rules/snapshots/{snapshotId}/issues/{position}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get one validation finding from a snapshot */
    get: operations['RulesSnapshotsController_getIssue'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/rules/authoring/drafts': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List Rules authoring drafts */
    get: operations['RulesAuthoringController_list'];
    put?: never;
    /** Create a Rules authoring draft from an immutable snapshot file */
    post: operations['RulesAuthoringController_create'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/rules/authoring/drafts/new': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Create a new bounded logical Rules XML draft */
    post: operations['RulesAuthoringController_createNew'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/rules/authoring/drafts/{draftId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get one Rules authoring draft */
    get: operations['RulesAuthoringController_get'];
    /** Update Rules authoring draft XML using optimistic concurrency */
    put: operations['RulesAuthoringController_update'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/rules/authoring/drafts/{draftId}/validate': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Validate the exact current Rules authoring draft revision */
    post: operations['RulesAuthoringController_validate'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/rules/authoring/drafts/{draftId}/approve': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Approve an error-free validated Rules authoring draft revision */
    post: operations['RulesAuthoringController_approve'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/rules/authoring/drafts/{draftId}/export': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Export the unchanged approved Rules authoring draft revision */
    get: operations['RulesAuthoringController_export'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/rules/intelligence/snapshots/{snapshotId}/fields': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Read bounded field intelligence for a Rules snapshot */
    get: operations['RulesIntelligenceController_fieldsForSnapshot'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/rules/intelligence/snapshots/{snapshotId}/quality': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Read bounded quality scoring for a Rules snapshot */
    get: operations['RulesIntelligenceController_qualityForSnapshot'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/rules/intelligence/snapshots/{snapshotId}/graph': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Read a bounded semantic graph for a Rules snapshot */
    get: operations['RulesIntelligenceController_graphForSnapshot'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/rules/intelligence/snapshots/{snapshotId}/roundtrip': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Read safe XML round-trip diagnostics for a Rules snapshot */
    get: operations['RulesIntelligenceController_roundtripForSnapshot'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/rules/intelligence/compare': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Compare two immutable Rules snapshots with bounded detail output */
    get: operations['RulesIntelligenceController_compareSnapshots'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/rules/use-cases': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List the canonical Rules use-case catalog */
    get: operations['RulesUseCasesController_list'];
    put?: never;
    /** Create a custom Rules use case */
    post: operations['RulesUseCaseAdministrationController_create'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/rules/use-cases/{useCaseId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Read one canonical Rules use case */
    get: operations['RulesUseCasesController_get'];
    /** Update a custom Rules use case */
    put: operations['RulesUseCaseAdministrationController_update'];
    post?: never;
    /** Delete a custom Rules use case */
    delete: operations['RulesUseCaseAdministrationController_delete'];
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
    RulesSnapshotRecordParamsDto: {
      /** Format: uuid */
      snapshotId: string;
      position: number;
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
        position: number;
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
        sourceFilePosition: number;
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
    RulesSnapshotRuleDocument: {
      position: number;
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
      sourceFilePosition: number;
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
    };
    RulesSnapshotDecoderPageDocument: {
      offset: number;
      limit: number;
      total: number;
      items: {
        position: number;
        name: string;
        parent?: string;
        prematch: string[];
        regex: string[];
        orderFields: string[];
        tenant: string;
        sourceFile: string;
        sourceFilePosition: number;
      }[];
    };
    RulesSnapshotDecoderDocument: {
      position: number;
      name: string;
      parent?: string;
      prematch: string[];
      regex: string[];
      orderFields: string[];
      tenant: string;
      sourceFile: string;
      sourceFilePosition: number;
    };
    RulesSnapshotIssuePageDocument: {
      offset: number;
      limit: number;
      total: number;
      items: {
        position: number;
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
    RulesSnapshotIssueDocument: {
      position: number;
      /** @enum {string} */
      severity: 'error' | 'warning' | 'info';
      type: string;
      title: string;
      detail: string;
      ruleId?: string;
      decoderName?: string;
      fileName?: string;
      tenant?: string;
    };
    RulesAuthoringDraftParamsDto: {
      /** Format: uuid */
      draftId: string;
    };
    RulesAuthoringDraftListQueryDto: {
      /** @default 0 */
      offset: number;
      /** @default 25 */
      limit: number;
    };
    RulesAuthoringDraftCreateDto: {
      /** Format: uuid */
      sourceSnapshotId: string;
      sourceFilePosition: number;
    };
    RulesAuthoringDraftCreateNewDto: {
      fileName: string;
      tenant: string;
      /** @enum {string} */
      sourceType: 'rules' | 'decoders';
    };
    RulesAuthoringDraftUpdateDto: {
      expectedRevision: number;
      content: string;
    };
    RulesAuthoringDraftTransitionDto: {
      expectedRevision: number;
    };
    RulesAuthoringDraftListDocument: {
      offset: number;
      limit: number;
      total: number;
      items: {
        /** Format: uuid */
        id: string;
        /** Format: uuid */
        sourceSnapshotId?: string;
        sourceFilePosition?: number;
        fileName: string;
        tenant: string;
        /** @enum {string} */
        sourceType: 'rules' | 'decoders';
        sha256: string;
        revision: number;
        /** @enum {string} */
        state: 'draft' | 'validated' | 'approved';
        createdBy: string;
        updatedBy: string;
        createdAt: string;
        updatedAt: string;
        approvedRevision?: number;
        approvedSha256?: string;
        approvedBy?: string;
        approvedAt?: string;
        validation?: {
          revision: number;
          sha256: string;
          ruleCount: number;
          decoderCount: number;
          issueCount: number;
          errorCount: number;
          warningCount: number;
          infoCount: number;
          validatedAt: string;
        };
      }[];
    };
    RulesAuthoringDraftDocument: {
      /** Format: uuid */
      id: string;
      /** Format: uuid */
      sourceSnapshotId?: string;
      sourceFilePosition?: number;
      fileName: string;
      tenant: string;
      /** @enum {string} */
      sourceType: 'rules' | 'decoders';
      sha256: string;
      revision: number;
      /** @enum {string} */
      state: 'draft' | 'validated' | 'approved';
      createdBy: string;
      updatedBy: string;
      createdAt: string;
      updatedAt: string;
      approvedRevision?: number;
      approvedSha256?: string;
      approvedBy?: string;
      approvedAt?: string;
      content: string;
      eventCount: number;
      events: {
        /** @enum {string} */
        eventType: 'create' | 'edit' | 'validate' | 'approve';
        /** @enum {string} */
        state: 'draft' | 'validated' | 'approved';
        revision: number;
        actorSubject: string;
        createdAt: string;
      }[];
      validation?: {
        revision: number;
        sha256: string;
        ruleCount: number;
        decoderCount: number;
        issueCount: number;
        errorCount: number;
        warningCount: number;
        infoCount: number;
        validatedAt: string;
        issues: {
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
    RulesAuthoringExportDocument: {
      /** Format: uuid */
      draftId: string;
      revision: number;
      fileName: string;
      /** @enum {string} */
      sourceType: 'rules' | 'decoders';
      sha256: string;
      content: string;
    };
    RulesIntelligenceSnapshotParamsDto: {
      /** Format: uuid */
      snapshotId: string;
    };
    RulesFieldIntelligenceQueryDto: {
      /** @default 0 */
      offset: number;
      /** @default 50 */
      limit: number;
      tenant?: string;
      /** @enum {string} */
      health?: 'healthy' | 'underused' | 'unknown_source' | 'alias_candidate' | 'orphaned';
      /** @enum {string} */
      criticality?: 'critical' | 'high' | 'medium' | 'low';
      family?: string;
      query?: string;
    };
    RulesQualityQueryDto: {
      /** @default 0 */
      offset: number;
      /** @default 50 */
      limit: number;
      /**
       * @default rules
       * @enum {string}
       */
      kind: 'rules' | 'use_cases';
      tenant?: string;
      /** @enum {string} */
      grade?: 'excellent' | 'good' | 'needs_review' | 'risky' | 'broken';
      useCaseId?: string;
      query?: string;
    };
    RulesGraphQueryDto: {
      /**
       * @default all
       * @enum {string}
       */
      mode: 'rules' | 'decoders' | 'decoder_rules' | 'use_cases' | 'mitre' | 'fields' | 'all';
      query?: string;
      tenant?: string;
      useCaseId?: string;
      status?: string;
      role?: string;
      /** @enum {string} */
      jiraOnly?: 'true' | 'false';
      /** @enum {string} */
      includeExternal?: 'true' | 'false';
      /** @default 200 */
      limit: number;
    };
    RulesSnapshotCompareQueryDto: {
      /** Format: uuid */
      beforeSnapshotId: string;
      /** Format: uuid */
      afterSnapshotId: string;
      /**
       * @default rules
       * @enum {string}
       */
      kind: 'rules' | 'decoders' | 'files' | 'use_cases' | 'issues';
      /** @default 0 */
      offset: number;
      /** @default 50 */
      limit: number;
    };
    RulesRoundtripQueryDto: {
      /** @default 0 */
      offset: number;
      /** @default 50 */
      limit: number;
    };
    RulesFieldIntelligenceDocument: {
      /** Format: uuid */
      snapshotId: string;
      stats: {
        totalFields: number;
        producedFields: number;
        usedFields: number;
        unknownSourceFields: number;
        orphanedProducedFields: number;
        aliasCandidates: number;
        criticalFields: number;
        averageRisk: number;
      };
      page: {
        offset: number;
        limit: number;
        total: number;
        items: {
          key: string;
          tenant: string;
          field: string;
          canonical: string;
          family: string;
          description: string;
          aliases: string[];
          producedBy: {
            tenant: string;
            id: string;
          }[];
          producedByTotal: number;
          usedByRules: {
            tenant: string;
            id: string;
            level: number;
            /** @enum {string} */
            severity: 'informational' | 'low' | 'medium' | 'high' | 'critical';
            jiraVisible: boolean;
          }[];
          usedByRulesTotal: number;
          usedByUseCases: string[];
          usedByUseCasesTotal: number;
          jiraVisibleRules: number;
          criticalRules: number;
          decodedAsRules: string[];
          decodedAsRulesTotal: number;
          /** @enum {string} */
          health: 'healthy' | 'underused' | 'unknown_source' | 'alias_candidate' | 'orphaned';
          /** @enum {string} */
          criticality: 'critical' | 'high' | 'medium' | 'low';
          riskScore: number;
          aliasHints: {
            field: string;
            alias: string;
            reason: string;
          }[];
          aliasHintsTotal: number;
        }[];
      };
    };
    RulesQualityDocument: {
      /** Format: uuid */
      snapshotId: string;
      /** @enum {string} */
      kind: 'rules' | 'use_cases';
      stats: {
        averageOverall: number;
        excellent: number;
        good: number;
        needsReview: number;
        risky: number;
        broken: number;
        jiraReady: number;
        noisyCandidates: number;
        weakDecoderConfidence: number;
        weakMitreQuality: number;
      };
      rules?: {
        offset: number;
        limit: number;
        total: number;
        items: {
          key: string;
          tenant: string;
          ruleId: string;
          description: string;
          useCaseId: string;
          level: number;
          role: string;
          status: string;
          jiraVisible: boolean;
          overall: number;
          /** @enum {string} */
          grade: 'excellent' | 'good' | 'needs_review' | 'risky' | 'broken';
          dimensions: {
            quality: number;
            noiseControl: number;
            decoderConfidence: number;
            dependencyHealth: number;
            mitreQuality: number;
            jiraReadiness: number;
            qaReadiness: number;
            clientReadiness: number;
          };
          strengths: string[];
          warnings: string[];
          recommendations: string[];
        }[];
      };
      useCases?: {
        offset: number;
        limit: number;
        total: number;
        items: {
          key: string;
          tenant: string;
          useCaseId: string;
          rules: number;
          jiraVisible: number;
          average: number;
          /** @enum {string} */
          grade: 'excellent' | 'good' | 'needs_review' | 'risky' | 'broken';
          weakSignals: string[];
        }[];
      };
    };
    RulesGraphDocument: {
      /** Format: uuid */
      snapshotId: string;
      graph: {
        nodes: {
          id: string;
          /** @enum {string} */
          type: 'rule' | 'decoder' | 'use_case' | 'mitre' | 'field' | 'group' | 'external';
          label: string;
          weight: number;
          tenant?: string;
          entityId?: string;
          meta?: {
            [key: string]: string | number | boolean;
          };
        }[];
        edges: {
          id: string;
          source: string;
          target: string;
          /** @enum {string} */
          type:
            | 'if_sid'
            | 'if_group'
            | 'if_matched_sid'
            | 'if_matched_group'
            | 'decoded_as'
            | 'decoder_parent'
            | 'group_produces'
            | 'field_produces'
            | 'field_uses'
            | 'use_case'
            | 'mitre';
          label: string;
          weight: number;
        }[];
        stats: {
          nodes: number;
          edges: number;
          rules: number;
          decoders: number;
          fields: number;
          groups: number;
          useCases: number;
          mitre: number;
          external: number;
        };
      };
    };
    RulesRoundtripDocument: {
      /** Format: uuid */
      snapshotId: string;
      summary: {
        sourceSections: number;
        combinedFiles: number;
        commentedRules: number;
        idRangeWarnings: number;
        orphanGroups: number;
        missingGroupProducers: number;
        missingUseCaseSuggestions: number;
      };
      sourceSections: {
        offset: number;
        limit: number;
        total: number;
        items: {
          key: string;
          tenant: string;
          sourceFile: string;
          hostFile: string;
          ruleCount: number;
          minRuleId?: number;
          maxRuleId?: number;
          expectedPrefix?: string;
          /** @enum {string} */
          idRangeStatus: 'pass' | 'warning' | 'unknown';
          statusSummary: string;
        }[];
      };
      commentedRules: {
        offset: number;
        limit: number;
        total: number;
        items: {
          tenant: string;
          fileName: string;
          ruleId: string;
          level?: string;
          description?: string;
        }[];
      };
      groupFlows: {
        offset: number;
        limit: number;
        total: number;
        items: {
          tenant: string;
          group: string;
          producedByRules: string[];
          consumedByRules: string[];
          /** @enum {string} */
          status: 'active' | 'orphan_producer' | 'missing_producer';
        }[];
      };
      missingUseCaseSuggestions: {
        offset: number;
        limit: number;
        total: number;
        items: {
          tenant: string;
          ruleId: string;
          sourceFile: string;
          sourceSection?: string;
          useCaseId: string;
          /** @enum {string} */
          confidence: 'confirmed' | 'inferred' | 'unassigned';
          placement: string;
        }[];
      };
    };
    RulesSnapshotCompareDocument: {
      /** Format: uuid */
      beforeSnapshotId: string;
      /** Format: uuid */
      afterSnapshotId: string;
      /** @enum {string} */
      kind: 'rules' | 'decoders' | 'files' | 'use_cases' | 'issues';
      summary: {
        rulesAdded: number;
        rulesRemoved: number;
        rulesChanged: number;
        decodersAdded: number;
        decodersRemoved: number;
        decodersChanged: number;
        filesAdded: number;
        filesRemoved: number;
        filesChanged: number;
        useCasesAdded: number;
        useCasesRemoved: number;
        newIssues: number;
        resolvedIssues: number;
        jiraVisibilityChanged: number;
        severityChanged: number;
        mitreChanged: number;
        useCaseChanged: number;
      };
      page: {
        offset: number;
        limit: number;
        total: number;
        items: {
          key: string;
          /** @enum {string} */
          state: 'added' | 'removed' | 'changed' | 'resolved';
          changes: string[];
          before?: {
            [key: string]: unknown;
          };
          after?: {
            [key: string]: unknown;
          };
        }[];
      };
    };
    RulesUseCaseParamsDto: {
      useCaseId: string;
    };
    RulesUseCaseListQueryDto: {
      /** @default 0 */
      offset: number;
      /** @default 50 */
      limit: number;
      /** @enum {string} */
      source?: 'system' | 'custom';
      query?: string;
    };
    RulesUseCasePageDocument: {
      offset: number;
      limit: number;
      total: number;
      items: {
        id: string;
        name: string;
        shortName: string;
        description: string;
        component: string;
        vendor: string;
        product: string;
        domain: string;
        category: string;
        /** @enum {string} */
        source: 'system' | 'custom';
        createdBy: string;
        createdAt?: string;
      }[];
    };
    RulesUseCaseDocument: {
      id: string;
      name: string;
      shortName: string;
      description: string;
      component: string;
      vendor: string;
      product: string;
      domain: string;
      category: string;
      /** @enum {string} */
      source: 'system' | 'custom';
      createdBy: string;
      createdAt?: string;
    };
    RulesUseCaseAdministrationParamsDto: {
      useCaseId: string;
    };
    RulesUseCaseCreateDto: {
      id: string;
      name: string;
      shortName: string;
      description: string;
      component: string;
      vendor: string;
      product: string;
      domain: string;
      category: string;
    };
    RulesUseCaseUpdateDto: {
      name: string;
      shortName: string;
      description: string;
      component: string;
      vendor: string;
      product: string;
      domain: string;
      category: string;
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
  RulesSnapshotsController_getRule: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        snapshotId: string;
        position: number;
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
          'application/json': components['schemas']['RulesSnapshotRuleDocument'];
        };
      };
      /** @description Rules snapshot or rule record not found. */
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
  RulesSnapshotsController_getDecoder: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        snapshotId: string;
        position: number;
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
          'application/json': components['schemas']['RulesSnapshotDecoderDocument'];
        };
      };
      /** @description Rules snapshot or decoder record not found. */
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
  RulesSnapshotsController_getIssue: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        snapshotId: string;
        position: number;
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
          'application/json': components['schemas']['RulesSnapshotIssueDocument'];
        };
      };
      /** @description Rules snapshot or validation finding not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  RulesAuthoringController_list: {
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
          'application/json': components['schemas']['RulesAuthoringDraftListDocument'];
        };
      };
    };
  };
  RulesAuthoringController_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['RulesAuthoringDraftCreateDto'];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['RulesAuthoringDraftDocument'];
        };
      };
      /** @description The source is not authorable. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The source snapshot file was not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  RulesAuthoringController_createNew: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['RulesAuthoringDraftCreateNewDto'];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['RulesAuthoringDraftDocument'];
        };
      };
      /** @description The logical file name, tenant, or source type is invalid. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  RulesAuthoringController_get: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        draftId: string;
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
          'application/json': components['schemas']['RulesAuthoringDraftDocument'];
        };
      };
      /** @description Rules authoring draft not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  RulesAuthoringController_update: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        draftId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['RulesAuthoringDraftUpdateDto'];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['RulesAuthoringDraftDocument'];
        };
      };
      /** @description The draft content is invalid or exceeds limits. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Rules authoring draft not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The draft revision changed concurrently. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  RulesAuthoringController_validate: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        draftId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['RulesAuthoringDraftTransitionDto'];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['RulesAuthoringDraftDocument'];
        };
      };
      /** @description Rules authoring draft not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The draft revision changed concurrently. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  RulesAuthoringController_approve: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        draftId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['RulesAuthoringDraftTransitionDto'];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['RulesAuthoringDraftDocument'];
        };
      };
      /** @description Rules authoring draft not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The draft is stale, unvalidated, or contains errors. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  RulesAuthoringController_export: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        draftId: string;
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
          'application/json': components['schemas']['RulesAuthoringExportDocument'];
        };
      };
      /** @description Rules authoring draft not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Only an unchanged approved revision can be exported. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  RulesIntelligenceController_fieldsForSnapshot: {
    parameters: {
      query?: {
        offset?: number;
        limit?: number;
        tenant?: string;
        health?: 'healthy' | 'underused' | 'unknown_source' | 'alias_candidate' | 'orphaned';
        criticality?: 'critical' | 'high' | 'medium' | 'low';
        family?: string;
        query?: string;
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
          'application/json': components['schemas']['RulesFieldIntelligenceDocument'];
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
  RulesIntelligenceController_qualityForSnapshot: {
    parameters: {
      query?: {
        offset?: number;
        limit?: number;
        kind?: 'rules' | 'use_cases';
        tenant?: string;
        grade?: 'excellent' | 'good' | 'needs_review' | 'risky' | 'broken';
        useCaseId?: string;
        query?: string;
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
          'application/json': components['schemas']['RulesQualityDocument'];
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
  RulesIntelligenceController_graphForSnapshot: {
    parameters: {
      query?: {
        mode?: 'rules' | 'decoders' | 'decoder_rules' | 'use_cases' | 'mitre' | 'fields' | 'all';
        query?: string;
        tenant?: string;
        useCaseId?: string;
        status?: string;
        role?: string;
        jiraOnly?: 'true' | 'false';
        includeExternal?: 'true' | 'false';
        limit?: number;
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
          'application/json': components['schemas']['RulesGraphDocument'];
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
  RulesIntelligenceController_roundtripForSnapshot: {
    parameters: {
      query?: {
        offset?: number;
        limit?: number;
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
          'application/json': components['schemas']['RulesRoundtripDocument'];
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
  RulesIntelligenceController_compareSnapshots: {
    parameters: {
      query: {
        beforeSnapshotId: string;
        afterSnapshotId: string;
        kind?: 'rules' | 'decoders' | 'files' | 'use_cases' | 'issues';
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
          'application/json': components['schemas']['RulesSnapshotCompareDocument'];
        };
      };
      /** @description One or both Rules snapshots were not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  RulesUseCasesController_list: {
    parameters: {
      query?: {
        offset?: number;
        limit?: number;
        source?: 'system' | 'custom';
        query?: string;
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
          'application/json': components['schemas']['RulesUseCasePageDocument'];
        };
      };
    };
  };
  RulesUseCaseAdministrationController_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['RulesUseCaseCreateDto'];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['RulesUseCaseDocument'];
        };
      };
      /** @description The use-case payload is invalid. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The use-case ID already exists. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  RulesUseCasesController_get: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        useCaseId: string;
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
          'application/json': components['schemas']['RulesUseCaseDocument'];
        };
      };
      /** @description Rules use case not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  RulesUseCaseAdministrationController_update: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        useCaseId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['RulesUseCaseUpdateDto'];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['RulesUseCaseDocument'];
        };
      };
      /** @description The use-case payload is invalid. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Rules use case not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description System Rules use cases are read-only. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  RulesUseCaseAdministrationController_delete: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        useCaseId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description The custom Rules use case was deleted. */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Rules use case not found. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description System Rules use cases are read-only. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
}
