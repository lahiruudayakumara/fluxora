import { createStore, batch, createSelector, shallowEqual } from '@fluxora/core';

interface ShoppingCartState {
  items: { id: string; name: string; price: number; quantity: number }[];
  couponCode: string | null;
  discountRate: number;
}

const cartStore = createStore({
  name: 'cart',
  state: {
    items: [],
    couponCode: null,
    discountRate: 0,
  } as ShoppingCartState,
  actions: ({ set }) => ({
    addItem(item: { id: string; name: string; price: number }) {
      set(state => {
        const existing = state.items.find(i => i.id === item.id);
        if (existing) {
          return {
            items: state.items.map(i =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          };
        }
        return {
          items: [...state.items, { ...item, quantity: 1 }],
        };
      }, 'ADD_ITEM');
    },
    applyCoupon(code: string, discount: number) {
      set({ couponCode: code, discountRate: discount }, 'APPLY_COUPON');
    },
    clear() {
      set({ items: [], couponCode: null, discountRate: 0 }, 'CLEAR_CART');
    },
  }),
});

// Memoized Total Price Selector
const selectTotal = createSelector(
  (s: ShoppingCartState) => s.items,
  (s: ShoppingCartState) => s.discountRate,
  (items, discount) => {
    const rawTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    return rawTotal * (1 - discount);
  }
);

console.log('--- Fluxora Vanilla Demonstration ---');

cartStore.subscribe((state, prev) => {
  console.log(`[Store Updated] Items: ${state.items.length}, Total: $${selectTotal(state)}`);
});

// Perform batch updates
batch(() => {
  cartStore.actions.addItem({ id: 'item-1', name: 'Mechanical Keyboard', price: 120 });
  cartStore.actions.addItem({ id: 'item-2', name: 'Ergonomic Mouse', price: 80 });
  cartStore.actions.applyCoupon('SPRING20', 0.2);
});

console.log('Final Cart State:', cartStore.getState());
console.log('Final Calculated Total:', selectTotal(cartStore.getState()));
