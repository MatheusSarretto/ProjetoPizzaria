
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../profile-subpages/ProfileSubpage.css';

const PAYMENT_METHOD_MAP = {
  'delivery_cash': 'Dinheiro na Entrega',
  'delivery_card_machine': 'Cartão na Entrega',
  'app_payment': 'Pago pelo Aplicativo',
  'credit_card': 'Cartão de Crédito (App)',
  'debit_card': 'Cartão de Débito (App)',
  'pix': 'Pix (App)',
};

const ORDER_STATUS_MAP = {
  'pending': 'Pendente',
  'processing': 'Em Preparação',
  'on_the_way': 'A Caminho',
  'delivered': 'Entregue',
  'cancelled': 'Cancelado',
  'completed': 'Concluído',
};

function MyOrders() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!user || !token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/orders/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Falha ao buscar pedidos.');
      }
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error("Erro ao buscar pedidos:", err);
      setError("Não foi possível carregar seus pedidos.");
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="profile-subpage-content">
      <h3>Meus Pedidos</h3>
      {loading && <p>Carregando seus pedidos...</p>}
      {error && <p className="message-info error">{error}</p>}
      {!loading && !error && orders.length === 0 && (
        <p>Você ainda não fez nenhum pedido.</p>
      )}
      {!loading && !error && orders.length > 0 && (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-item-card">
              <h4>Pedido #{order.id} - {new Date(order.created_at).toLocaleDateString()}</h4>
              <p>Status: <strong>{ORDER_STATUS_MAP[order.status] || order.status}</strong></p>
              <ul>
                {order.items && order.items.map((item, idx) => {
                  const itemDescription = [];
                  itemDescription.push(`${item.quantity}x ${item.name}`);

                  if (item.item_flavors && item.item_flavors.length > 0) {
                    itemDescription.push(`- Sabores: ${item.item_flavors}`);
                  }
                  if (item.item_border_flavor && item.item_border_flavor !== 'Sem Borda') {
                    itemDescription.push(`- Borda: ${item.item_border_flavor}`);
                  }
                  if (item.item_observations) {
                    itemDescription.push(`- Obs: ${item.item_observations}`);
                  }

                  return (
                    <li key={idx} className="order-item-detail">
                      {itemDescription.join(' ')} - R$ {item.item_price.toFixed(2)}
                    </li>
                  );
                })}
              </ul>
              <p>Método de Pagamento: <strong>{PAYMENT_METHOD_MAP[order.payment_method] || order.payment_method}</strong></p>
              <p>Total: <strong>R$ {order.total_price.toFixed(2)}</strong></p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyOrders;