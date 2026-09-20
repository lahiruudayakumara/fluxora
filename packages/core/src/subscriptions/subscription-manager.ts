import { Listener, Unsubscribe } from '../types';
import { isBatching, queueBatchFlush } from '../transactions/batch';

export class SubscriptionManager<TState> {
  private listeners = new Set<Listener<TState>>();
  private pendingNotification: { state: TState; prevState: TState } | null = null;

  public subscribe(listener: Listener<TState>): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notify(state: TState, prevState: TState): void {
    if (this.listeners.size === 0) return;

    if (isBatching()) {
      if (!this.pendingNotification) {
        this.pendingNotification = { state, prevState };
        queueBatchFlush(() => this.flush());
      } else {
        // Keep original prevState, update to newest state
        this.pendingNotification.state = state;
      }
      return;
    }

    this.executeNotify(state, prevState);
  }

  private flush(): void {
    if (this.pendingNotification) {
      const { state, prevState } = this.pendingNotification;
      this.pendingNotification = null;
      this.executeNotify(state, prevState);
    }
  }

  private executeNotify(state: TState, prevState: TState): void {
    // Clone listeners to avoid issues if a listener unsubscribes during dispatch
    const currentListeners = Array.from(this.listeners);
    for (const listener of currentListeners) {
      try {
        listener(state, prevState);
      } catch (error) {
        console.error('[Fluxora] Error in store listener:', error);
      }
    }
  }

  public getSubscriberCount(): number {
    return this.listeners.size;
  }

  public clear(): void {
    this.listeners.clear();
    this.pendingNotification = null;
  }
}
