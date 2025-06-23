
import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) {
    navigate('/login');
    return null;
  }

  const profileMenuItems = [
    { name: 'Editar Perfil', path: 'edit' },
    { name: 'Meus Pedidos', path: 'orders' },
    { name: 'Meus Endereços', path: 'addresses' },
    { name: 'Meus Cartões', path: 'cards' },
    { name: 'Programas de Fidelidade', path: 'loyalty' },
    { name: 'Fale Conosco', path: 'contact' },
  ];

  return (
    <div className="profile-dashboard-container">
      <div className="profile-header-info">
        <h2>Olá, {user.name}!</h2>
        <p>Email: {user.email}</p>
        <p>CPF: {user.cpf}</p>
        <p>Celular: {user.cellphone}</p>
        <p>Seu perfil é: <strong>{user.role}</strong></p>
        <button onClick={logout} className="logout-button">Sair</button>
      </div>

      <div className="profile-content-area">
        <nav className="profile-sidebar-menu">
          <ul>
            {profileMenuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={location.pathname.includes(`/profile/${item.path}`) ? 'active' : ''}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="profile-details-view">
          {location.pathname === '/profile' && (
            <div className="profile-welcome-message">
              <h3>Bem-vindo ao seu painel de perfil!</h3>
              <p>Selecione uma opção no menu lateral para gerenciar suas informações.</p>
            </div>
          )}
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Profile;