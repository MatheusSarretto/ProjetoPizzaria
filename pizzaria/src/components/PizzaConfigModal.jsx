
import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContextDefinition';
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

function PizzaConfigModal({ isOpen, onClose, pizza, allPizzas, itemToEdit, onUpdateCartItem }) { 
  const { addToCart } = useCart();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSize, setSelectedSize] = useState('grande');
  const [selectedFlavors, setSelectedFlavors] = useState([]); 
  const [selectedBorderFlavor, setSelectedBorderFlavor] = useState(BORDER_FLAVORS[BORDER_FLAVORS.length - 1].id);
  const [observations, setObservations] = useState('');
  const [currentPrice, setCurrentPrice] = useState(0);

  const isEditing = !!itemToEdit;

  useEffect(() => {
    if (isOpen && (pizza || itemToEdit)) {
      setCurrentStep(1); 

      if (isEditing) {
        setSelectedSize(itemToEdit.size || 'grande');
        setSelectedFlavors(itemToEdit.flavors || []); 
        setSelectedBorderFlavor(BORDER_FLAVORS.find(b => b.name === itemToEdit.borderFlavor)?.id || BORDER_FLAVORS[BORDER_FLAVORS.length - 1].id);
        setObservations(itemToEdit.observations || '');
        setCurrentPrice(itemToEdit.price);
      } else {
        setSelectedSize('grande');
        setSelectedFlavors([pizza]);
        setSelectedBorderFlavor(BORDER_FLAVORS[BORDER_FLAVORS.length - 1].id);
        setObservations('');
        setCurrentPrice(pizza.price);
      }
    }
  }, [isOpen, pizza, isEditing, itemToEdit]);

  useEffect(() => {
    if (!pizza && !itemToEdit) return;

    const baseProduct = isEditing ? itemToEdit.flavors[0] : pizza;
    if (!baseProduct) return;

    let basePrice = 0;
    if (selectedFlavors.length > 0) {
      basePrice = Math.max(...selectedFlavors.map(f => f.price));
    } else {
      basePrice = baseProduct.price; 
    }

    const sizeMultiplier = PIZZA_SIZES[selectedSize]?.multiplier || 1.0;
    basePrice *= sizeMultiplier;

    if (selectedBorderFlavor && selectedBorderFlavor !== BORDER_FLAVORS[BORDER_FLAVORS.length - 1].id) {
      basePrice += BORDER_FLAVORS.find(b => b.id === selectedBorderFlavor)?.price || 0;
    }

    setCurrentPrice(basePrice);
  }, [selectedSize, selectedFlavors, selectedBorderFlavor, pizza, isEditing, itemToEdit]);


  if (!isOpen || (!pizza && !itemToEdit)) return null;

  const currentBasePizza = isEditing ? itemToEdit.flavors[0] : pizza; 
  if (!currentBasePizza) return null;

  const currentMaxFlavors = PIZZA_SIZES[selectedSize]?.maxFlavors || 1;

  const basePizzaCategory = currentBasePizza.category.toLowerCase();
  
  const compatibleCategories = MIX_COMPATIBILITY[basePizzaCategory] || [];

  const otherPizzaFlavors = allPizzas.filter(p => {
    const originalPizzaProductId = isEditing ? itemToEdit.originalPizzaId : pizza.id;
    if (p.id === originalPizzaProductId) return false; 
    
    const isPizzaCategory = PIZZA_CATEGORIES_TYPES.includes(p.category.toLowerCase());
    if (!isPizzaCategory) return false;

    const isCompatible = compatibleCategories.includes(p.category.toLowerCase());
    return isCompatible;
  });


  const handleFlavorSelect = (flavor) => {
    setSelectedFlavors(prev => {
      const clickedIsBasePizza = (isEditing && flavor.id === itemToEdit.originalPizzaId) || (!isEditing && flavor.id === pizza.id);
      
      const isAlreadySelected = prev.find(f => f.id === flavor.id);

      if (clickedIsBasePizza) {
          if (isAlreadySelected && prev.length > 1) {
            return prev.filter(f => f.id !== flavor.id);
          } else if (!isAlreadySelected) {
              return [...prev, flavor].sort((a,b) => a.id - b.id);
          }
          return prev;
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
    }).sort((a,b) => a.id - b.id);
  };


  const handleFinalizeAction = () => {
    const newUniqueCartItemId = `${currentBasePizza.id}-${selectedSize}-${selectedFlavors.map(f => f.id).sort().join('-')}-${selectedBorderFlavor}`;
    
    const formattedFlavors = selectedFlavors.map(f => f.name).join(', ');

    const itemData = {
      id: newUniqueCartItemId, 
      
      productId: currentBasePizza.id, 
      
      name: `${PIZZA_SIZES[selectedSize].name} - ${formattedFlavors}`, 
      
      originalPizzaId: currentBasePizza.id,
      
      flavors: selectedFlavors,
      formattedFlavors: formattedFlavors,
      
      size: selectedSize,
      borderFlavor: BORDER_FLAVORS.find(b => b.id === selectedBorderFlavor)?.name,
      observations: observations,
      price: currentPrice,
      quantity: isEditing ? itemToEdit.quantity : 1,
    };

    if (isEditing) {
        onUpdateCartItem(itemToEdit.id, itemData); 
    } else {
        addToCart(itemData);
    }
    onClose();
  };

  const handleNextStep = () => {
    if (currentStep === 1 && selectedSize === 'broto') {
      setCurrentStep(3);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 3 && selectedSize === 'broto') {
      setCurrentStep(1);
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

    const calculatePriceForSize = (sizeKey) => {
    const baseFlavorPrice = pizza.price;
    const sizeMultiplier = PIZZA_SIZES[sizeKey]?.multiplier || 1.0;
    return (baseFlavorPrice * sizeMultiplier).toFixed(2);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pizza-config-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>🗙</button>
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
                      const newBaseFlavor = isEditing ? itemToEdit.flavors[0] : pizza;
                      setSelectedFlavors([newBaseFlavor]); 
                    }}
                  />
                  <span>{PIZZA_SIZES[sizeKey].name}</span>
                  <span className="size-price">R$ {calculatePriceForSize(sizeKey)}</span>
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
                        <img src={`/products/${currentBasePizza.id}.jpg`} alt={currentBasePizza.name} className="flavor-image" onError={(e) => { e.target.onerror = null; e.target.src = '/products/default.jpg'; }} />
                        <span className="flavor-name">{currentBasePizza.name}</span>
                        <span className="flavor-price">R$ {currentBasePizza.price.toFixed(2)}</span>
                        <span className="flavor-description">{currentBasePizza.description}</span>
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
              <p>Você selecionou uma pizza de {selectedSize} sabor único: {currentBasePizza?.name}.</p>
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

            <div className="observations-and-price-container">
                <div className="observations-group">
                    <h3 className="observations-title">4. Observações do Pedido:</h3>
                    <textarea
                        placeholder="Ex: Sem cebola, com pimenta, troco para..."
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        rows="3"
                    ></textarea>
                </div>
                <div className="total-price-display">
                    <p className="total-label">Total do Pedido:</p>
                    <p className="total-price">R$ {currentPrice.toFixed(2)}</p>
                </div>
            </div>

            <div className="step-navigation">
              <button className="back-button" onClick={handlePreviousStep}>Voltar</button>
              <button className="add-to-cart-button" onClick={handleFinalizeAction}>
                {isEditing ? 'Atualizar no Carrinho' : 'Adicionar ao Carrinho'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PizzaConfigModal;