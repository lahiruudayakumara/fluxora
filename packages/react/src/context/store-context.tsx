import React, { createContext, useContext, useRef, type ReactNode } from 'react';
import type { StoreApi, EqualityFn } from '@fluxora/core';
import { useStore } from '../hooks/use-store';

export interface StoreContextProviderProps<TStore extends StoreApi<any, any>> {
  store?: TStore;
  children: ReactNode;
}

export interface StoreContextResult<TState, TActions, TStore extends StoreApi<TState, TActions>> {
  Provider: React.FC<StoreContextProviderProps<TStore>>;
  useStore: <TSelected = TState>(
    selector?: (state: TState) => TSelected,
    equalityFn?: EqualityFn<TSelected>
  ) => TSelected;
  useStoreApi: () => TStore;
}

export function createStoreContext<
  TState,
  TActions,
  TStore extends StoreApi<TState, TActions> = StoreApi<TState, TActions>
>(
  storeFactory?: () => TStore
): StoreContextResult<TState, TActions, TStore> {
  const Context = createContext<TStore | null>(null);

  const Provider: React.FC<StoreContextProviderProps<TStore>> = ({ store, children }) => {
    const storeRef = useRef<TStore | undefined>(store);

    if (!storeRef.current) {
      if (store) {
        storeRef.current = store;
      } else if (storeFactory) {
        storeRef.current = storeFactory();
      } else {
        throw new Error(
          '[Fluxora] StoreProvider requires either a "store" prop or a factory function passed to createStoreContext.'
        );
      }
    }

    return <Context.Provider value={storeRef.current}>{children}</Context.Provider>;
  };

  const useStoreApi = (): TStore => {
    const contextValue = useContext(Context);
    if (!contextValue) {
      throw new Error(
        '[Fluxora] useStoreContext must be used within a corresponding StoreProvider.'
      );
    }
    return contextValue;
  };

  const useStoreConsumer = <TSelected = TState>(
    selector?: (state: TState) => TSelected,
    equalityFn?: EqualityFn<TSelected>
  ): TSelected => {
    const storeInstance = useStoreApi();
    return useStore(storeInstance, selector, equalityFn);
  };

  return {
    Provider,
    useStore: useStoreConsumer,
    useStoreApi,
  };
}
