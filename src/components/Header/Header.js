import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Header.css';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogoClick = () => {
    navigate('/');
    window.scrollTo(0, 0);
  };

  // Функция для скролла к секции
  const scrollToSection = useCallback((target) => {
    // Небольшая задержка, чтобы DOM успел обновиться
    setTimeout(() => {
      const element = document.getElementById(target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }, []);

  // Обработчик хеша при загрузке главной страницы
  useEffect(() => {
    if (location.pathname === '/' && location.hash) {
      const target = location.hash.replace('#', '');
      scrollToSection(target);
    }
  }, [location, scrollToSection]);

  const handleNavClick = (e, target) => {
    e.preventDefault();
    
    if (window.location.pathname === '/') {
      // На главной странице - просто скроллим к секции
      scrollToSection(target);
    } else {
      // На других страницах - переходим на главную с сохранением якоря
      navigate('/', { state: { scrollTo: target } });
    }
    
    setIsMenuOpen(false);
  };

  // Обработчик для скролла после перехода с другой страницы
  useEffect(() => {
    if (location.pathname === '/' && location.state?.scrollTo) {
      const target = location.state.scrollTo;
      // Очищаем state, чтобы не скроллить повторно при обновлении
      window.history.replaceState({}, document.title);
      scrollToSection(target);
    }
  }, [location, scrollToSection]);

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__logo" onClick={handleLogoClick}>
          <div className="header__logo-text">ЛОГО</div>
        </div>

        <button 
          className={`header__menu-button ${isMenuOpen ? 'header__menu-button--active' : ''}`}
          onClick={toggleMenu}
          aria-label="Меню"
        >
          <span className="header__menu-icon"></span>
        </button>

        <nav className={`header__nav ${isMenuOpen ? 'header__nav--open' : ''}`}>
          <ul className="header__nav-list">
            <li className="header__nav-item">
              <a 
                href="#about" 
                className="header__nav-link"
                onClick={(e) => handleNavClick(e, 'about')}
              >
                <span className="header__nav-text">О нас</span>
              </a>
            </li>
            <li className="header__nav-item">
              <a 
                href="#how-it-works" 
                className="header__nav-link"
                onClick={(e) => handleNavClick(e, 'how-it-works')}
              >
                <span className="header__nav-text">Как это работает</span>
              </a>
            </li>
            <li className="header__nav-item">
              <a 
                href="#reviews" 
                className="header__nav-link"
                onClick={(e) => handleNavClick(e, 'reviews')}
              >
                <span className="header__nav-text">Отзывы</span>
              </a>
            </li>
            <li className="header__nav-item">
              <a 
                href="#footer-contacts" 
                className="header__nav-link"
                onClick={(e) => handleNavClick(e, 'footer-contacts')}
              >
                <span className="header__nav-text">Контакты</span>
              </a>
            </li>
            <li className="header__nav-item header__nav-item--mobile">
              <Link to="/search" className="header__nav-link" onClick={() => setIsMenuOpen(false)}>
                <span className="header__nav-text">Поиск билетов</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;
