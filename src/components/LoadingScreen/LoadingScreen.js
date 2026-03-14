import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './LoadingScreen.css';

function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    // Показываем загрузку при смене маршрута
    const handleStart = () => {
      setIsLoading(true);
      setProgress(0);
      
      // Анимация прогресса
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + Math.random() * 20;
        });
      }, 200);
      
      return () => clearInterval(interval);
    };

    const handleComplete = () => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 300);
    };

    // Симуляция загрузки при навигации
    handleStart();
    const timer = setTimeout(handleComplete, 1000);

    return () => {
      clearTimeout(timer);
      setIsLoading(false);
      setProgress(0);
    };
  }, [location.pathname]);

  if (!isLoading) return null;

  return (
    <div className="loading-screen">
      <div className="loading-screen__overlay"></div>
      
      <div className="loading-screen__content">
        <div className="loading-screen__logo">
          <div className="loading-screen__logo-text">ЛОГО</div>
        </div>
        
        <div className="loading-screen__title">ИДЕТ ПОИСК</div>
        
        <div className="loading-screen__progress">
          <div 
            className="loading-screen__progress-bar"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="loading-screen__progress-text">
          {Math.min(Math.round(progress), 100)}%
        </div>
        
        <div className="loading-screen__hint">
          Пожалуйста, подождите...
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
