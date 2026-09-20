import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector.js';
import type { StoreApi, EqualityFn } from '@fluxora/core';

const identity = <T>(state: T): T => state;

export function useStore<TState, TSelected = TState>(
  store: StoreApi<TState, any>,
  selector: (state: TState) => TSelected = identity as unknown as (state: TState) => TSelected,
  equalityFn?: EqualityFn<TSelected>
): TSelected {
  return useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getState,
    store.getState,
    selector,
    equalityFn
  );
}
