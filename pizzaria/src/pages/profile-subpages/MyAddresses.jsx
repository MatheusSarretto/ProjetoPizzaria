
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../profile-subpages/ProfileSubpage.css';

function MyAddresses() {
  const { user, token } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formAddress, setFormAddress] = useState({
    nickname: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip_code: ''
  });

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/addresses/user/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao buscar endereços.');
      const data = await response.json();
      setAddresses(data);
    } catch (err) {
      console.error("Erro ao buscar endereços:", err);
      setError("Não foi possível carregar seus endereços.");
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    if (user && token) {
      fetchAddresses();
    }
  }, [user, token, fetchAddresses]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setMessageType('');
    try {
      const response = await fetch('http://localhost:5000/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...formAddress, user_id: user.id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erro ao adicionar endereço.');
      setMessage('Endereço adicionado com sucesso!'); setMessageType('success');
      setFormAddress({ nickname: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip_code: '' });
      setIsAdding(false);
      fetchAddresses();
    } catch (err) {
      console.error("Erro ao adicionar endereço:", err);
      setMessage(err.message); setMessageType('error');
    }
  };

  const handleEditClick = (address) => {
    setEditingAddress(address.id);
    setFormAddress({ ...address });
    setIsAdding(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setMessageType('');
    try {
      const response = await fetch(`http://localhost:5000/api/addresses/${editingAddress}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...formAddress, user_id: user.id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erro ao atualizar endereço.');
      setMessage('Endereço atualizado com sucesso!'); setMessageType('success');
      setEditingAddress(null);
      setIsAdding(false);
      setFormAddress({ nickname: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip_code: '' });
      fetchAddresses();
    } catch (err) {
      console.error("Erro ao atualizar endereço:", err);
      setMessage(err.message); setMessageType('error');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Tem certeza que deseja excluir este endereço?')) return;
    setMessage(''); setMessageType('');
    try {
      const response = await fetch(`http://localhost:5000/api/addresses/${addressId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erro ao excluir endereço.');
      setMessage('Endereço excluído com sucesso!'); setMessageType('success');
      fetchAddresses();
    } catch (err) {
      console.error("Erro ao excluir endereço:", err);
      setMessage(err.message); setMessageType('error');
    }
  };

  return (
    <div className="profile-subpage-content">
      <h3>Meus Endereços</h3>
      <button className="submit-button" onClick={() => { setIsAdding(!isAdding); setEditingAddress(null); setFormAddress({ nickname: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip_code: '' }); }}>
        {isAdding ? 'Cancelar' : 'Adicionar Novo Endereço'}
      </button>

      {message && <p className={`message-info ${messageType}`}>{message}</p>}

      {isAdding && (
        <form onSubmit={editingAddress ? handleUpdateSubmit : handleAddSubmit} className="address-form">
          <h4>{editingAddress ? 'Editar Endereço' : 'Novo Endereço'}</h4>
          <div className="form-group">
            <label htmlFor="nickname">Apelido (ex: Casa, Trabalho):</label>
            <input type="text" id="nickname" name="nickname" value={formAddress.nickname} onChange={handleFormChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="street">Rua:</label>
            <input type="text" id="street" name="street" value={formAddress.street} onChange={handleFormChange} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="number">Número:</label>
              <input type="text" id="number" name="number" value={formAddress.number} onChange={handleFormChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="complement">Complemento:</label>
              <input type="text" id="complement" name="complement" value={formAddress.complement} onChange={handleFormChange} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="neighborhood">Bairro:</label>
            <input type="text" id="neighborhood" name="neighborhood" value={formAddress.neighborhood} onChange={handleFormChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="city">Cidade:</label>
            <input type="text" id="city" name="city" value={formAddress.city} onChange={handleFormChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="state">Estado (UF):</label>
            <input type="text" id="state" name="state" value={formAddress.state} onChange={handleFormChange} maxLength="2" required />
          </div>
          <div className="form-group">
            <label htmlFor="zip_code">CEP:</label>
            <input type="text" id="zip_code" name="zip_code" value={formAddress.zip_code} onChange={handleFormChange} maxLength="9" required />
          </div>
          <button type="submit" className="submit-button">{editingAddress ? 'Atualizar Endereço' : 'Salvar Endereço'}</button>
        </form>
      )}

      <h4>Endereços Salvos:</h4>
      {loading && <p>Carregando seus endereços...</p>}
      {error && <p className="message-info error">{error}</p>}
      {!loading && !error && addresses.length === 0 && (
        <p>Você ainda não tem endereços cadastrados.</p>
      )}
      {!loading && !error && addresses.length > 0 && (
        <div className="addresses-list">
          {addresses.map(addr => (
            <div key={addr.id} className="address-card">
              <h4>{addr.nickname}</h4>
              <p>{addr.street}, {addr.number} {addr.complement && `- ${addr.complement}`}</p>
              <p>{addr.neighborhood}, {addr.city} - {addr.state}, {addr.zip_code}</p>
              <div className="card-actions">
                <button className="edit-button" onClick={() => handleEditClick(addr)}>Editar</button>
                <button className="delete-button" onClick={() => handleDeleteAddress(addr.id)}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyAddresses;