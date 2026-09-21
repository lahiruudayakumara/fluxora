export type StateUpdater<TState> = (prevState: TState) => Partial<TState> | TState;

export type StatePatch<TState> = Partial<TState> | StateUpdater<TState>;

export type Listener<TState> = (state: TState, prevState: TState) => void;

export type Unsubscribe = () => void;

export type EqualityFn<T> = (a: T, b: T) => boolean;

export interface Action<TPayload = unknown> {
  type: string;
  payload?: TPayload;
  meta?: Record<string, unknown>;
  timestamp?: number;
}

export interface StoreApi<TState, TActions = Record<string, unknown>> {
  getState: () => TState;
  setState: (patch: StatePatch<TState>, actionName?: string) => void;
  subscribe: (listener: Listener<TState>) => Unsubscribe;
  actions: TActions;
  name?: string;
  reset: () => void;
  dispatch: (action: Action) => void;
}

export interface StoreOptions<TState, TActions> {
  name?: string;
  state: TState;
  actions?: (api: {
    set: (patch: StatePatch<TState>, actionName?: string) => void;
    get: () => TState;
    dispatch: (action: Action) => void;
  }) => TActions;
  middleware?: Middleware<TState>[];
}

export interface MiddlewareContext<TState> {
  getState: () => TState;
  setState: (patch: StatePatch<TState>, actionName?: string) => void;
  storeName?: string;
}

export type Middleware<TState = any> = (
  context: MiddlewareContext<TState>
) => (next: (patch: StatePatch<TState>, actionName?: string) => void) => (patch: StatePatch<TState>, actionName?: string) => void;
