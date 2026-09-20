import { StatePatch } from '../types';

export function applyPatch<TState>(
  prevState: TState,
  patch: StatePatch<TState>
): TState {
  const nextPatch = typeof patch === 'function' ? (patch as (s: TState) => Partial<TState> | TState)(prevState) : patch;

  // If nextPatch is null or undefined, state remains unchanged
  if (nextPatch === undefined || nextPatch === null) {
    return prevState;
  }

  // If the state is a primitive or array, or the patch itself is not a plain object, return nextPatch as whole state
  if (
    typeof prevState !== 'object' ||
    prevState === null ||
    Array.isArray(prevState) ||
    typeof nextPatch !== 'object' ||
    Array.isArray(nextPatch)
  ) {
    return nextPatch as TState;
  }

  // Shallow merge for plain objects
  return Object.assign({}, prevState, nextPatch);
}
