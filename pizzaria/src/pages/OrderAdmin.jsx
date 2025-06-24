
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './OrderAdmin.css';

const ORDER_STATUS_MAP_ADMIN = {
  'pending': 'Pendente',
  'confirmed': 'Confirmado',
  'preparing': 'Em Preparação',
  'on_the_way': 'A Caminho',
  'delivered': 'Entregue',
  'cancelled': 'Cancelado',
  'refunded': 'Reembolsado',
};

function OrderAdmin() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [filterLast24h, setFilterLast24h] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchAllOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `http://localhost:5000/api/orders${filterLast24h ? '?last24h=true' : ''}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao buscar todos os pedidos.');
      }
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error("Erro ao buscar todos os pedidos:", err);
      setError("Não foi possível carregar os pedidos.");
    } finally {
      setLoading(false);
    }
  }, [token, filterLast24h]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAllOrders();
    }
  }, [fetchAllOrders, user]);

  const handleStatusChange = async (orderId, newStatus) => {
    setMessage('');
    setMessageType('');
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao atualizar status.');
      }
      setMessage(data.message);
      setMessageType('success');
      fetchAllOrders();
    } catch (err) {
      console.error(`Erro ao atualizar status do pedido ${orderId}:`, err);
      setMessage(err.message || 'Erro ao atualizar status.');
      setMessageType('error');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-access-denied">
        <h2>Acesso Negado</h2>
        <p>Você precisa ser um administrador para acessar esta página.</p>
        <button onClick={() => navigate('/login')}>Fazer Login</button>
      </div>
    );
  }

  return (
    <div className="order-admin-container">
      <h2>Gerenciamento de Pedidos</h2>
      {message && <p className={`message-info ${messageType}`}>{message}</p>}

      <div className="order-filters">
        <label>
          <input
            type="checkbox"
            checked={filterLast24h}
            onChange={(e) => setFilterLast24h(e.target.checked)}
          />
          Mostrar apenas pedidos das últimas 24 horas
        </label>
      </div>

      {loading && <p>Carregando pedidos...</p>}
      {error && <p className="message-info error">{error}</p>}
      {!loading && !error && orders.length === 0 && (
        <p>Nenhum pedido encontrado{filterLast24h ? ' nas últimas 24 horas.' : '.'}</p>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="admin-orders-list">
          {orders.map(order => (
            <div key={order.id} className="admin-order-card">
              <div className="order-summary-header">
                <h3>Pedido #{order.id} ({ORDER_STATUS_MAP_ADMIN[order.status] || order.status})</h3>
                <p>Cliente: {order.customer_name} ({order.user_id})</p>
                <p>Endereço: {order.address_nickname} - {order.street}, {order.number}</p>
                <p>Data: {new Date(order.created_at).toLocaleString()}</p>
              </div>
              <div className="order-details-body">
                <p>Método de Pagamento: {order.payment_method}</p>
                <p>Observações: {order.notes || 'N/A'}</p>
                <h4>Itens do Pedido:</h4>
                <ul>
                  {order.items.map((item, idx) => (
                    <li key={idx}>
                      {item.quantity}x {item.product_name} ({item.item_size})
                      {item.item_flavors && ` - Sabores: ${item.item_flavors}`}
                      {item.item_border_flavor && item.item_border_flavor !== 'Sem Borda' && ` - Borda: ${item.item_border_flavor}`}
                      {item.item_observations && ` (Obs: ${item.item_observations})`}
                      - R$ {item.item_price.toFixed(2)}
                    </li>
                  ))}
                </ul>
                <p className="order-total">Total: <strong>R$ {order.total_price.toFixed(2)}</strong></p>
              </div>
              <div className="order-status-actions">
                <label htmlFor={`status-${order.id}`}>Atualizar Status:</label>
                <select
                  id={`status-${order.id}`}
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                >
                  {Object.keys(ORDER_STATUS_MAP_ADMIN).map(statusKey => (
                    <option key={statusKey} value={statusKey}>
                      {ORDER_STATUS_MAP_ADMIN[statusKey]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderAdmin;