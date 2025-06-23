
import React, { useState } from 'react';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import './Footer.css';

function Footer() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (e) => {
    e.preventDefault();
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section footer-brand">
          <img src="/logo.png" alt="Logo da Pizzaria" className="footer-logo" />
        </div>

        <div className="footer-section footer-contact">
          <h4>Fale Conosco</h4>
          <p>Endereço: Rua Pedro Vicente, 625 - Canindé</p>
          <p>Cidade: São Paulo - SP</p>
          <p>Telefone: (11) 1234-5678</p>
        </div>

        <div className="footer-section footer-links">
          <h4>Informações</h4>
          <ul>
            <li><a onClick={openModal}>Política de Privacidade</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2025 Pizzaria Bom Noite - Todos os direitos reservados.</p>
      </div>

      <PrivacyPolicyModal isOpen={isModalOpen} onClose={closeModal} />
    </footer>
  );
}

export default Footer;