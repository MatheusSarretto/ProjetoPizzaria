
import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import './ConfirmAddToCartModal.css';

function ConfirmAddToCartModal({ isOpen, onClose, product }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleConfirmAdd = () => {
    addToCart({ ...product, quantity: quantity });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="confirm-add-to-cart-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        <h2>Adicionar ao Carrinho: {product.name}</h2>

        <div className="product-details-summary">
          <img
            src={`/products/${product.id}.jpg`}
            alt={product.name}
            className="product-image-small"
            onError={(e) => { e.target.onerror = null; e.target.src = '/products/default.jpg'; }}
          />
          <div className="details-text">
            <h3>{product.name}</h3>
            {product.description && <p className="product-description-small">{product.description}</p>}
            <p className="product-price-small">R$ {product.price.toFixed(2)}</p>
          </div>
        </div>

        <div className="quantity-selector">
          <label htmlFor="quantity">Quantidade:</label>
          <div className="quantity-controls">
            <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))}>-</button>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              min="1"
            />
            <button onClick={() => setQuantity(prev => prev + 1)}>+</button>
          </div>
        </div>

        <div className="modal-actions">
          <button className="confirm-button" onClick={handleConfirmAdd}>
            Confirmar e Adicionar ({quantity})
          </button>
          <p className="subtotal">Subtotal: R$ {(product.price * quantity).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

export default ConfirmAddToCartModal;