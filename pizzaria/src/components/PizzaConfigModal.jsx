
import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import './PizzaConfigModal.css';

const BORDER_FLAVORS = [
  { id: 'catupiry', name: 'Catupiry', price: 10.00 },
  { id: 'cheddar', name: 'Cheddar', price: 10.00 },
  { id: 'cream_cheese', name: 'Cream Cheese', price: 10.00 },
  { id: 'chocolate', name: 'Chocolate', price: 10.00 },
  { id: 'sem_borda', name: 'Sem Borda', price: 0.00 },
];

const PIZZA_SIZES = {
  'grande': { name: 'Grande', multiplier: 1.0, maxFlavors: 3 },
  'broto': { name: 'Broto', multiplier: 0.7, maxFlavors: 1 },
};

const PIZZA_CATEGORIES_TYPES = ['tradicionais', 'especiais', 'doces'];

const MIX_COMPATIBILITY = {
  'tradicionais': ['tradicionais', 'especiais'], 
  'especiais': ['tradicionais', 'especiais'],
  'doces': ['doces'],
};

function PizzaConfigModal({ isOpen, onClose, pizza, allPizzas, onUpdateCartItem }) { 
  const { addToCart } = useCart();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSize, setSelectedSize] = useState('grande');
  const [selectedFlavors, setSelectedFlavors] = useState([]);
  const [selectedBorderFlavor, setSelectedBorderFlavor] = useState(BORDER_FLAVORS[BORDER_FLAVORS.length - 1].id);
  const [observations, setObservations] = useState('');
  const [currentPrice, setCurrentPrice] = useState(0);

  const isEditing = !!onUpdateCartItem;

  useEffect(() => {
    if (isOpen && pizza) {
      setCurrentStep(1);

      if (isEditing) {
        setSelectedSize(pizza.size || 'grande');
        setSelectedFlavors(pizza.flavors || []); 
        setSelectedBorderFlavor(BORDER_FLAVORS.find(b => b.name === pizza.borderFlavor)?.id || BORDER_FLAVORS[BORDER_FLAVORS.length - 1].id);
        setObservations(pizza.observations || '');
        setCurrentPrice(pizza.price);
      } else {
        setSelectedSize('grande');
        setSelectedFlavors([pizza]);
        setSelectedBorderFlavor(BORDER_FLAVORS[BORDER_FLAVORS.length - 1].id);
        setObservations('');
        setCurrentPrice(pizza.price);
      }
    }
  }, [isOpen, pizza, isEditing]);

  useEffect(() => {
    if (!pizza) return;

    let basePrice = 0;
    if (selectedFlavors.length > 0) {
      basePrice = Math.max(...selectedFlavors.map(f => f.price));
    } else {
      basePrice = pizza.price; 
    }

    const sizeMultiplier = PIZZA_SIZES[selectedSize]?.multiplier || 1.0;
    basePrice *= sizeMultiplier;

    if (selectedBorderFlavor && selectedBorderFlavor !== BORDER_FLAVORS[BORDER_FLAVORS.length - 1].id) {
      basePrice += BORDER_FLAVORS.find(b => b.id === selectedBorderFlavor)?.price || 0;
    }

    setCurrentPrice(basePrice);
  }, [selectedSize, selectedFlavors, selectedBorderFlavor, pizza]);

  if (!isOpen || !pizza) return null;

  const currentMaxFlavors = PIZZA_SIZES[selectedSize]?.maxFlavors || 1;

  const basePizzaCategory = pizza.category.toLowerCase();
  
  const compatibleCategories = MIX_COMPATIBILITY[basePizzaCategory] || [];

  const otherPizzaFlavors = allPizzas.filter(p => {
    if (p.id === pizza.id) return false; 
    
    const isPizzaCategory = PIZZA_CATEGORIES_TYPES.includes(p.category.toLowerCase());
    if (!isPizzaCategory) return false;

    const isCompatible = compatibleCategories.includes(p.category.toLowerCase());
    return isCompatible;
  });

  console.log('Base Pizza Category:', basePizzaCategory);
  console.log('Compatible Categories for mix:', compatibleCategories);
  console.log('Other Pizza Flavors available for selection:', otherPizzaFlavors);

  const handleFlavorSelect = (flavor) => {
    setSelectedFlavors(prev => {
      const isOriginalConfigPizza = flavor.id === pizza.id; 

      const isAlreadySelected = prev.find(f => f.id === flavor.id);

      if (isOriginalConfigPizza) { 
          if (isAlreadySelected) {
            return prev.length === 1 ? prev : prev.filter(f => f.id !== flavor.id);
          } else {
            return [...prev, flavor];
          }
      }

      if (isAlreadySelected) {
        return prev.filter(f => f.id !== flavor.id);
      } else {
        if (prev.length < currentMaxFlavors) {
          return [...prev, flavor];
        } else {
          return prev;
        }
      }
    });
  };

  const handleFinalizeAction = () => {
    const formattedFlavors = selectedFlavors.map(f => f.name).join(', ');

    const itemData = {
      id: isEditing ? pizza.id : `${pizza.id}-${selectedSize}-${selectedFlavors.map(f => f.id).sort().join('-')}-${selectedBorderFlavor}`,
      productId: isEditing ? pizza.originalPizzaId : pizza.id, 
      name: `${PIZZA_SIZES[selectedSize].name} - ${formattedFlavors}`, 
      originalPizzaId: pizza.id,
      flavors: selectedFlavors,
      formattedFlavors: formattedFlavors,
      size: selectedSize,
      borderFlavor: BORDER_FLAVORS.find(b => b.id === selectedBorderFlavor)?.name,
      observations: observations,
      price: currentPrice,
      quantity: pizza.quantity || 1,
    };

    if (isEditing) {
        onUpdateCartItem(pizza.id, itemData); 
    } else {
        addToCart(itemData);
    }
    onClose();
  };

  const handleNextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pizza-config-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        <h2>{isEditing ? 'Editar Pizza' : 'Configurar sua Pizza'}: {pizza.name}</h2>

        {currentStep === 1 && (
          <div className="config-step">
            <h3>1. Escolha o Tamanho:</h3>
            <div className="size-options">
              {Object.keys(PIZZA_SIZES).map(sizeKey => (
                <label key={sizeKey}>
                  <input
                    type="radio"
                    value={sizeKey}
                    checked={selectedSize === sizeKey}
                    onChange={(e) => {
                      setSelectedSize(e.target.value);
                      if (e.target.value === 'broto') {
                          setSelectedFlavors([pizza]);
                      } else {
                          setSelectedFlavors([pizza]); 
                      }
                    }}
                  />
                  <span>{PIZZA_SIZES[sizeKey].name}</span>
                </label>
              ))}
            </div>
            <div className="step-navigation single-button-right">
              <button className="next-button" onClick={handleNextStep}>Próximo</button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="config-step">
            <h3>2. Escolha Sabores:</h3>
            {(selectedSize === 'grande' && currentMaxFlavors > 1) ? (
              <>
                <p className="flavor-note">(Escolha até {currentMaxFlavors - 1} sabores adicionais. O preço final será do sabor mais caro.)</p>
                <div className="flavor-options-grid-container">
                  <div className="flavor-options-grid">
                    <label className="selected original-flavor">
                      <input type="checkbox" checked={true} disabled />
                      <div className="flavor-card-content">
                        <img src={`/products/${pizza.id}.jpg`} alt={pizza.name} className="flavor-image" onError={(e) => { e.target.onerror = null; e.target.src = '/products/default.jpg'; }} />
                        <span className="flavor-name">{pizza.name}</span>
                        <span className="flavor-price">R$ {pizza.price.toFixed(2)}</span>
                        <span className="flavor-description">{pizza.description}</span>
                      </div>
                    </label>

                    {otherPizzaFlavors.map(flavor => (
                      <label key={flavor.id} className={selectedFlavors.find(f => f.id === flavor.id) ? 'selected' : ''}>
                        <input
                          type="checkbox"
                          checked={selectedFlavors.find(f => f.id === flavor.id) ? true : false}
                          onChange={() => handleFlavorSelect(flavor)}
                          disabled={selectedFlavors.length >= currentMaxFlavors && !selectedFlavors.find(f => f.id === flavor.id)}
                        />
                        <div className="flavor-card-content">
                          <img src={`/products/${flavor.id}.jpg`} alt={flavor.name} className="flavor-image" onError={(e) => { e.target.onerror = null; e.target.src = '/products/default.jpg'; }} />
                          <span className="flavor-name">{flavor.name}</span>
                          <span className="flavor-price">R$ {flavor.price.toFixed(2)}</span>
                          <span className="flavor-description">{flavor.description}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p>Você selecionou uma pizza de {selectedSize} sabor único: {pizza.name}.</p>
            )}
            <div className="step-navigation">
              <button className="back-button" onClick={handlePreviousStep}>Voltar</button>
              <button className="next-button" onClick={handleNextStep}>Próximo</button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="config-step">
            <h3>3. Borda Recheada:</h3>
            <p className="flavor-note">(Escolha uma opção de borda.)</p>
            <div className="border-options-grid-container">
                <div className="border-flavor-options-grid">
                {BORDER_FLAVORS.map(border => (
                    <label key={border.id}>
                    <input
                        type="radio"
                        value={border.id}
                        checked={selectedBorderFlavor === border.id}
                        onChange={(e) => setSelectedBorderFlavor(e.target.value)}
                    />
                    <span className="border-name">{border.name}</span>
                    {border.price > 0 && <span className="border-price">(+R$ {border.price.toFixed(2)})</span>}
                    </label>
                ))}
                </div>
            </div>

            <h3 className="observations-title">4. Observações do Pedido:</h3>
            <textarea
              placeholder="Ex: Sem cebola, com pimenta, troco para..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows="3"
            ></textarea>

            <div className="step-navigation">
              <button className="back-button" onClick={handlePreviousStep}>Voltar</button>
              <button className="add-to-cart-button" onClick={handleFinalizeAction}>
                {isEditing ? 'Atualizar no Carrinho' : 'Adicionar ao Carrinho'}
              </button>
            </div>
          </div>
        )}

        <div className="modal-footer-price">
          <p className="total-price">Total: R$ {currentPrice.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

export default PizzaConfigModal;