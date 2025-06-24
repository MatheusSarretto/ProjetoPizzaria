
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

function ProductAdmin() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formProduct, setFormProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error("Erro ao buscar produtos para admin:", err);
      setError("Não foi possível carregar os produtos.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchProducts();
    }
  }, [fetchProducts, user]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formProduct),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar produto.');
      }
      setFormProduct({ name: '', description: '', price: '', category: '' });
      fetchProducts();
    } catch (err) {
      console.error("Erro ao criar produto:", err);
      setError(err.message);
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product.id);
    setFormProduct({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
    });
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/products/${editingProduct}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formProduct),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar produto.');
      }
      setEditingProduct(null);
      setFormProduct({ name: '', description: '', price: '', category: '' });
      fetchProducts();
    } catch (err) {
      console.error("Erro ao atualizar produto:", err);
      setError(err.message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir produto.');
      }
      fetchProducts();
    } catch (err) {
      console.error("Erro ao excluir produto:", err);
      setError(err.message);
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
    <div className="admin-container">
      <h2>Painel Administrativo de Produtos</h2>
      {error && <p className="error-message">{error}</p>}

      <div className="product-form-section">
        <h3>{editingProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}</h3>
        <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="product-form">
          <div className="form-group">
            <label htmlFor="name">Nome:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formProduct.name}
              onChange={handleFormChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Descrição:</label>
            <textarea
              id="description"
              name="description"
              value={formProduct.description}
              onChange={handleFormChange}
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="price">Preço:</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formProduct.price}
              onChange={handleFormChange}
              step="0.01"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="category">Categoria:</label>
            <input
              type="text"
              id="category"
              name="category"
              value={formProduct.category}
              onChange={handleFormChange}
              required
            />
          </div>
          <button type="submit" className="action-button primary">
            {editingProduct ? 'Atualizar Produto' : 'Criar Produto'}
          </button>
          {editingProduct && (
            <button
              type="button"
              onClick={() => { setEditingProduct(null); setFormProduct({ name: '', description: '', price: '', category: '' }); }}
              className="action-button secondary"
            >
              Cancelar Edição
            </button>
          )}
        </form>
      </div>

      <div className="product-list-section">
        <h3>Produtos Atuais</h3>
        {loading && <p>Carregando produtos...</p>}
        {!loading && products.length === 0 && <p>Nenhum produto cadastrado.</p>}
        {!loading && products.length > 0 && (
          <table className="products-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Preço</th>
                <th>Categoria</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>{product.description}</td>
                  <td>R$ {product.price.toFixed(2)}</td>
                  <td>{product.category}</td>
                  <td>
                    <button onClick={() => handleEditClick(product)} className="action-button edit">
                      Editar
                    </button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="action-button delete">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ProductAdmin;