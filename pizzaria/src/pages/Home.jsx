import React from 'react';
import PromotionCarousel from '../components/PromotionCarousel';
import MenuSection from '../components/MenuSection';
import Footer from '../components/Footer';

function Home() {
  return (
    <div>
      <PromotionCarousel />
      <div id="menu-start-point"> 
        <MenuSection />
      </div>
      <Footer />
    </div>
  );
}

export default Home;