type FlushCallback = () => void;

let batchDepth = 0;
const queuedFlushes = new Set<FlushCallback>();

export function isBatching(): boolean {
  return batchDepth > 0;
}

export function queueBatchFlush(flush: FlushCallback): void {
  queuedFlushes.add(flush);
}

export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      const flushes = Array.from(queuedFlushes);
      queuedFlushes.clear();
      for (const flush of flushes) {
        try {
          flush();
        } catch (error) {
          console.error('[Fluxora] Error during batch flush:', error);
        }
      }
    }
  }
}
