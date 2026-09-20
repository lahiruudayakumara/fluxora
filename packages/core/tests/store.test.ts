import { describe, it, expect, vi } from 'vitest';
import { createStore, batch, shallowEqual, createSelector, Middleware } from '../src';

describe('@fluxora/core store', () => {
  it('creates a store with initial state and allows getState', () => {
    const store = createStore({
      state: { count: 0, user: 'Alice' },
    });

    expect(store.getState()).toEqual({ count: 0, user: 'Alice' });
  });

  it('updates state with partial object patch', () => {
    const store = createStore({
      state: { count: 0, user: 'Alice' },
    });

    store.setState({ count: 1 });
    expect(store.getState()).toEqual({ count: 1, user: 'Alice' });
  });

  it('updates state with functional updater', () => {
    const store = createStore({
      state: { count: 10 },
    });

    store.setState(prev => ({ count: prev.count + 5 }));
    expect(store.getState()).toEqual({ count: 15 });
  });

  it('notifies subscribers with new and previous state', () => {
    const store = createStore({
      state: { count: 0 },
    });

    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.setState({ count: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ count: 1 }, { count: 0 });

    unsubscribe();
    store.setState({ count: 2 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not notify subscribers if state is identical (Object.is)', () => {
    const store = createStore({
      state: { count: 5 },
    });

    const listener = vi.fn();
    store.subscribe(listener);

    store.setState(state => state);
    expect(listener).not.toHaveBeenCalled();
  });

  it('supports bound actions', () => {
    const counter = createStore({
      state: { count: 0 },
      actions: ({ set, get }) => ({
        increment() {
          set(state => ({ count: state.count + 1 }));
        },
        decrement() {
          set(state => ({ count: state.count - 1 }));
        },
        getCount() {
          return get().count;
        },
      }),
    });

    counter.actions.increment();
    counter.actions.increment();
    expect(counter.getState().count).toBe(2);
    expect(counter.actions.getCount()).toBe(2);

    counter.actions.decrement();
    expect(counter.getState().count).toBe(1);
  });

  it('resets state to initial value', () => {
    const store = createStore({
      state: { count: 42, flag: true },
    });

    store.setState({ count: 99, flag: false });
    expect(store.getState()).toEqual({ count: 99, flag: false });

    store.reset();
    expect(store.getState()).toEqual({ count: 42, flag: true });
  });
});

describe('batch transactions', () => {
  it('batches multiple updates into a single notification', () => {
    const store = createStore({
      state: { a: 1, b: 2 },
    });

    const listener = vi.fn();
    store.subscribe(listener);

    batch(() => {
      store.setState({ a: 10 });
      store.setState({ b: 20 });
      store.setState({ a: 100 });
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ a: 100, b: 20 }, { a: 1, b: 2 });
    expect(store.getState()).toEqual({ a: 100, b: 20 });
  });

  it('handles nested batch calls', () => {
    const store = createStore({
      state: { count: 0 },
    });

    const listener = vi.fn();
    store.subscribe(listener);

    batch(() => {
      store.setState({ count: 1 });
      batch(() => {
        store.setState({ count: 2 });
      });
      store.setState({ count: 3 });
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getState().count).toBe(3);
  });
});

describe('selectors and equality', () => {
  it('evaluates shallowEqual accurately', () => {
    expect(shallowEqual(1, 1)).toBe(true);
    expect(shallowEqual(1, 2)).toBe(false);
    expect(shallowEqual({ a: 1, b: 'x' }, { a: 1, b: 'x' })).toBe(true);
    expect(shallowEqual({ a: 1, b: 'x' }, { a: 1, b: 'y' })).toBe(false);
    expect(shallowEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(shallowEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it('memoizes computation with createSelector', () => {
    interface State {
      items: { id: number; price: number }[];
      taxRate: number;
    }

    const selectItems = (state: State) => state.items;
    const selectTaxRate = (state: State) => state.taxRate;

    const computeTotal = vi.fn((items: { id: number; price: number }[], taxRate: number) => {
      const subtotal = items.reduce((sum, item) => sum + item.price, 0);
      return subtotal * (1 + taxRate);
    });

    const selectTotal = createSelector(selectItems, selectTaxRate, computeTotal);

    const state1: State = {
      items: [{ id: 1, price: 100 }, { id: 2, price: 200 }],
      taxRate: 0.1,
    };

    const res1 = selectTotal(state1);
    expect(res1).toBe(330);
    expect(computeTotal).toHaveBeenCalledTimes(1);

    // Call again with same state slices
    const res2 = selectTotal({ ...state1 });
    expect(res2).toBe(330);
    expect(computeTotal).toHaveBeenCalledTimes(1); // Not called again!
  });
});

describe('middleware', () => {
  it('executes middleware pipeline on setState', () => {
    const events: string[] = [];

    const trackerMiddleware: Middleware<{ count: number }> = context => next => (patch, actionName) => {
      events.push(`before:${actionName || 'anonymous'}`);
      next(patch, actionName);
      events.push(`after:${context.getState().count}`);
    };

    const store = createStore({
      state: { count: 0 },
      middleware: [trackerMiddleware],
    });

    store.setState({ count: 5 }, 'CUSTOM_ACTION');

    expect(events).toEqual(['before:CUSTOM_ACTION', 'after:5']);
    expect(store.getState().count).toBe(5);
  });
});
