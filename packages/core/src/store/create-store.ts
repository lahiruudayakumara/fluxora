import { StoreApi, StoreOptions, StatePatch, Action, MiddlewareContext } from '../types';
import { applyPatch } from '../state/patch';
import { SubscriptionManager } from '../subscriptions/subscription-manager';
import { composeMiddleware } from '../middleware/pipeline';

export function createStore<TState, TActions = Record<string, unknown>>(
  options: StoreOptions<TState, TActions>
): StoreApi<TState, TActions> {
  const initialValue = options.state;
  let currentState: TState = initialValue;
  const subscriptionManager = new SubscriptionManager<TState>();

  const getState = (): TState => currentState;

  const rawSetState = (patch: StatePatch<TState>, _actionName?: string): void => {
    const prevState = currentState;
    const nextState = applyPatch(prevState, patch);

    if (!Object.is(prevState, nextState)) {
      currentState = nextState;
      subscriptionManager.notify(currentState, prevState);
    }
  };

  const middlewareContext: MiddlewareContext<TState> = {
    getState,
    setState: (patch, actionName) => setState(patch, actionName),
    storeName: options.name,
  };

  const setState = composeMiddleware(
    options.middleware || [],
    middlewareContext,
    rawSetState
  );

  const subscribe = (listener: (state: TState, prevState: TState) => void) => {
    return subscriptionManager.subscribe(listener);
  };

  const dispatch = (action: Action): void => {
    setState((state: TState) => state, action.type);
  };

  const reset = (): void => {
    setState(() => initialValue, '@@fluxora/RESET');
  };

  let boundActions = {} as TActions;
  if (typeof options.actions === 'function') {
    boundActions = options.actions({
      set: setState,
      get: getState,
      dispatch,
    });
  }

  return {
    getState,
    setState,
    subscribe,
    actions: boundActions,
    name: options.name,
    reset,
    dispatch,
  };
}
