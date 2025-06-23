
import React, { useState, useEffect, useCallback } from 'react';
import MenuItemCarousel from './MenuItemCarousel';
import { useSearch } from '../context/SearchContextDefinition';
import './MenuSection.css';

function MenuSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { searchTerm, setSearchTerm, setActiveCategory } = useSearch();

  const categoryRefs = React.useRef({});

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/products');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error("Erro ao buscar produtos:", err);
      setError("Não foi possível carregar o menu. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setActiveCategory(entry.target.dataset.categoryName);
          }
        });
      },
      { threshold: [0.5, 0.8] }
    );

    const currentCategoryRefs = categoryRefs.current;
    Object.values(currentCategoryRefs).forEach((ref) => {
      if (ref) {
        observer.observe(ref);
      }
    });

    return () => {
      Object.values(currentCategoryRefs).forEach((ref) => {
        if (ref) {
          observer.unobserve(ref);
        }
      });
      observer.disconnect();
    };
  }, [products, setActiveCategory]);

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

  const groupedProducts = products.reduce((acc, product) => {
    const category = product.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {});

  const menuCategories = Object.keys(groupedProducts).map(key => ({
    id: key,
    name: key.charAt(0).toUpperCase() + key.slice(1)
  })).sort((a, b) => b.name.localeCompare(a.name));

  const currentSearchTerm = searchTerm;

  const filteredCategories = menuCategories.filter(category => {
    const itemsInCategory = groupedProducts[category.id] || [];
    if (!currentSearchTerm) return true;
    
    return itemsInCategory.some(item =>
      item.name.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(currentSearchTerm.toLowerCase()))
    );
  });

  return (
    <section className="menu-section">
      <div className="menu-header">
        <input
          type="text"
          placeholder="Pesquisar pizzas ou ingredientes..."
          className="search-bar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <nav className="menu-topics">
          {menuCategories.map((category) => (
            <a
              key={category.id}
              href={`#${category.id}`}
              onClick={(e) => {
                e.preventDefault();
                handleScrollToCategory(category.id);
              }}
              className="menu-topic-item"
            >
              {category.name}
            </a>
          ))}
        </nav>
      </div>

      <div className="menu-content">
        {loading && <p className="loading-message">Carregando menu...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && products.length === 0 && (
          <p className="no-results">Nenhum produto disponível no momento.</p>
        )}

        {!loading && !error && products.length > 0 && (
          filteredCategories.length > 0 ? (
            filteredCategories.map((category) => {
              const itemsToDisplay = groupedProducts[category.id]?.filter(item =>
                item.name.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(currentSearchTerm.toLowerCase()))
              ) || [];

              return (
                <div
                  key={category.id}
                  id={category.id}
                  className="menu-category-block"
                  ref={(el) => (categoryRefs.current[category.id] = el)}
                  data-category-name={category.name}
                >
                  <h2>{category.name}</h2>
                  {itemsToDisplay.length > 0 ? (
                    <MenuItemCarousel items={itemsToDisplay} allPizzas={products} />
                  ) : (
                    <p>Nenhum item encontrado nesta categoria com o termo de pesquisa.</p>
                  )}
                </div>
              );
            })
          ) : (
            currentSearchTerm && <p className="no-results">Nenhum resultado encontrado para "{currentSearchTerm}".</p>
          )
        )}
      </div>
    </section>
  );
}

export default MenuSection;