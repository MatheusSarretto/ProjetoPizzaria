
import React, { useState } from 'react';
import PizzaConfigModal from './PizzaConfigModal';
import ConfirmAddToCartModal from './ConfirmAddToCartModal';
import './MenuItemCarousel.css';

const PIZZA_CATEGORIES = ['tradicionais', 'especiais', 'doces'];

function MenuItemCarousel({ items, allPizzas }) {
  const [startIndex, setStartIndex] = useState(0);
  const itemsPerPage = 5;

  const [isPizzaModalOpen, setIsPizzaModalOpen] = useState(false);
  const [selectedPizza, setSelectedPizza] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const showNextItems = () => {
    setStartIndex((prevIndex) =>
      Math.min(prevIndex + itemsPerPage, items.length - itemsPerPage)
    );
  };

  const showPrevItems = () => {
    setStartIndex((prevIndex) =>
      Math.max(0, prevIndex - itemsPerPage)
    );
  };

  const handleConfigurePizza = (pizzaItem) => {
    setSelectedPizza(pizzaItem);
    setIsPizzaModalOpen(true);
  };

  const handleConfirmAddToCart = (productItem) => {
    setSelectedProduct(productItem);
    setIsConfirmModalOpen(true);
  };

  const handleClosePizzaModal = () => {
    setIsPizzaModalOpen(false);
    setSelectedPizza(null);
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setSelectedProduct(null);
  };

  const filteredAllPizzasForModal = allPizzas.filter(
    p => PIZZA_CATEGORIES.includes(p.category.toLowerCase())
  );

  return (
    <div className="menu-item-carousel-container">
      <button
        className="carousel-button prev"
        onClick={showPrevItems}
        disabled={startIndex === 0}
      >
        {'‹'}
      </button>
      <div className="menu-items-wrapper">
        {items.slice(startIndex, startIndex + itemsPerPage).map((item) => {
          const isPizza = PIZZA_CATEGORIES.includes(item.category.toLowerCase());

          return (
            <div key={item.id} className="menu-item-card">
              <img
                src={`/products/${item.id}.jpg`}
                alt={item.name}
                className="item-image"
                onError={(e) => { e.target.onerror = null; e.target.src = '/products/default.jpg'; }}
              />
              <h3>{item.name}</h3>
              <p className="ingredients">{item.description}</p>
              <p className="price">R$ {item.price.toFixed(2)}</p>
              <button
                className="add-to-cart-button"
                onClick={() => {
                  if (isPizza) {
                    handleConfigurePizza(item);
                  } else {
                    handleConfirmAddToCart(item);
                  }
                }}
              >
                Adicionar ao Carrinho
              </button>
            </div>
          );
        })}
      </div>
      <button
        className="carousel-button next"
        onClick={showNextItems}
        disabled={startIndex + itemsPerPage >= items.length}
      >
        {'›'}
      </button>

      <PizzaConfigModal
        isOpen={isPizzaModalOpen}
        onClose={handleClosePizzaModal}
        pizza={selectedPizza}
        allPizzas={filteredAllPizzasForModal}
      />

      <ConfirmAddToCartModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseConfirmModal}
        product={selectedProduct}
      />
    </div>
  );
}

export default MenuItemCarousel;