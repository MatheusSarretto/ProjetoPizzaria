
import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContextDefinition';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './Checkout.css';

function Checkout() {
  const { cartItems, getCartTotalPrice, removeItemCompletely } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    nickname: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip_code: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedAppPaymentOption, setSelectedAppPaymentOption] = useState('');

  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [newCardForm, setNewCardForm] = useState({
    nickname: '', last_four_digits: '', brand: '', cardholder_name: '', gateway_token: ''
  });
  
  const [cupomCode, setCupomCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [cupomMessage, setCupomMessage] = useState('');
  const [cupomMessageType, setCupomMessageType] = useState('');
  const [appliedCupomCode, setAppliedCupomCode] = useState(null);

  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      setError('Você precisa estar logado para finalizar um pedido.');
      navigate('/login');
      return;
    }
    if (cartItems.length === 0 && !success) {
      navigate('/cart');
    }
  }, [user, cartItems, navigate, success]);

  useEffect(() => {
    const fetchAddresses = async () => {
        if (!user || !token) return;
        try {
            const response = await fetch(`http://localhost:5000/api/addresses/user/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao carregar endereços.');
            }
            const data = await response.json();
            setAddresses(data);
            if (data.length > 0) {
                if (!selectedAddressId || !data.some(addr => addr.id === selectedAddressId)) {
                   setSelectedAddressId(data[0].id); 
                }
            } else {
                setSelectedAddressId('');
                setIsAddingNewAddress(true);
            }
        } catch (err) {
            console.error("Erro ao buscar endereços para checkout:", err);
            setError("Não foi possível carregar seus endereços.");
        }
    };
    if (user) {
        fetchAddresses();
    }
  }, [user, token, selectedAddressId]);

  useEffect(() => {
    const fetchCards = async () => {
        if (!user || !token) return;
        try {
            const response = await fetch(`http://localhost:5000/api/cards/user/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao carregar cartões.');
            }
            const data = await response.json();
            setCards(data);
            if (data.length > 0) {
                if (!selectedCardId || !data.some(card => card.id === selectedCardId)) {
                    setSelectedCardId(data[0].id); 
                }
            } else {
                 setSelectedCardId('');
            }
        } catch (err) {
            console.error("Erro ao buscar cartões para checkout:", err);
            setError("Não foi possível carregar seus cartões.");
        }
    };
    if (user && selectedAppPaymentOption === 'saved_card') {
        fetchCards();
    }
  }, [user, token, selectedAppPaymentOption, selectedCardId]);

  const handleApplyCupom = async () => {
    setCupomMessage('');
    setCupomMessageType('');
    setDiscountAmount(0);
    setAppliedCupomCode(null);

    if (!cupomCode) {
        setCupomMessage('Digite um código de cupom.');
        setCupomMessageType('error');
        return;
    }
    if (!user || !token) {
        setCupomMessage('Faça login para aplicar cupons.');
        return;
    }
    if (cartItems.length === 0) {
        setCupomMessage('Adicione itens ao carrinho para aplicar um cupom.');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/coupons/apply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                couponCode: cupomCode.toUpperCase(),
                currentTotalPrice: getCartTotalPrice(),
                cartItems: cartItems.map(item => ({
                    id: item.originalPizzaId || item.id,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.size
                }))
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro ao aplicar cupom.');
        }

        setDiscountAmount(data.discountAmount);
        setCupomMessage(data.message);
        setCupomMessageType('success');
        setAppliedCupomCode(cupomCode.toUpperCase());
    } catch (err) {
        console.error('Erro ao aplicar cupom:', err);
        setDiscountAmount(0);
        setCupomMessage(err.message || 'Erro ao aplicar cupom. Tente novamente.');
        setCupomMessageType('error');
    }
  };

  const handleNewAddressChange = (e) => {
    const { name, value } = e.target;
    setNewAddressForm(prev => ({ ...prev, [name]: value })); 
  };
  const handleNewCardChange = (e) => {
    const { name, value } = e.target;
    setNewCardForm(prev => ({ ...prev, [name]: value })); 
  };

const handleAddNewAddress = async () => {
    if (!newAddressForm.nickname || !newAddressForm.street || !newAddressForm.number || !newAddressForm.neighborhood || !newAddressForm.city || !newAddressForm.state || !newAddressForm.zip_code) {
        setError('Por favor, preencha todos os campos do novo endereço antes de salvar.');
        return;
    }

    if (!user || !token) {
        setError("Usuário não logado ou token ausente. Por favor, faça login.");
        return;
    }

    setLoading(true);
    setError(null);
    
    try {
        const response = await fetch('http://localhost:5000/api/addresses', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ...newAddressForm, user_id: user.id })
        });
        const data = await response.json();

        if (!response.ok) { 
            throw new Error(data.message || 'Erro ao adicionar endereço.');
        }

        setAddresses(prev => [...prev, { ...newAddressForm, user_id: user.id, id: data.id }]); 
        setSelectedAddressId(data.id);
        setIsAddingNewAddress(false);
        setNewAddressForm({ nickname: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip_code: '' });
        setError(null);
        alert('Novo endereço salvo com sucesso!');
    } catch (err) {
        console.error("Erro ao adicionar novo endereço no checkout:", err);
        setError(err.message || 'Erro ao adicionar novo endereço. Verifique sua conexão ou tente novamente.');
    } finally {
        setLoading(false);
    }
  };

  const handleAddNewCard = async () => {
    if (!newCardForm.last_four_digits || !newCardForm.brand || !newCardForm.cardholder_name) {
        setError('Por favor, preencha todos os campos obrigatórios do novo cartão antes de salvar.');
        return;
    }

    if (!user || !token) {
        setError("Usuário não logado ou token ausente. Por favor, faça login.");
        return;
    }
    
    setLoading(true);
    setError(null);
    
    const simulatedGatewayToken = `token_${Math.random().toString(36).substring(2, 15)}`;
    
    try {
        const response = await fetch('http://localhost:5000/api/cards', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ...newCardForm, user_id: user.id, gateway_token: simulatedGatewayToken })
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro ao adicionar cartão.');
        }

        setCards(prev => [...prev, { ...newCardForm, user_id: user.id, id: data.id }]);
        setSelectedCardId(data.id); 
        setNewCardForm({ nickname: '', last_four_digits: '', brand: '', cardholder_name: '', gateway_token: '' });
        setError(null); 
        alert('Novo cartão salvo com sucesso!');
    } catch (err) {
        console.error("Erro ao adicionar novo cartão no checkout:", err);
        setError(err.message || 'Erro ao adicionar novo cartão. Verifique sua conexão ou tente novamente.');
    } finally {
        setLoading(false);
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (cartItems.length === 0) {
      setError('Seu carrinho está vazio. Adicione itens antes de finalizar.');
      setLoading(false);
      return;
    }
    if (!user) {
      setError('Você precisa estar logado para finalizar um pedido.');
      setLoading(false);
      navigate('/login');
      return;
    }

    let finalAddressId = selectedAddressId;

    if (isAddingNewAddress) {
        if (!selectedAddressId || !addresses.some(addr => addr.id === selectedAddressId)) {
            setError('Por favor, preencha todos os campos do novo endereço e clique em "Salvar Novo Endereço" antes de confirmar o pedido.');
            setLoading(false);
            return;
        }
    } else { 
        if (!selectedAddressId) {
            setError('Por favor, selecione um endereço para a entrega.');
            setLoading(false);
            return;
        }
    }
    if (!paymentMethod) {
        setError('Por favor, selecione um método de pagamento.');
        setLoading(false);
        return;
    }

    if (paymentMethod === 'app_payment') {
        if (!selectedAppPaymentOption) {
            setError('Por favor, escolha uma opção de pagamento no aplicativo (cartão salvo, novo cartão ou Pix).');
            setLoading(false);
            return;
        }
        if (selectedAppPaymentOption === 'saved_card') {
            if (!selectedCardId) {
                setError('Por favor, selecione um cartão salvo para o pagamento.');
                setLoading(false);
                return;
            }
        } else if (selectedAppPaymentOption === 'new_card') {
            if (!selectedCardId || !cards.some(card => card.id === selectedCardId)) { 
                setError('Por favor, preencha e salve o novo cartão clicando em "Salvar Novo Cartão" antes de confirmar o pedido.');
                setLoading(false);
                return;
            }
        }
    }

    let finalPrice = getCartTotalPrice() - discountAmount;
    if (finalPrice < 0) finalPrice = 0;

    const orderItems = cartItems.map(item => {
      return {
        productId: item.originalPizzaId || item.id,
        item_price: item.price,
        quantity: item.quantity,
        item_flavors: item.formattedFlavors || null,
        item_size: item.size || null,
        item_border_flavor: item.borderFlavor || null,
        item_observations: item.observations || null,
      };
    });

    const orderData = {
      addressId: finalAddressId,
      totalPrice: finalPrice,
      paymentMethod: paymentMethod,
      notes: notes,
      items: orderItems,
      cupomApplied: appliedCupomCode,
      discountAmount: discountAmount,
    };

    console.log('Order data to send:', orderData);

    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Order submission failed response:', data);
        throw new Error(data.message || 'Erro ao finalizar o pedido.');
      }

      setSuccess(true);
      cartItems.forEach(item => removeItemCompletely(item.id));

      navigate('/order-confirmation');
    } catch (err) {
      setError(err.message || err.detail || 'Ocorreu um erro ao finalizar o pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <h2>Finalizar Pedido</h2>
      {error && <p className="error-message">{error}</p>}
      {!user && <p className="error-message">Você precisa estar logado para finalizar um pedido. <Link to="/login">Clique aqui para fazer login.</Link></p>}
      {cartItems.length === 0 && !success && (
         <p className="error-message">Adicione itens ao carrinho para finalizar seu pedido.</p>
      )}

      {user && cartItems.length > 0 && (
        <form onSubmit={handleSubmitOrder} className="checkout-form">
          <fieldset className="form-section">
            <legend>Endereço de Entrega</legend>
            <div className="form-group">
                <label htmlFor="addressType">Escolha ou Adicione um Endereço:</label>
                <select 
                    id="addressType" 
                    value={isAddingNewAddress ? 'new' : (selectedAddressId || '')}
                    onChange={(e) => {
                        if (e.target.value === 'new') {
                            setIsAddingNewAddress(true);
                            setSelectedAddressId('');
                        } else {
                            setIsAddingNewAddress(false);
                            setSelectedAddressId(Number(e.target.value));
                        }
                    }}
                    required
                >
                    <option value="">Selecione um Endereço</option>
                    {addresses.map(addr => (
                        <option key={addr.id} value={addr.id}>
                            {addr.nickname} - {addr.street}, {addr.number}
                        </option>
                    ))}
                    <option value="new">Adicionar Novo Endereço</option>
                </select>
            </div>

            {isAddingNewAddress && (
              <div className="new-address-form-fields">
                <h4>Detalhes do Novo Endereço:</h4>
                <div className="form-group">
                  <label htmlFor="new-nickname">Apelido:</label>
                  <input type="text" id="new-nickname" name="nickname" value={newAddressForm.nickname} onChange={handleNewAddressChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="new-street">Rua:</label>
                  <input type="text" id="new-street" name="street" value={newAddressForm.street} onChange={handleNewAddressChange} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="new-number">Número:</label>
                    <input type="text" id="new-number" name="number" value={newAddressForm.number} onChange={handleNewAddressChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="new-complement">Complemento:</label>
                    <input type="text" id="new-complement" name="complement" value={newAddressForm.complement} onChange={handleNewAddressChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="new-neighborhood">Bairro:</label>
                  <input type="text" id="new-neighborhood" name="neighborhood" value={newAddressForm.neighborhood} onChange={handleNewAddressChange} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="new-city">Cidade:</label>
                    <input type="text" id="new-city" name="city" value={newAddressForm.city} onChange={handleNewAddressChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="new-state">Estado (UF):</label>
                    <input type="text" id="new-state" name="state" value={newAddressForm.state} onChange={handleNewAddressChange} maxLength="2" required />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="new-zipCode">CEP:</label>
                  <input type="text" id="new-zipCode" name="zip_code" value={newAddressForm.zip_code} onChange={handleNewAddressChange} maxLength="9" required />
                </div>
                <button type="button" className="submit-button" onClick={handleAddNewAddress}>Salvar Novo Endereço</button>
              </div>
            )}
          </fieldset>

          <fieldset className="form-section order-summary-section">
            <legend>Resumo do Pedido</legend>
            <div className="order-items-list">
              {cartItems.map((item) => (
                <div key={item.id} className="order-item-summary">
                  <span>{item.name} x {item.quantity}</span>
                  <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="cupom-section">
                <label htmlFor="cupom">Cupom de Desconto:</label>
                <input
                    type="text"
                    id="cupom"
                    value={cupomCode}
                    onChange={(e) => setCupomCode(e.target.value)}
                    placeholder="Digite seu cupom"
                />
                <button type="button" onClick={handleApplyCupom} className="apply-cupom-button">Aplicar</button>
                {cupomMessage && <p className={`cupom-message ${cupomMessageType}`}>{cupomMessage}</p>} 
            </div>
            <div className="order-total-summary">
              <strong>Total do Pedido:</strong>
              <strong>R$ {(getCartTotalPrice() - discountAmount).toFixed(2)}</strong>
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Método de Pagamento</legend>
            <div className="form-group">
              <label htmlFor="paymentMethod">Escolha o método:</label>
              <select id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required>
                <option value="">Selecione...</option>
                <option value="delivery_cash">Pagar na Entrega (Dinheiro)</option>
                <option value="delivery_card_machine">Pagar na Entrega (Máquina de Cartão)</option>
                <option value="app_payment">Pagar pelo Aplicativo</option>
              </select>
            </div>

            {paymentMethod === 'app_payment' && (
              <div className="app-payment-options">
                <h4>Opções de Pagamento no Aplicativo:</h4>
                <div className="form-group">
                    <select value={selectedAppPaymentOption} onChange={(e) => setSelectedAppPaymentOption(e.target.value)} required>
                        <option value="">Selecione uma opção...</option>
                        <option value="saved_card">Cartão Salvo</option>
                        <option value="new_card">Novo Cartão</option>
                        <option value="pix">Pix</option>
                    </select>
                </div>

                {selectedAppPaymentOption === 'saved_card' && (
                    <div className="saved-card-options">
                        {cards.length === 0 ? (
                            <p>Você não tem cartões salvos. <span className="add-link" onClick={() => setSelectedAppPaymentOption('new_card')}>Adicione um novo.</span></p>
                        ) : (
                            <div className="form-group">
                                <label htmlFor="savedCard">Selecione um cartão:</label>
                                <select id="savedCard" value={selectedCardId} onChange={(e) => setSelectedCardId(Number(e.target.value))} required>
                                    <option value="">Selecione...</option>
                                    {cards.map(card => (
                                        <option key={card.id} value={card.id}>
                                            {card.nickname || card.brand} - **** {card.last_four_digits}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                )}

                {selectedAppPaymentOption === 'new_card' && ( 
                  <div className="new-card-form-fields">
                    <h4>Detalhes do Novo Cartão:</h4>
                    <div className="form-group">
                      <label htmlFor="new-card-nickname">Apelido (opcional):</label>
                      <input type="text" id="new-card-nickname" name="nickname" value={newCardForm.nickname} onChange={handleNewCardChange} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="new-card-last-four">Últimos 4 Dígitos:</label>
                      <input type="text" id="new-card-last-four" name="last_four_digits" value={newCardForm.last_four_digits} onChange={handleNewCardChange} maxLength="4" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="new-card-brand">Bandeira:</label>
                      <input type="text" id="new-card-brand" name="brand" value={newCardForm.brand} onChange={handleNewCardChange} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="new-card-holder-name">Nome do Titular:</label>
                      <input type="text" id="new-card-holder-name" name="cardholder_name" value={newCardForm.cardholder_name} onChange={handleNewCardChange} required />
                    </div>
                    <button type="button" className="submit-button" onClick={handleAddNewCard}>Salvar Novo Cartão</button>
                  </div>
                )}

                {selectedAppPaymentOption === 'pix' && (
                  <div className="pix-info">
                    <p>Você será direcionado para a tela de pagamento Pix após a confirmação do pedido.</p>
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="notes">Observações (opcional):</label>
              <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="3"></textarea>
            </div>
          </fieldset>

          <button type="submit" className="confirm-order-button" disabled={loading || !user || cartItems.length === 0 || (!selectedAddressId && !isAddingNewAddress)}>
            {loading ? 'Finalizando...' : 'Confirmar Pedido'}
          </button>
          {!user && <p className="error-message">Faça login para continuar.</p>}
          {cartItems.length === 0 && <p className="error-message">Seu carrinho está vazio.</p>}
        </form>
      )}
      {cartItems.length === 0 && !success && ( 
         <p className="error-message">Adicione itens ao carrinho para finalizar seu pedido.</p>
      )}
    </div>
  );
}

export default Checkout;