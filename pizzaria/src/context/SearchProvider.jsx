
import React, { useState } from 'react';
import { SearchContext } from './SearchContextDefinition';

export const SearchProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Pizzas Tradicionais');

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm, activeCategory, setActiveCategory }}>
      {children}
    </SearchContext.Provider>
  );
};