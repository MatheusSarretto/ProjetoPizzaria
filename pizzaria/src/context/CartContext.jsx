
import React, { createContext, useState, useContext, useEffect } from 'react'; // Importe useEffect

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const storedCartItems = sessionStorage.getItem('cartItems');
      return storedCartItems ? JSON.parse(storedCartItems) : [];
    } catch (error) {
      console.error("Erro ao carregar carrinho do sessionStorage:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('cartItems', JSON.stringify(cartItems));
    } catch (error) {
      console.error("Erro ao salvar carrinho no sessionStorage:", error);
    }
  }, [cartItems]);

  const addToCart = (item) => {
    setCartItems((prevItems) => {
      const isCustomized = item.flavors && item.size;

      if (!isCustomized) {
        const existingItem = prevItems.find((cartItem) => cartItem.id === item.id);
        if (existingItem) {
          return prevItems.map((cartItem) =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          );
        }
      }
      return [...prevItems, { ...item, quantity: item.quantity || 1 }];
    });
  };

  const updateCartItem = (oldItemId, newItemData) => {
    setCartItems((prevItems) => {
      const filteredItems = prevItems.filter(item => item.id !== oldItemId);
      return [...filteredItems, { ...newItemData, quantity: newItemData.quantity || 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((cartItem) => cartItem.id === itemId);
      if (existingItem && existingItem.quantity === 1) {
        return prevItems.filter((cartItem) => cartItem.id !== itemId);
      } else if (existingItem) {
        return prevItems.map((cartItem) =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      }
      return prevItems;
    });
  };

  const removeItemCompletely = (itemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        removeItemCompletely,
        updateCartItem,
        getCartItemCount,
        getCartTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  return useContext(CartContext);
};