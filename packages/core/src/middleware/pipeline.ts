import { Middleware, MiddlewareContext, StatePatch } from '../types';

export function composeMiddleware<TState>(
  middlewares: Middleware<TState>[],
  context: MiddlewareContext<TState>,
  baseSetState: (patch: StatePatch<TState>, actionName?: string) => void
): (patch: StatePatch<TState>, actionName?: string) => void {
  if (!middlewares || middlewares.length === 0) {
    return baseSetState;
  }

  const chain = middlewares.map(middleware => middleware(context));
  return chain.reduceRight((next, fn) => fn(next), baseSetState);
}

export function createLoggerMiddleware<TState>(options: {
  collapsed?: boolean;
  prefix?: string;
} = {}): Middleware<TState> {
  const { collapsed = false, prefix = '[Fluxora]' } = options;

  return context => next => (patch, actionName) => {
    const prevState = context.getState();
    const actionLabel = actionName || (typeof patch === 'function' ? 'functional update' : 'setState');
    const storeLabel = context.storeName ? ` (${context.storeName})` : '';
    const title = `${prefix}${storeLabel} action @ ${actionLabel}`;

    const groupFn = collapsed ? console.groupCollapsed : console.group;

    try {
      groupFn(title);
      console.log('%c prev state', 'color: #9E9E9E; font-weight: bold;', prevState);
      console.log('%c payload/patch', 'color: #03A9F4; font-weight: bold;', patch);
    } catch {
      // Fallback if console.group is not supported
      console.log(title, { prevState, patch });
    }

    next(patch, actionName);

    const nextState = context.getState();
    try {
      console.log('%c next state', 'color: #4CAF50; font-weight: bold;', nextState);
      console.groupEnd();
    } catch {
      console.log(title, { nextState });
    }
  };
}
