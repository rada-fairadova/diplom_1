import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogoClick = () => {
    navigate('/');
    window.scrollTo(0, 0);
  };

  const handleNavClick = (e, target) => {
    e.preventDefault();
    if (window.location.pathname === '/') {
      // На главной странице - скроллим к секции
      const element = document.getElementById(target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // На других страницах - переходим на главную с якорем
      navigate(`/#${target}`);
    }
    setIsMenuOpen(false);
  };

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
