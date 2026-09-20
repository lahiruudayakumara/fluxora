import { EqualityFn, strictEqual } from './equality';

export interface SelectorOptions<TResult> {
  equalityFn?: EqualityFn<TResult>;
}

export type Selector<TState, TResult> = (state: TState) => TResult;

export function memoize<TArgs extends readonly unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  equalityFn: EqualityFn<unknown> = strictEqual
): (...args: TArgs) => TResult {
  let lastArgs: TArgs | null = null;
  let lastResult: TResult | null = null;

  return (...args: TArgs): TResult => {
    if (
      lastArgs !== null &&
      args.length === lastArgs.length &&
      args.every((arg, index) => equalityFn(arg, lastArgs![index]))
    ) {
      return lastResult as TResult;
    }

    lastArgs = args;
    lastResult = fn(...args);
    return lastResult;
  };
}

export function createSelector<TState, S1, R>(
  s1: Selector<TState, S1>,
  combiner: (s1: S1) => R,
  options?: SelectorOptions<R>
): Selector<TState, R>;

export function createSelector<TState, S1, S2, R>(
  s1: Selector<TState, S1>,
  s2: Selector<TState, S2>,
  combiner: (s1: S1, s2: S2) => R,
  options?: SelectorOptions<R>
): Selector<TState, R>;

export function createSelector<TState, S1, S2, S3, R>(
  s1: Selector<TState, S1>,
  s2: Selector<TState, S2>,
  s3: Selector<TState, S3>,
  combiner: (s1: S1, s2: S2, s3: S3) => R,
  options?: SelectorOptions<R>
): Selector<TState, R>;

export function createSelector<TState, S1, S2, S3, S4, R>(
  s1: Selector<TState, S1>,
  s2: Selector<TState, S2>,
  s3: Selector<TState, S3>,
  s4: Selector<TState, S4>,
  combiner: (s1: S1, s2: S2, s3: S3, s4: S4) => R,
  options?: SelectorOptions<R>
): Selector<TState, R>;

export function createSelector<TState, R>(
  ...args: unknown[]
): Selector<TState, R> {
  const options = (
    typeof args[args.length - 1] === 'object' && args[args.length - 1] !== null && !('length' in (args[args.length - 1] as any))
      ? args.pop()
      : {}
  ) as SelectorOptions<R>;

  const combiner = args.pop() as (...results: unknown[]) => R;
  const inputSelectors = args as Selector<TState, unknown>[];

  const memoizedCombiner = memoize(
    combiner,
    (options.equalityFn as EqualityFn<unknown>) ?? strictEqual
  );

  return (state: TState): R => {
    const inputResults = inputSelectors.map(sel => sel(state));
    return memoizedCombiner(...inputResults);
  };
}
