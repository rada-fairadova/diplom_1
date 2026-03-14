import React, { useState } from 'react';
import './PaymentMethod.css';

const paymentMethods = [
  {
    id: 'card',
    name: 'Банковской картой',
    icon: '💳',
    description: 'Visa, Mastercard, Мир',
    commission: 0
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: '🌐',
    description: 'Международная платежная система',
    commission: 2
  },
  {
    id: 'qiwi',
    name: 'QIWI Wallet',
    icon: '💰',
    description: 'Электронный кошелек',
    commission: 1.5
  },
  {
    id: 'cash',
    name: 'Наличными',
    icon: '💵',
    description: 'Оплата в кассе вокзала',
    commission: 0
  },
  {
    id: 'online',
    name: 'Онлайн',
    icon: '⚡',
    description: 'Сбербанк Онлайн, Тинькофф',
    commission: 0
  }
];

function PaymentMethod({ selectedMethod, onSelect, cardData, onCardDataChange }) {
  const [cardErrors, setCardErrors] = useState({});

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Форматирование номера карты
    if (name === 'number') {
      formattedValue = value.replace(/\D/g, '').slice(0, 16);
      if (formattedValue.length > 0) {
        formattedValue = formattedValue.match(/.{1,4}/g).join(' ');
      }
    }

    // Форматирование срока действия
    if (name === 'expiry') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2);
      }
    }

    // Форматирование CVV
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 3);
    }

    // Обновляем данные через родительский компонент
    if (onCardDataChange) {
      const updatedData = { ...cardData, [name]: formattedValue };
      onCardDataChange(updatedData);
    }

    // Очищаем ошибку для этого поля
    if (cardErrors[name]) {
      setCardErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateCard = () => {
    const errors = {};

    if (!cardData.number || cardData.number.replace(/\s/g, '').length !== 16) {
      errors.number = 'Введите корректный номер карты';
    }

    if (!cardData.expiry || !/^\d{2}\/\d{2}$/.test(cardData.expiry)) {
      errors.expiry = 'Введите срок действия (ММ/ГГ)';
    }

    if (!cardData.cvv || cardData.cvv.length !== 3) {
      errors.cvv = 'Введите CVV код';
    }

    if (!cardData.holder.trim()) {
      errors.holder = 'Введите имя держателя карты';
    }

    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedMethod === 'card') {
      const errors = validateCard();
      if (Object.keys(errors).length === 0) {
        console.log('Card data:', cardData);
        // Здесь отправка данных на сервер
      } else {
        setCardErrors(errors);
      }
    }
  };

  return (
    <div className="payment-method">
      <h3 className="payment-method__title">Способ оплаты</h3>
      
      <div className="payment-method__options">
        {paymentMethods.map(method => (
          <div
            key={method.id}
            className={`payment-method__option ${selectedMethod === method.id ? 'payment-method__option--selected' : ''}`}
            onClick={() => onSelect(method.id)}
          >
            <div className="payment-method__option-header">
              <span className="payment-method__option-icon">{method.icon}</span>
              <div className="payment-method__option-info">
                <div className="payment-method__option-name">{method.name}</div>
                <div className="payment-method__option-description">
                  {method.description}
                </div>
              </div>
            </div>
            
            <div className="payment-method__option-commission">
              {method.commission > 0 ? (
                <span className="payment-method__commission-badge">
                  Комиссия {method.commission}%
                </span>
              ) : (
                <span className="payment-method__commission-free">
                  Без комиссии
                </span>
              )}
            </div>
            
            <div className="payment-method__option-radio">
              <div className={`payment-method__radio ${selectedMethod === method.id ? 'payment-method__radio--checked' : ''}`}>
                {selectedMethod === method.id && (
                  <div className="payment-method__radio-dot"></div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedMethod === 'card' && (
        <form className="payment-method__card-form" onSubmit={handleSubmit}>
          <h4 className="payment-method__form-title">Данные банковской карты</h4>
          
          <div className="payment-method__form-row">
            <div className="payment-method__form-field">
              <label className="payment-method__form-label">
                Номер карты *
              </label>
              <input
                type="text"
                name="number"
                value={cardData.number}
                onChange={handleCardChange}
                placeholder="0000 0000 0000 0000"
                className={`payment-method__form-input ${cardErrors.number ? 'payment-method__form-input--error' : ''}`}
                maxLength="19"
              />
              {cardErrors.number && (
                <span className="payment-method__form-error">
                  {cardErrors.number}
                </span>
              )}
            </div>
          </div>

          <div className="payment-method__form-row">
            <div className="payment-method__form-field">
              <label className="payment-method__form-label">
                Срок действия *
              </label>
              <input
                type="text"
                name="expiry"
                value={cardData.expiry}
                onChange={handleCardChange}
                placeholder="ММ/ГГ"
                className={`payment-method__form-input ${cardErrors.expiry ? 'payment-method__form-input--error' : ''}`}
                maxLength="5"
              />
              {cardErrors.expiry && (
                <span className="payment-method__form-error">
                  {cardErrors.expiry}
                </span>
              )}
            </div>

            <div className="payment-method__form-field">
              <label className="payment-method__form-label">
                CVV код *
              </label>
              <input
                type="text"
                name="cvv"
                value={cardData.cvv}
                onChange={handleCardChange}
                placeholder="000"
                className={`payment-method__form-input ${cardErrors.cvv ? 'payment-method__form-input--error' : ''}`}
                maxLength="3"
              />
              {cardErrors.cvv && (
                <span className="payment-method__form-error">
                  {cardErrors.cvv}
                </span>
              )}
            </div>
          </div>

          <div className="payment-method__form-row">
            <div className="payment-method__form-field">
              <label className="payment-method__form-label">
                Имя держателя карты *
              </label>
              <input
                type="text"
                name="holder"
                value={cardData.holder}
                onChange={handleCardChange}
                placeholder="IVAN IVANOV"
                className={`payment-method__form-input ${cardErrors.holder ? 'payment-method__form-input--error' : ''}`}
              />
              {cardErrors.holder && (
                <span className="payment-method__form-error">
                  {cardErrors.holder}
                </span>
              )}
            </div>
          </div>

          <div className="payment-method__card-icons">
            <span className="payment-method__card-icon" title="Visa">💳</span>
            <span className="payment-method__card-icon" title="Mastercard">💳</span>
            <span className="payment-method__card-icon" title="Мир">💳</span>
          </div>
        </form>
      )}

      <div className="payment-method__security">
        <div className="payment-method__security-icon">🔒</div>
        <div className="payment-method__security-text">
          <div className="payment-method__security-title">
            Безопасность платежей
          </div>
          <div className="payment-method__security-description">
            Все платежи защищены 256-битным SSL-шифрованием. 
            Мы не храним данные вашей карты.
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentMethod;
