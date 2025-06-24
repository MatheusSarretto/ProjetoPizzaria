
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContextDefinition';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { useSearch } from '../context/SearchContextDefinition';
import './Header.css';

function MenuCompactNavigator({ handleScrollToCategory }) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const { searchTerm, setSearchTerm, activeCategory } = useSearch();

  const menuRef = useRef(null);
  const toggleButtonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) &&
          toggleButtonRef.current && !toggleButtonRef.current.contains(event.target)) {
        setIsMenuExpanded(false);
      }
    };

    if (isMenuExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuExpanded]);


  const handleLinkClick = (id) => {
    handleScrollToCategory(id);
    setIsMenuExpanded(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const [menuCategoriesLocal, setMenuCategoriesLocal] = useState([]);

  const fetchMenuCategoriesLocal = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      if (!response.ok) throw new Error('Failed to fetch products for categories.');
      const data = await response.json();
      
      const grouped = data.reduce((acc, product) => {
        const category = product.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push(product);
        return acc;
      }, {});

      const categories = Object.keys(grouped).map(key => ({
        id: key,
        name: key.charAt(0).toUpperCase() + key.slice(1)
      })).sort((a, b) => a.name.localeCompare(b.name));
      setMenuCategoriesLocal(categories);
    } catch (err) {
      console.error("Erro ao buscar categorias para o menu expansível:", err);
    }
  }, []);

  useEffect(() => {
    fetchMenuCategoriesLocal();
  }, [fetchMenuCategoriesLocal]);


  return (
    <div className="compact-menu-nav">
      <button className="menu-toggle-button" onClick={() => setIsMenuExpanded(!isMenuExpanded)} ref={toggleButtonRef}>
        <span className="current-category-name">{activeCategory || 'Menu'}</span>
      </button>

      {isMenuExpanded && (
        <div className="expanded-menu-overlay">
          <div className="expanded-menu" onClick={(e) => e.stopPropagation()} ref={menuRef}> 
            {menuCategoriesLocal.map((category) => (
              <a
                key={category.id}
                onClick={() => handleLinkClick(category.id)}
                className="expanded-menu-item"
              >
                {category.name}
              </a>
            ))}
          </div>
        </div>
      )}
      <input
        type="text"
        placeholder="Buscar no menu..."
        className="compact-search-bar"
        value={searchTerm}
        onChange={handleSearchChange}
      />
    </div>
  );
}

function Header({ isScrolledToMenu }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openingTimeStr] = useState('17:00');
  const [closingTimeStr] = useState('01:00');

  const { getCartItemCount, getCartTotalPrice } = useCart();
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const [openHour, openMinute] = openingTimeStr.split(':').map(Number);
    const [closeHour, closeMinute] = closingTimeStr.split(':').map(Number);
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const openTimeInMinutes = openHour * 60 + openMinute;
    const closeTimeInMinutes = closeHour * 60 + closeMinute;
    let pizzaIsOpen = false;
    if (openTimeInMinutes <= closeTimeInMinutes) {
      if (currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes) {
        pizzaIsOpen = true;
      }
    } else {
      if (currentTimeInMinutes >= openTimeInMinutes || currentTimeInMinutes < closeTimeInMinutes) {
        pizzaIsOpen = true;
      }
    }
    setIsOpen(pizzaIsOpen);
  }, [openingTimeStr, closingTimeStr]);

  const handleScrollToCategory = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = document.querySelector('.header.scrolled')?.offsetHeight || 0;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - headerOffset - 20,
        behavior: 'smooth'
      });
    }
  };

  const cartItemCount = getCartItemCount();
  const cartTotalPrice = getCartTotalPrice();

  const headerClasses = `header ${isScrolledToMenu && location.pathname === '/' ? 'scrolled' : ''}`;

  return (
    <header className={headerClasses}>
      {(!isScrolledToMenu || location.pathname !== '/') ? (
        <>
          <div className="header-left">
            <Link to="/" className="logo-link">
              <img src="/logo.png" alt="Logo da Pizzaria" className="logo" />
              <h1>Pizzaria Bom Noite</h1>
            </Link>
            <div className="business-info">
              <span className="business-hours">
                {isOpen ? `Fecha às ${closingTimeStr}` : `Abre às ${openingTimeStr}`}
              </span>
              <span className="address-info">
                Rua Pedro Vicente, 625 - SP
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="header-left compact-header-left">
          <MenuCompactNavigator
            handleScrollToCategory={handleScrollToCategory}
          />
        </div>
      )}

      <div className="header-right">
        <Link to={user ? "/profile" : "/login"} className="icon-link profile-info-link">
          <img src="/icons/profile-icon.png" alt="Perfil" className="profile-icon" />
          {user ? (
            <span className="profile-text">Olá, {user.name}</span>
          ) : (
            <span className="profile-text">Login / Cadastro</span>
          )}
        </Link>
        <Link to="/cart" className="icon-link cart-link">
          <img src="/icons/cart-icon.png" alt="Carrinho" className="icon" />
          <div className="cart-info">
            {cartItemCount > 0 && <span className="cart-item-count">{cartItemCount} itens</span>}
            <span className="cart-total-price">R$ {cartTotalPrice.toFixed(2)}</span>
          </div>
        </Link>
      </div>
    </header>
  );
}

export default Header;