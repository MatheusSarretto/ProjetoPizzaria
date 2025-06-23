
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../profile-subpages/ProfileSubpage.css';

function EditProfile() {
  const { user, token, login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [cellphone, setCellphone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setCpf(user.cpf || '');
      setCellphone(user.cellphone || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');

    if (password && password !== confirmPassword) {
      setMessage('As novas senhas não coincidem.');
      setMessageType('error');
      return;
    }

    try {
      const updatedData = { name, email, cellphone };
      if (password) {
        updatedData.password = password;
      }

      const response = await fetch(`http://localhost:5000/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao atualizar perfil.');
      }

      setMessage('Perfil atualizado com sucesso!');
      setMessageType('success');
      setPassword('');
      setConfirmPassword('');

      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        login(data.user.email, password || user.password_hash_dummy_for_login_if_not_changed);
        window.location.reload();
      }


    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      setMessage(err.message || 'Erro desconhecido ao atualizar perfil.');
      setMessageType('error');
    }
  };

  return (
    <div className="profile-subpage-content">
      <h3>Editar Perfil</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="edit-name">Nome:</label>
          <input type="text" id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="edit-email">Email:</label>
          <input type="email" id="edit-email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="edit-cpf">CPF:</label>
          <input type="text" id="edit-cpf" value={cpf} readOnly disabled />
        </div>
        <div className="form-group">
          <label htmlFor="edit-cellphone">Celular:</label>
          <input type="text" id="edit-cellphone" value={cellphone} onChange={(e) => setCellphone(e.target.value)} maxLength="15" required />
        </div>
        <div className="form-group">
          <label htmlFor="edit-password">Nova Senha (opcional):</label>
          <input type="password" id="edit-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="edit-confirmPassword">Confirmar Nova Senha:</label>
          <input type="password" id="edit-confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <button type="submit" className="submit-button">Atualizar Perfil</button>
        {message && <p className={`message-info ${messageType}`}>{message}</p>}
      </form>
    </div>
  );
}

export default EditProfile;