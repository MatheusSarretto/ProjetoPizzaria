
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../profile-subpages/ProfileSubpage.css';

function MyCards() {
  const { user, token } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [formCard, setFormCard] = useState({
    nickname: '', last_four_digits: '', brand: '', cardholder_name: '', gateway_token: ''
  });

  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/cards/user/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao buscar cartões.');
      const data = await response.json();
      setCards(data);
    } catch (err) {
      console.error("Erro ao buscar cartões:", err);
      setError("Não foi possível carregar seus cartões.");
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    if (user && token) {
      fetchCards();
    }
  }, [user, token, fetchCards]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormCard(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => { 
    e.preventDefault();
    setMessage(''); setMessageType('');
    const simulatedGatewayToken = `token_${Math.random().toString(36).substring(2, 15)}`;
    
    try {
      const response = await fetch('http://localhost:5000/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...formCard, user_id: user.id, gateway_token: simulatedGatewayToken })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erro ao adicionar cartão.');
      setMessage('Cartão adicionado com sucesso!'); setMessageType('success');
      setFormCard({ nickname: '', last_four_four_digits: '', brand: '', cardholder_name: '', gateway_token: '' });
      setIsAdding(false);
      fetchCards();
    } catch (err) {
      console.error("Erro ao adicionar cartão:", err);
      setMessage(err.message); setMessageType('error');
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Tem certeza que deseja excluir este cartão?')) return;
    setMessage(''); setMessageType('');
    try {
      const response = await fetch(`http://localhost:5000/api/cards/${cardId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erro ao excluir cartão.');
      setMessage('Cartão excluído com sucesso!'); setMessageType('success');
      fetchCards();
    } catch (err) {
      console.error("Erro ao excluir cartão:", err);
      setMessage(err.message); setMessageType('error');
    }
  };

  return (
    <div className="profile-subpage-content">
      <h3>Meus Cartões</h3>
      <button className="submit-button" onClick={() => setIsAdding(!isAdding)}>
        {isAdding ? 'Cancelar' : 'Adicionar Novo Cartão'}
      </button>

      {message && <p className={`message-info ${messageType}`}>{message}</p>}

      {isAdding && (
        <form onSubmit={handleAddSubmit} className="card-form">
          <h4>Novo Cartão (Dados fictícios)</h4>
          <div className="form-group">
            <label htmlFor="card-nickname">Apelido (opcional):</label>
            <input type="text" id="card-nickname" name="nickname" value={formCard.nickname} onChange={handleFormChange} />
          </div>
          <div className="form-group">
            <label htmlFor="card-last-four">Últimos 4 Dígitos:</label>
            <input type="text" id="card-last-four" name="last_four_digits" value={formCard.last_four_digits} onChange={handleFormChange} maxLength="4" required />
          </div>
          <div className="form-group">
            <label htmlFor="card-brand">Bandeira (Visa, Master):</label>
            <input type="text" id="card-brand" name="brand" value={formCard.brand} onChange={handleFormChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="card-holder-name">Nome do Titular:</label>
            <input type="text" id="card-holder-name" name="cardholder_name" value={formCard.cardholder_name} onChange={handleFormChange} required />
          </div>
          <button type="submit" className="submit-button">Salvar Cartão</button>
        </form>
      )}

      <h4>Cartões Salvos:</h4>
      {loading && <p>Carregando seus cartões...</p>}
      {error && <p className="message-info error">{error}</p>}
      {!loading && !error && cards.length === 0 && (
        <p>Você ainda não tem cartões cadastrados.</p>
      )}
      {!loading && !error && cards.length > 0 && (
        <div className="cards-list">
          {cards.map(card => (
            <div key={card.id} className="card-item-card">
              <h4>{card.brand} - **** {card.last_four_digits}</h4>
              <p>Apelido: {card.nickname || 'N/A'}</p>
              <p>Titular: {card.cardholder_name}</p>
              <div className="card-actions">
                <button className="delete-button" onClick={() => handleDeleteCard(card.id)}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyCards;