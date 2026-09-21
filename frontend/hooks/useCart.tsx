"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AddCartItemPayload, Cart } from "@/types/api";
import * as cartService from "@/services/cart";
import { getErrorMessage } from "@/lib/http";

const EMPTY_CART: Cart = { items: [], subtotal_minor: 0, total_minor: 0 };

interface CartContextValue {
  cart: Cart;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  itemCount: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  refreshCart: () => Promise<void>;
  addItem: (payload: AddCartItemPayload) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const refreshCart = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const nextCart = await cartService.getCart();
      setCart(nextCart);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load your cart right now."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const runMutation = useCallback(async (fn: () => Promise<Cart>) => {
    setIsMutating(true);
    setError(null);
    try {
      const nextCart = await fn();
      setCart(nextCart);
    } catch (err) {
      setError(getErrorMessage(err, "That didn't work. Please try again."));
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const addItem = useCallback(
    (payload: AddCartItemPayload) => runMutation(() => cartService.addCartItem(payload)),
    [runMutation]
  );
  const updateItem = useCallback(
    (itemId: number, quantity: number) => runMutation(() => cartService.updateCartItem(itemId, quantity)),
    [runMutation]
  );
  const removeItem = useCallback((itemId: number) => runMutation(() => cartService.removeCartItem(itemId)), [runMutation]);
  const applyCoupon = useCallback((code: string) => runMutation(() => cartService.applyCoupon(code)), [runMutation]);
  const removeCoupon = useCallback(() => runMutation(() => cartService.removeCoupon()), [runMutation]);

  const itemCount = useMemo(() => cart.items.reduce((sum, item) => sum + item.quantity, 0), [cart.items]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      isLoading,
      isMutating,
      error,
      itemCount,
      isDrawerOpen,
      openDrawer: () => setIsDrawerOpen(true),
      closeDrawer: () => setIsDrawerOpen(false),
      refreshCart,
      addItem,
      updateItem,
      removeItem,
      applyCoupon,
      removeCoupon,
    }),
    [cart, isLoading, isMutating, error, itemCount, isDrawerOpen, refreshCart, addItem, updateItem, removeItem, applyCoupon, removeCoupon]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
