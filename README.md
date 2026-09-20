# Fluxora

> **Unified, modular state management and caching ecosystem for modern TypeScript applications.**

Combining the ergonomics of Zustand, the predictability and middleware capabilities of Redux, and the query/caching power of TanStack Query into a cohesive, framework-agnostic architecture.

---

## Packages

| Package | Version | Status | Description |
| :--- | :--- | :--- | :--- |
| [`@fluxora/core`](./packages/core) | `v0.1.0` | 🟢 Active | Zero-dependency, framework-agnostic client state engine |
| [`@fluxora/react`](./packages/react) | `v0.1.0` | 🟢 Active | Concurrent-safe, tear-free React 18+ bindings (`useSyncExternalStore`) |
| `@fluxora/query` | Planned | ⏳ v0.2 | Remote data cache, deduplication, mutations & optimistic updates |
| `@fluxora/persist` | Planned | ⏳ v0.3 | Pluggable storage adapters (LocalStorage, IndexedDB, Memory) |
| `@fluxora/vue` | Planned | ⏳ v0.4 | Native Vue 3 reactivity bindings & composables |
| `@fluxora/angular` | Planned | ⏳ v0.5 | Native Angular Signals integration |
| `@fluxora/react-native` | Planned | ⏳ v0.6 | React Native optimizations & AppState tracking |

---

## Quick Start (v0.1)

### 1. Vanilla TypeScript / Framework Agnostic

```ts
import { createStore, batch } from '@fluxora/core';

const counterStore = createStore({
  name: 'counter',
  state: { count: 0 },
  actions: ({ set, get }) => ({
    increment() {
      set(s => ({ count: s.count + 1 }));
    },
    decrement() {
      set(s => ({ count: s.count - 1 }));
    },
  }),
});

// Subscribe to changes
const unsubscribe = counterStore.subscribe((state, prevState) => {
  console.log(`Count changed from ${prevState.count} to ${state.count}`);
});

counterStore.actions.increment(); // Logs: "Count changed from 0 to 1"
```

### 2. React Integration

```tsx
import React from 'react';
import { createStore } from '@fluxora/core';
import { useStore } from '@fluxora/react';

const counterStore = createStore({
  state: { count: 0 },
  actions: ({ set }) => ({
    increment: () => set(s => ({ count: s.count + 1 })),
  }),
});

export function Counter() {
  // Only re-renders when `state.count` changes
  const count = useStore(counterStore, state => state.count);

  return (
    <button onClick={counterStore.actions.increment}>
      Count: {count}
    </button>
  );
}
```

### 3. Context & Scoped Stores (SSR / Multi-instance)

```tsx
import React from 'react';
import { createStore } from '@fluxora/core';
import { createStoreContext } from '@fluxora/react';

const { Provider, useStore, useStoreApi } = createStoreContext(() =>
  createStore({
    state: { value: '' },
    actions: ({ set }) => ({
      setValue: (value: string) => set({ value }),
    }),
  })
);

function Editor() {
  const value = useStore(s => s.value);
  const api = useStoreApi();

  return (
    <input
      value={value}
      onChange={e => api.actions.setValue(e.target.value)}
    />
  );
}

export function App() {
  return (
    <Provider>
      <Editor />
    </Provider>
  );
}
```

---

## Development

```bash
# Install dependencies across all workspaces
pnpm install

# Run all test suites
pnpm test

# Typecheck all packages
pnpm typecheck

# Build ESM, CJS, and .d.ts outputs
pnpm build
```

---

## License

MIT © Lahiru Udayakumara
