
import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContextDefinition';
import PizzaConfigModal from '../components/PizzaConfigModal'; 
import { Link, useNavigate } from 'react-router-dom';
import './Cart.css';

const BORDER_FLAVORS = [
    { id: 'catupiry', name: 'Catupiry', price: 10.00 },
    { id: 'cheddar', name: 'Cheddar', price: 10.00 },
    { id: 'cream_cheese', name: 'Cream Cheese', price: 10.00 },
    { id: 'chocolate', name: 'Chocolate', price: 10.00 },
    { id: 'sem_borda', name: 'Sem Borda', price: 0.00 },
];

const PIZZA_CATEGORIES = ['tradicionais', 'especiais', 'doces'];

function Cart() {
  const { cartItems, removeItemCompletely, updateCartItem, incrementQuantity, decrementQuantity, getCartTotalPrice } = useCart();
  const navigate = useNavigate();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [allPizzas, setAllPizzas] = useState([]);

  const handleCheckout = () => {
    navigate('/checkout');
  };

  useEffect(() => {
    const fetchAllPizzas = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/products');
        if (!response.ok) throw new Error('Failed to fetch all products.');
        const data = await response.json();
        const filteredPizzas = data.filter(p => PIZZA_CATEGORIES.includes(p.category.toLowerCase()));
        setAllPizzas(filteredPizzas);
      } catch (error) {
        console.error("Error fetching all pizzas for cart edit modal:", error);
      }
    };
    fetchAllPizzas();
  }, []);

  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <h2>Seu Carrinho de Compras</h2>
        <div className="cart-empty-message">
          <p>Seu carrinho está vazio. Adicione algumas pizzas deliciosas!</p>
          <Link to="/" className="continue-shopping-button">Continuar Comprando</Link>
        </div>
        <div className="cart-summary">
            <h3>Total: <strong>R$ {getCartTotalPrice().toFixed(2)}</strong></h3>
            <div className="cart-actions">
              <Link to="/" className="continue-shopping-button">Continuar Comprando</Link>
              <button onClick={handleCheckout} className="checkout-button" disabled={true}>
                Finalizar Compra
              </button>
            </div>
        </div>
      </div>
    );
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setItemToEdit(null);
  };

  const handleUpdateItemInCart = (oldItemId, newItemData) => {
    updateCartItem(oldItemId, newItemData);
    handleCloseEditModal();
  };

  const cartTotalPrice = getCartTotalPrice();

  return (
    <div className="cart-container">
      <h2>Seu Carrinho de Compras</h2>
      
      <div className="cart-items-list">
        {cartItems.map((item) => {
          const imageId = item.originalPizzaId || (item.flavors && item.flavors[0]?.id) || item.id;
          const imageSrc = `/products/${imageId}.jpg`;

          const borderPrice = item.borderFlavor && item.borderFlavor !== 'Sem Borda'
                                ? BORDER_FLAVORS.find(b => b.name === item.borderFlavor)?.price || 0
                                : 0;
        
          const itemCategoryLower = item.category ? item.category.toLowerCase() : '';
          const isCustomPizza = PIZZA_CATEGORIES.includes(itemCategoryLower) || (item.flavors && item.flavors.length > 1);

          return (
            <div key={item.id} className="cart-item-card">
              <img
                src={imageSrc}
                alt={item.name}
                className="cart-item-image"
                onError={(e) => { e.target.onerror = null; e.target.src = '/products/default.jpg'; }}
              />
              <div className="cart-item-details">
                <h3>{item.name}</h3>
                {item.description && <p className="cart-item-description">{item.description}</p>}
                
                {item.observations && <p className="cart-item-observations">Obs: {item.observations}</p>}

                {item.borderFlavor && item.borderFlavor !== 'Sem Borda' && (
                  <p className="cart-item-border">
                    Borda: {item.borderFlavor} <span>(+R$ {borderPrice.toFixed(2)})</span>
                  </p>
                )}

                <p>R$ {item.price.toFixed(2)}</p>

                <div className="item-quantity-controls">
                  <button onClick={() => decrementQuantity(item.id)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => incrementQuantity(item.id)}>+</button>
                </div>
              </div>
              <div className="cart-item-total">
                <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                <div className="cart-item-actions">
                  {isCustomPizza}
                  <button
                    className="remove-item-btn"
                    onClick={() => removeItemCompletely(item.id)}
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="cart-summary">
        <h3>Total: <strong>R$ {cartTotalPrice.toFixed(2)}</strong></h3>
        <div className="cart-actions">
          <Link to="/" className="continue-shopping-button">Continuar Comprando</Link>
          <button onClick={handleCheckout} className="checkout-button" disabled={cartItems.length === 0}>
            Finalizar Compra
          </button>
        </div>
      </div>

      {isEditModalOpen && itemToEdit && (
        <PizzaConfigModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          pizza={itemToEdit.originalPizzaId ? allPizzas.find(p => p.id === itemToEdit.originalPizzaId) : itemToEdit} 
          itemToEdit={itemToEdit} 
          allPizzas={allPizzas}
          onUpdateCartItem={handleUpdateItemInCart}
        />
      )}
    </div>
  );
}

export default Cart;