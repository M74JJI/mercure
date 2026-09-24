import { Transform, type TransformCallback } from 'node:stream';

export interface ArchiveDecompressionBudget {
  remainingDecompressedBytes: number;
}

interface ArchiveDecompressionMeterState {
  readonly budget: ArchiveDecompressionBudget;
  readonly maxDecompressedBytes: number;
  decompressedBytes: number;
}

function meterArchiveChunk(
  this: ArchiveDecompressionMeterState,
  chunk: Buffer | Uint8Array,
  _encoding: BufferEncoding,
  callback: TransformCallback,
): void {
  try {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

    if (buffer.length > this.budget.remainingDecompressedBytes) {
      this.budget.remainingDecompressedBytes = 0;
      throw new Error(
        `archive decompressed data exceeds the configured ${this.maxDecompressedBytes}-byte limit`,
      );
    }

    this.budget.remainingDecompressedBytes -= buffer.length;
    this.decompressedBytes += buffer.length;
    callback(null, buffer);
  } catch (error) {
    callback(
      error instanceof Error ? error : new Error('failed to meter decompressed archive data'),
    );
  }
}

export function createArchiveDecompressionMeter(
  budget: ArchiveDecompressionBudget,
  maxDecompressedBytes: number,
): {
  readonly stream: Transform;
  readonly state: ArchiveDecompressionMeterState;
} {
  const state: ArchiveDecompressionMeterState = {
    budget,
    maxDecompressedBytes,
    decompressedBytes: 0,
  };

  return {
    stream: new Transform({
      transform: meterArchiveChunk.bind(state),
    }),
    state,
  };
}
