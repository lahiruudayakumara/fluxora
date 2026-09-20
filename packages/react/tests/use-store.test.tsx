import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { createStore, shallowEqual } from '@fluxora/core';
import { useStore, createStoreContext } from '../src';

describe('@fluxora/react useStore', () => {
  it('reads state from store and re-renders upon state update', () => {
    const store = createStore({
      state: { count: 0 },
      actions: ({ set }) => ({
        increment() {
          set(s => ({ count: s.count + 1 }));
        },
      }),
    });

    const Counter = () => {
      const count = useStore(store, s => s.count);
      return <div data-testid="count">{count}</div>;
    };

    render(<Counter />);
    expect(screen.getByTestId('count').textContent).toBe('0');

    act(() => {
      store.actions.increment();
    });

    expect(screen.getByTestId('count').textContent).toBe('1');
  });

  it('prevents unnecessary re-renders when unrelated state changes', () => {
    const store = createStore({
      state: { count: 0, text: 'hello' },
    });

    const renderCount = vi.fn();

    const TextComponent = () => {
      renderCount();
      const text = useStore(store, s => s.text);
      return <div data-testid="text">{text}</div>;
    };

    render(<TextComponent />);
    expect(renderCount).toHaveBeenCalledTimes(1);

    act(() => {
      store.setState({ count: 99 });
    });

    // Text component should not re-render because `text` did not change!
    expect(renderCount).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('text').textContent).toBe('hello');
  });

  it('supports shallowEqual for object selectors', () => {
    const store = createStore({
      state: { a: 1, b: 2, c: 3 },
    });

    const renderCount = vi.fn();

    const MultiComponent = () => {
      renderCount();
      const slice = useStore(
        store,
        s => ({ a: s.a, b: s.b }),
        shallowEqual
      );
      return <div data-testid="ab">{slice.a}-{slice.b}</div>;
    };

    render(<MultiComponent />);
    expect(renderCount).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('ab').textContent).toBe('1-2');

    // Update `c` which is not in the selector
    act(() => {
      store.setState({ c: 999 });
    });

    // Shallow equality on { a: 1, b: 2 } ensures no re-render
    expect(renderCount).toHaveBeenCalledTimes(1);
  });
});

describe('@fluxora/react createStoreContext', () => {
  it('provides scoped store via context', () => {
    const createCounterStore = () =>
      createStore({
        state: { count: 10 },
        actions: ({ set }) => ({
          inc() {
            set(s => ({ count: s.count + 1 }));
          },
        }),
      });

    const { Provider, useStore: useScopedStore, useStoreApi } =
      createStoreContext(createCounterStore);

    const Display = () => {
      const count = useScopedStore(s => s.count);
      const api = useStoreApi();
      return (
        <div>
          <span data-testid="scoped-count">{count}</span>
          <button data-testid="inc-btn" onClick={() => api.actions.inc()}>
            +
          </button>
        </div>
      );
    };

    render(
      <Provider>
        <Display />
      </Provider>
    );

    expect(screen.getByTestId('scoped-count').textContent).toBe('10');

    act(() => {
      screen.getByTestId('inc-btn').click();
    });

    expect(screen.getByTestId('scoped-count').textContent).toBe('11');
  });

  it('throws error when hook is used outside of Provider', () => {
    const { useStore: useScopedStore } = createStoreContext();

    const BadComponent = () => {
      useScopedStore(s => s);
      return null;
    };

    expect(() => render(<BadComponent />)).toThrowError(
      /useStoreContext must be used within a corresponding StoreProvider/
    );
  });
});
