import { PrismaPg } from '@prisma/adapter-pg';
import { Client } from 'pg';

import { PrismaClient } from '../generated/prisma/client';

export interface PrismaConnectionOptions {
  readonly connectionString: string;
  readonly max: number;
  readonly connectionTimeoutMillis: number;
  readonly idleTimeoutMillis: number;
}

export interface PostgresSessionOptions {
  readonly connectionString: string;
  readonly connectionTimeoutMillis: number;
}

export function createPostgresSession(options: PostgresSessionOptions): Client {
  return new Client({
    connectionString: options.connectionString,
    connectionTimeoutMillis: options.connectionTimeoutMillis,
  });
}

export function createPrismaClient(options: PrismaConnectionOptions): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: options.connectionString,
    max: options.max,
    connectionTimeoutMillis: options.connectionTimeoutMillis,
    idleTimeoutMillis: options.idleTimeoutMillis,
  });

  return new PrismaClient({ adapter });
}

export { PrismaClient };
