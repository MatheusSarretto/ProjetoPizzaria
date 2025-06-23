
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './PromotionCarousel.css';

const promotionImages = [
  '/promotions/promo1.png',
  '/promotions/promo2.png',
  '/promotions/promo3.png',
];

const AUTO_SLIDE_INTERVAL = 5000;

function PromotionCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentTranslate, setCurrentTranslate] = useState(0);

  const containerRef = useRef(null); 
  const intervalRef = useRef(null); 

  const getSlideWidth = useCallback(() => {
    return containerRef.current ? containerRef.current.clientWidth : 0;
  }, []); 

  const goToNextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === promotionImages.length - 1 ? 0 : prevIndex + 1
    );
  }, [promotionImages.length]);

  const resetAutoSlide = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(goToNextSlide, AUTO_SLIDE_INTERVAL);
  }, [goToNextSlide]);

  useEffect(() => {
    resetAutoSlide();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [resetAutoSlide]);

  const handleStart = useCallback((e) => {
    setIsDragging(true);
    setStartX(e.clientX || e.touches[0].clientX);
    resetAutoSlide();
  }, [resetAutoSlide]);

  const handleMove = useCallback((e) => {
    if (!isDragging) return;

    const currentX = e.clientX || e.touches[0].clientX;
    const diff = currentX - startX;
    
    setCurrentTranslate(-currentIndex * getSlideWidth() + diff);

    e.preventDefault();
  }, [isDragging, startX, currentIndex, getSlideWidth]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    const slideWidth = getSlideWidth();
    const threshold = slideWidth / 4;

    const movedBy = currentTranslate - (-currentIndex * slideWidth);

    let newIndex = currentIndex;
    if (movedBy < -threshold) { 
      newIndex = Math.min(currentIndex + 1, promotionImages.length - 1);
    } else if (movedBy > threshold) { 
      newIndex = Math.max(currentIndex - 1, 0);
    }
    
    setCurrentIndex(newIndex);
    setCurrentTranslate(-newIndex * slideWidth);

    resetAutoSlide();
  }, [currentTranslate, currentIndex, promotionImages.length, getSlideWidth, resetAutoSlide]);

  useEffect(() => {
    const slideWidth = getSlideWidth();
    if (!isDragging) {
      setCurrentTranslate(-currentIndex * slideWidth);
    }
  }, [currentIndex, getSlideWidth, isDragging]);

  useEffect(() => {
    const handleResize = () => {
      setCurrentTranslate(-currentIndex * getSlideWidth());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentIndex, getSlideWidth]);

  const sliderStyles = {
    transform: `translateX(${currentTranslate}px)`,
    transition: isDragging ? 'none' : 'transform 0.5s ease-out', 
    width: `${promotionImages.length * getSlideWidth()}px`,
  };

  return (
    <div
      className={`carousel-container ${isDragging ? 'is-dragging' : ''}`}
      ref={containerRef} 
      onMouseDown={handleStart}
      onMouseLeave={() => { isDragging && handleEnd(); }} 
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    >
      <div className="carousel-slider" style={sliderStyles}>
        {promotionImages.map((image, index) => (
          <img
            key={index}
            src={image}
            alt={`Promoção ${index + 1}`}
            className="carousel-image"
            draggable="false"
          />
        ))}
      </div>
      <div className="carousel-dots">
        {promotionImages.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => {
              setCurrentIndex(index);
              resetAutoSlide();
            }}
          ></span>
        ))}
      </div>
    </div>
  );
}

export default PromotionCarousel;