
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../profile-subpages/ProfileSubpage.css';
import { Link } from 'react-router-dom';

function LoyaltyPrograms() {
  const { user, token } = useAuth();

  const [loyaltyData, setLoyaltyData] = useState(null);
  const [generalCoupons, setGeneralCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user || !token) return;
    setLoading(true);
    setError(null);
    try {
      const loyaltyResponse = await fetch(`http://localhost:5000/api/loyalty/user/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!loyaltyResponse.ok) {
        const errorData = await loyaltyResponse.json();
        throw new Error(errorData.message || 'Falha ao buscar progresso de fidelidade.');
      }
      const loyaltyData = await loyaltyResponse.json();
      setLoyaltyData(loyaltyData);

      const couponsResponse = await fetch('http://localhost:5000/api/coupons', {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!couponsResponse.ok) {
        const errorData = await couponsResponse.json();
        throw new Error(errorData.message || 'Falha ao buscar cupons.');
      }
      const couponsData = await couponsResponse.json();
      setGeneralCoupons(couponsData.filter(c => !c.purchases_required));
      
    } catch (err) {
      console.error("Erro ao buscar dados de fidelidade:", err);
      setError(err.message || "Não foi possível carregar as informações de fidelidade.");
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="profile-subpage-content loyalty-programs">
      <h3>Programas de Fidelidade</h3>
      {loading && <p>Carregando suas informações de fidelidade...</p>}
      {error && <p className="message-info error">{error}</p>}
      
      {!loading && !error && loyaltyData && (
        <>
          <h4>Seu Progresso de Compras:</h4>
          <div className="loyalty-progress-cards">
            <div className="progress-card">
              <p>Pedidos Completados: <strong>{loyaltyData.purchases_count}</strong></p>
              <p>Próximo Cupom (30%): <strong>{loyaltyData.purchases_count} de 5 compras</strong></p>
              {loyaltyData.fidelidade30_available ? (
                <span className="status available">FIDELIDADE30 DISPONÍVEL!</span>
              ) : (
                <span className="status pending">Faltam {5 - loyaltyData.purchases_count} pedidos para 30%</span>
              )}
            </div>
            <div className="progress-card">
              <p>Pedidos Completados: <strong>{loyaltyData.purchases_count}</strong></p>
              <p>Próximo Cupom (Broto Grátis): <strong>{loyaltyData.purchases_count} de 10 compras</strong></p>
              {loyaltyData.brotogratis_available ? (
                <span className="status available">BROTOGRATIS DISPONÍVEL!</span>
              ) : (
                <span className="status pending">Faltam {10 - loyaltyData.purchases_count} pedidos para Broto Grátis</span>
              )}
            </div>
          </div>

          <h4>Seus Cupons:</h4>
          <div className="coupons-list">
            {generalCoupons.map(coupon => (
                <div key={coupon.id} className="coupon-card">
                    <div className="coupon-details">
                        <span className="coupon-value">{coupon.value}{coupon.type === 'percentage' ? '%' : ''}</span>
                        <p className="coupon-description">{coupon.description}</p>
                    </div>
                    <span className="redeem-status">Disponível</span>
                </div>
            ))}
            {loyaltyData.fidelidade30_available && (
              <div className="coupon-card">
                <div className="coupon-details">
                  <span className="coupon-value">30%</span>
                  <p className="coupon-description">Cupom FIDELIDADE30: 30% de desconto!</p>
                </div>
                <span className="redeem-status">Disponível</span>
              </div>
            )}
            {loyaltyData.brotogratis_available && (
              <div className="coupon-card">
                <div className="coupon-details">
                  <span className="coupon-value">Broto Grátis</span>
                  <p className="coupon-description">Cupom BROTOGRATIS: Pizza Broto Grátis!</p>
                </div>
                <span className="redeem-status">Disponível</span>
              </div>
            )}
            {(!generalCoupons.length && !loyaltyData.fidelidade30_available && !loyaltyData.brotogratis_available) && (
                <p>Nenhum cupom disponível no momento. Complete mais pedidos!</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default LoyaltyPrograms;