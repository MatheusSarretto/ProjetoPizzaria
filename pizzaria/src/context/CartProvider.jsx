
import React, { useState, useEffect } from 'react'; 
import { CartContext } from './CartContextDefinition';

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

  const addToCart = (newItem) => {
    setCartItems((prevItems) => {
      const uniqueItemId = newItem.id; 
      const existingItemIndex = prevItems.findIndex((cartItem) => cartItem.id === uniqueItemId);

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + (newItem.quantity || 1),
        };
        return updatedItems;
      } else {
        return [...prevItems, { ...newItem, quantity: newItem.quantity || 1 }];
      }
    });
  };

  const updateCartItem = (oldItemId, newItemData) => {
    setCartItems((prevItems) => {
      const oldItemIndex = prevItems.findIndex(item => item.id === oldItemId);
      if (oldItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[oldItemIndex] = { ...newItemData, quantity: newItemData.quantity || 1 };
        return updatedItems;
      } else {
        return [...prevItems, { ...newItemData, quantity: newItemData.quantity || 1 }];
      }
    });
  };

  const incrementQuantity = (itemId) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((cartItem) => cartItem.id === itemId);
      if (existingItemIndex === -1) {
        return prevItems;
      }
      const updatedItems = [...prevItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + 1,
      };
      return updatedItems;
    });
  };

  const decrementQuantity = (itemId) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((cartItem) => cartItem.id === itemId);

      if (existingItemIndex === -1) {
        return prevItems;
      }

      const updatedItems = [...prevItems];
      const itemToUpdate = { ...updatedItems[existingItemIndex] };

      if (itemToUpdate.quantity === 1) {
        return updatedItems.filter((cartItem) => cartItem.id !== itemId);
      } else {
        itemToUpdate.quantity -= 1;
        updatedItems[existingItemIndex] = itemToUpdate;
        return updatedItems;
      }
    });
  };

  const removeItemCompletely = (itemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  const getCartItemCount = () => { return cartItems.reduce((total, item) => total + item.quantity, 0); };
  const getCartTotalPrice = () => { return cartItems.reduce((total, item) => total + item.price * item.quantity, 0); };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeItemCompletely,
        updateCartItem,
        incrementQuantity,
        decrementQuantity,
        getCartItemCount,
        getCartTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};