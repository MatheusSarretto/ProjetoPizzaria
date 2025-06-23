
import React from 'react';
import { Link } from 'react-router-dom';
import './OrderConfirmation.css';

function OrderConfirmation() {
  return (
    <div className="order-confirmation-container">
      <h2>Pedido Realizado com Sucesso!</h2>
      <p>Obrigado por sua compra na Pizzaria Boa Noite!</p>
      <p>Seu pedido foi recebido e está sendo preparado para a entrega.</p>
      <p>Você receberá atualizações sobre o status do seu pedido por e-mail.</p>
      <div className="order-confirmation-actions">
        <Link to="/" className="home-button">Voltar à Página Inicial</Link>
      </div>
    </div>
  );
}

export default OrderConfirmation;