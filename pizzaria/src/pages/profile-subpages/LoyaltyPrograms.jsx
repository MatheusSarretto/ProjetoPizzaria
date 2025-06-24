
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../profile-subpages/ProfileSubpage.css';
import { Link } from 'react-router-dom';

function LoyaltyPrograms() {
  const { user, token } = useAuth();

  const [loyaltyData, setLoyaltyData] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
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
      const fetchedLoyaltyData = await loyaltyResponse.json();
      setLoyaltyData(fetchedLoyaltyData);

      const couponsResponse = await fetch('http://localhost:5000/api/coupons', {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!couponsResponse.ok) {
        const errorData = await couponsResponse.json();
        throw new Error(errorData.message || 'Falha ao buscar cupons.');
      }
      const fetchedCouponsData = await couponsResponse.json();
      setAvailableCoupons(fetchedCouponsData);
      
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

  const progress30 = loyaltyData 
    ? (loyaltyData.fidelidade30_available ? 100 : Math.min(100, (loyaltyData.purchases_count / 5) * 100))
    : 0;
  const progressBroto = loyaltyData 
    ? (loyaltyData.brotogratis_available ? 100 : Math.min(100, (loyaltyData.purchases_count / 10) * 100))
    : 0;

  return (
    <div className="profile-subpage-content loyalty-programs">
      <h3>Programas de Fidelidade</h3>
      {loading && <p>Carregando suas informações de fidelidade...</p>}
      {error && <p className="message-info error">{error}</p>}
      
      {!loading && !error && loyaltyData && (
        <>
          <h4>Seu Progresso de Fidelidade:</h4>
          
          <div className="loyalty-progress-summary">
            <div className="progress-block">
              <div className="progress-header">
                <h4>FIDELIDADE30<br />(30% de Desconto)</h4>
                {loyaltyData.fidelidade30_available ? (
                  <span className="status available">DISPONÍVEL!</span>
                ) : (
                  <span className="status pending">Em Progresso</span>
                )}
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progress30}%` }}></div>
              </div>
              <p className="progress-text">
                {loyaltyData.fidelidade30_available ? (
                    'Cupom pronto para uso no checkout!'
                ) : (
                    `Faltam ${5 - loyaltyData.purchases_count > 0 ? 5 - loyaltyData.purchases_count : 0} pedidos para ganhar.`
                )}
              </p>
            </div>

            <div className="progress-block">
              <div className="progress-header">
                <h4>BROTOGRATIS<br />(Broto Grátis)</h4>
                {loyaltyData.brotogratis_available ? (
                  <span className="status available">Disponível!</span>
                ) : (
                  <span className="status pending">Em Progresso</span>
                )}
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progressBroto}%` }}></div>
              </div>
              <p className="progress-text">
                {loyaltyData.brotogratis_available ? (
                    'Cupom pronto para uso no checkout!'
                ) : (
                    `Faltam ${10 - loyaltyData.purchases_count > 0 ? 10 - loyaltyData.purchases_count : 0} pedidos para Broto Grátis.`
                )}
              </p>
            </div>
          </div>

          <h4>Cupons Ativos:</h4>
          {availableCoupons.length === 0 ? (
            <p>Nenhum cupom disponível no momento. Complete mais pedidos! <Link to="/">Peça agora</Link>.</p>
          ) : (
            <div className="coupons-list">
              {availableCoupons.map(coupon => (
                  <div key={coupon.id} className={`coupon-card available-coupon-card ${coupon.purchases_required ? 'loyalty-coupon-specific' : ''}`}>
                      <div className="coupon-details">
                          {coupon.type === 'free_item' ? (<span className="coupon-value">Broto Grátis</span>) : 
                          (<span className="coupon-value">{coupon.value}{coupon.type === 'percentage' ? '%' : ''}</span>)}
                          <p className="coupon-description">{coupon.description}</p>
                      </div>
                      <span className="redeem-status">Código: {coupon.code}</span>
                  </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default LoyaltyPrograms;