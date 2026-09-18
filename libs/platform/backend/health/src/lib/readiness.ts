export const READINESS_SERVICE = Symbol('mercure.platform.readiness-service');

export interface ReadinessProbe {
  readonly name: string;
  check(): Promise<void>;
}

export interface ReadinessResult {
  readonly ready: boolean;
  readonly checks: Readonly<Record<string, 'up'>>;
  readonly failedChecks: readonly string[];
}

export class ReadinessService {
  constructor(private readonly probes: readonly ReadinessProbe[]) {}

  async check(): Promise<ReadinessResult> {
    const settled = await Promise.allSettled(
      this.probes.map(async (probe) => {
        await probe.check();
        return probe.name;
      }),
    );

    const checks: Record<string, 'up'> = {};
    const failedChecks: string[] = [];

    settled.forEach((result, index) => {
      const probe = this.probes[index];
      if (!probe) {
        return;
      }

      if (result.status === 'fulfilled') {
        checks[probe.name] = 'up';
      } else {
        failedChecks.push(probe.name);
      }
    });

    return {
      ready: failedChecks.length === 0,
      checks,
      failedChecks,
    };
  }
}
