
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Profile from './pages/Profile'; 
import Register from './pages/Register';
import Login from './pages/Login';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderAdmin from './pages/OrderAdmin';
import ProductAdmin from './pages/ProductAdmin';

import EditProfile from './pages/profile-subpages/EditProfile';
import MyOrders from './pages/profile-subpages/MyOrders';
import MyAddresses from './pages/profile-subpages/MyAddresses';
import MyCards from './pages/profile-subpages/MyCards';
import LoyaltyPrograms from './pages/profile-subpages/LoyaltyPrograms';
import ContactUs from './pages/profile-subpages/ContactUs';

import { CartProvider } from './context/CartProvider';
import { AuthProvider } from './context/AuthContext';
import { SearchProvider } from './context/SearchProvider';

function App() {
  const [isScrolledToMenu, setIsScrolledToMenu] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== '/') {
      setIsScrolledToMenu(false);
      return;
    }

    const handleScroll = () => {
      const menuSection = document.getElementById('menu-start-point');
      if (menuSection) {
        const menuTop = menuSection.getBoundingClientRect().top;
        setIsScrolledToMenu(menuTop <= 100);
      } else {
        setIsScrolledToMenu(window.scrollY > 300);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);

  return (
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <Header isScrolledToMenu={isScrolledToMenu} />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />

              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />

              <Route path="/profile" element={<Profile />}>
                <Route index element={<EditProfile />} /> 
                <Route path="edit" element={<EditProfile />} />
                <Route path="orders" element={<MyOrders />} />
                <Route path="addresses" element={<MyAddresses />} />
                <Route path="cards" element={<MyCards />} />
                <Route path="loyalty" element={<LoyaltyPrograms />} />
                <Route path="contact" element={<ContactUs />} />
              </Route>

              <Route path="/admin" element={<OrderAdmin />} />
              <Route path="/admin/products" element={<ProductAdmin />} />
            </Routes>
          </main>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;