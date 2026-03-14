import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTicket } from '../../context/TicketContext';
import { trainApi } from '../../services/api';
import OrderSteps from '../../components/OrderSteps/OrderSteps';
import PaymentMethod from '../../components/PaymentMethod/PaymentMethod';
import './PaymentPage.css';

function PaymentPage() {
  const navigate = useNavigate();
  const { 
    selectedTrain,
    selectedWagon,
    selectedSeats,
    passengers,
    total,
    setOrder,
    cardData,
    setCardData,
    user
  } = useTicket();

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [agreement, setAgreement] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cardFormValid, setCardFormValid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState(null);

  // Проверка наличия всех необходимых данных
  useEffect(() => {
    if (!selectedTrain || !selectedWagon || selectedSeats.length === 0 || passengers.length === 0) {
      navigate('/seats');
    }
  }, [selectedTrain, selectedWagon, selectedSeats.length, passengers.length, navigate]);

  // Проверка валидности данных карты
  useEffect(() => {
    if (paymentMethod === 'card') {
      const isValid = validateCardData();
      setCardFormValid(isValid);
    } else {
      setCardFormValid(true);
    }
  }, [paymentMethod, cardData]);

  const validateCardData = () => {
    if (!cardData.number || cardData.number.replace(/\s/g, '').length !== 16) {
      return false;
    }

    if (!cardData.expiry || !/^\d{2}\/\d{2}$/.test(cardData.expiry)) {
      return false;
    }

    // Проверка срока действия карты
    const [month, year] = cardData.expiry.split('/');
    const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
    const currentDate = new Date();
    if (expiryDate < currentDate) {
      return false;
    }

    if (!cardData.cvv || cardData.cvv.length !== 3) {
      return false;
    }

    if (!cardData.holder || !cardData.holder.trim()) {
      return false;
    }

    return true;
  };

  const formatPrice = (price) => {
    return price ? price.toLocaleString('ru-RU') : '0';
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateTimeString) => {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateTimeString;
    }
  };

  const getPassengerTypeCount = () => {
    const adults = passengers.filter(p => p.type === 'adult').length;
    const children = passengers.filter(p => p.type === 'child').length;
    return { adults, children };
  };

  const calculateDiscount = () => {
    const { children } = getPassengerTypeCount();
    if (!selectedWagon?.price || children === 0) return 0;
    
    const childPrice = Math.round(selectedWagon.price * 0.4);
    const adultPrice = selectedWagon.price;
    const regularTotal = (adultPrice + childPrice) * passengers.length;
    return regularTotal - total;
  };

  // Функция создания заказа
  const createOrder = async (paymentMethod) => {
    try {
      console.log('Создаем заказ с данными:', {
        train: selectedTrain,
        wagon: selectedWagon,
        seats: selectedSeats,
        passengers: passengers.length,
        total: total
      });

      // Мок-заказ для демонстрации
      const mockOrder = {
        id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        train_id: selectedTrain.id || selectedTrain.number,
        wagon_id: selectedWagon.id || selectedWagon.number,
        seats: selectedSeats,
        passengers: passengers,
        total: total,
        payment_method: paymentMethod === 'card' ? 'online' : 'cash',
        status: 'pending',
        created_at: new Date().toISOString(),
        departure_time: selectedTrain.departureTime,
        arrival_time: selectedTrain.arrivalTime,
        from_station: selectedTrain.fromStation,
        to_station: selectedTrain.toStation
      };

      console.log('Создан заказ:', mockOrder);
      
      // Имитируем задержку API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return mockOrder;
    } catch (error) {
      console.error('Ошибка при создании заказа:', error);
      
      // Fallback заказ
      const fallbackOrder = {
        id: `ORD-FALLBACK-${Date.now()}`,
        train_id: selectedTrain.id || selectedTrain.number,
        wagon_id: selectedWagon.id || selectedWagon.number,
        seats: selectedSeats,
        passengers: passengers,
        total: total,
        payment_method: paymentMethod === 'card' ? 'online' : 'cash',
        status: 'pending',
        created_at: new Date().toISOString(),
        departure_time: selectedTrain.departureTime,
        arrival_time: selectedTrain.arrivalTime
      };
      
      console.log('Используем заказ по умолчанию:', fallbackOrder);
      return fallbackOrder;
    }
  };

  // Симуляция платежа
  const processPayment = async () => {
    try {
      // Симуляция задержки обработки платежа
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        success: true,
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Ошибка при обработке платежа:', error);
      throw new Error('Ошибка обработки платежа. Пожалуйста, попробуйте еще раз или выберите другой способ оплаты.');
    }
  };

  const handlePayment = async () => {
    if (!agreement) {
      setError('Необходимо согласиться с условиями предоставления услуги');
      return;
    }

    if (paymentMethod === 'card' && !cardFormValid) {
      setError('Заполните все поля данных карты корректно');
      return;
    }

    setLoading(true);
    setIsProcessing(true);
    setError('');

    try {
      // Создаем заказ
      const orderResponse = await createOrder(paymentMethod);
      
      // Если оплата картой - обрабатываем платеж
      if (paymentMethod === 'card') {
        const paymentResult = await processPayment();
        
        if (!paymentResult.success) {
          throw new Error('Платеж не прошел. Пожалуйста, проверьте данные карты или попробуйте позже.');
        }
      }

      // Создаем объект заказа для контекста
      const order = {
        id: orderResponse.id,
        train: selectedTrain,
        wagon: selectedWagon,
        seats: selectedSeats,
        passengers: passengers,
        paymentMethod: paymentMethod,
        total: total,
        date: new Date().toISOString(),
        status: paymentMethod === 'card' ? 'paid' : 'pending',
        orderData: orderResponse
      };

      // Сохраняем заказ в контекст
      setOrder(order);
      
      // Задержка для лучшего UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Переходим на страницу подтверждения
      navigate('/confirmation');
    } catch (err) {
      console.error('Ошибка в процессе оплаты:', err);
      setError(err.message || 'Произошла ошибка при создании заказа. Пожалуйста, попробуйте еще раз.');
      
      if (orderId) {
        console.log('Заказ создан, но платеж не прошел. ID заказа:', orderId);
      }
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const { adults, children } = getPassengerTypeCount();
  const discount = calculateDiscount();

  const handleCardDataChange = (newCardData) => {
    setCardData(newCardData);
  };

  const canProceed = agreement && (paymentMethod !== 'card' || cardFormValid);

  // Если нет данных для оплаты, показываем сообщение
  if (!selectedTrain || !selectedWagon) {
    return (
      <div className="payment-page error-state">
        <OrderSteps />
        <div className="payment-page__container">
          <div className="payment-error-message">
            <h2>Данные заказа не найдены</h2>
            <p>Пожалуйста, вернитесь и завершите выбор мест и пассажиров</p>
            <button 
              className="payment-error-back-btn"
              onClick={() => navigate('/seats')}
            >
              ← Вернуться к выбору мест
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <OrderSteps />

      <div className="payment-page__container">
        <main className="payment-page__main">
          {/* Информация о заказе */}
          <div className="order-summary">
            <h2 className="order-summary__title">Сводка заказа</h2>
            
            <div className="order-summary__content">
              {/* Информация о поездке */}
              <div className="order-summary__section">
                <h3 className="order-summary__section-title">Детали поездки</h3>
                
                <div className="order-summary__trip">
                  <div className="order-summary__trip-direction">
                    <div className="order-summary__trip-date">
                      {formatDate(selectedTrain.departureTime)}
                    </div>
                    <div className="order-summary__trip-info">
                      <div className="order-summary__train-number">
                        Поезд №{selectedTrain.number}
                      </div>
                      <div className="order-summary__train-name">
                        {selectedTrain.name || `${selectedTrain.fromCity} → ${selectedTrain.toCity}`}
                      </div>
                    </div>
                    <div className="order-summary__trip-route">
                      <div className="order-summary__route-stations">
                        <div className="order-summary__station">
                          <span className="order-summary__station-city">{selectedTrain.fromCity}</span>
                          <span className="order-summary__station-name">{selectedTrain.fromStation}</span>
                        </div>
                        <div className="order-summary__route-arrow">→</div>
                        <div className="order-summary__station">
                          <span className="order-summary__station-city">{selectedTrain.toCity}</span>
                          <span className="order-summary__station-name">{selectedTrain.toStation}</span>
                        </div>
                      </div>
                      <div className="order-summary__route-time">
                        {formatTime(selectedTrain.departureTime)} - {formatTime(selectedTrain.arrivalTime)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Информация о пассажирах */}
              <div className="order-summary__section">
                <h3 className="order-summary__section-title">Пассажиры</h3>
                
                <div className="order-summary__passengers">
                  {passengers.map((passenger, index) => (
                    <div key={index} className="order-summary__passenger-item">
                      <div className="order-summary__passenger-name">
                        {passenger.lastName} {passenger.firstName} {passenger.middleName || ''}
                        <span className="order-summary__passenger-type">
                          {passenger.type === 'adult' ? ' (взрослый)' : ' (ребенок)'}
                        </span>
                      </div>
                      <div className="order-summary__passenger-price">
                        {formatPrice(passenger.type === 'adult' ? selectedWagon.price : Math.round(selectedWagon.price * 0.6))} ₽
                      </div>
                    </div>
                  ))}
                  
                  {discount > 0 && (
                    <div className="order-summary__discount">
                      <span>Скидка на детские билеты:</span>
                      <span className="order-summary__discount-amount">
                        -{formatPrice(discount)} ₽
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Информация о местах */}
              <div className="order-summary__section">
                <h3 className="order-summary__section-title">Места в вагоне</h3>
                
                <div className="order-summary__seats">
                  <div className="order-summary__wagon-info">
                    <span>Вагон №{selectedWagon.number}</span>
                    <span className="order-summary__wagon-type">
                      {selectedWagon.name || 
                       (selectedWagon.type === 'first' ? 'Люкс' :
                        selectedWagon.type === 'second' ? 'Купе' :
                        selectedWagon.type === 'third' ? 'Плацкарт' : 'Сидячий')}
                    </span>
                  </div>
                  
                  <div className="order-summary__seats-list">
                    <span>Места:</span>
                    <span className="order-summary__seats-numbers">
                      {selectedSeats.sort((a, b) => a - b).join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Итоговая стоимость */}
            <div className="order-summary__total">
              <div className="order-summary__total-label">Общая стоимость:</div>
              <div className="order-summary__total-price">
                {formatPrice(total)} ₽
              </div>
            </div>
          </div>

          {/* Способ оплаты */}
          <div className="payment-methods-section">
            <PaymentMethod
              selectedMethod={paymentMethod}
              onSelect={setPaymentMethod}
              cardData={cardData}
              onCardDataChange={handleCardDataChange}
            />
          </div>

          {/* Соглашение */}
          <div className="payment-agreement">
            <label className="payment-agreement__checkbox">
              <input
                type="checkbox"
                checked={agreement}
                onChange={(e) => setAgreement(e.target.checked)}
                disabled={isProcessing}
                className="payment-agreement__input"
              />
              <span className="payment-agreement__text">
                Я согласен с <a href="#" className="payment-agreement__link">условиями предоставления услуги</a>, 
                <a href="#" className="payment-agreement__link"> политикой конфиденциальности</a> и даю согласие на 
                обработку персональных данных
              </span>
            </label>
          </div>

          {/* Ошибка */}
          {error && (
            <div className="payment-error">
              <div className="payment-error__icon">❌</div>
              <div className="payment-error__text">{error}</div>
            </div>
          )}

          {/* Индикатор обработки */}
          {isProcessing && (
            <div className="payment-processing">
              <div className="payment-processing__spinner"></div>
              <div className="payment-processing__text">
                {paymentMethod === 'card' 
                  ? 'Обработка платежа... Пожалуйста, не закрывайте страницу'
                  : 'Создание заказа...'}
              </div>
              <div className="payment-processing__note">
                Это займет несколько секунд
              </div>
            </div>
          )}

          {/* Кнопка оплаты */}
          <div className="payment-action">
            <button
              className="payment-action__button"
              onClick={handlePayment}
              disabled={!canProceed || loading || isProcessing}
            >
              {loading || isProcessing ? (
                <>
                  <span className="payment-action__spinner"></span>
                  {paymentMethod === 'card' ? 'Обработка платежа...' : 'Создание заказа...'}
                </>
              ) : (
                `Оплатить ${formatPrice(total)} ₽`
              )}
            </button>
            
            <p className="payment-action__hint">
              {paymentMethod === 'card' && !cardFormValid && (
                <span className="payment-action__warning">
                  ⚠️ Заполните все поля данных карты корректно
                </span>
              )}
              {!agreement && (
                <span className="payment-action__warning">
                  ⚠️ Необходимо согласиться с условиями
                </span>
              )}
              {canProceed && !loading && (
                'Нажимая кнопку «Оплатить», вы подтверждаете бронирование и оплату билетов'
              )}
            </p>
            
            <button
              className="payment-action__back"
              onClick={() => navigate('/passengers')}
              disabled={loading || isProcessing}
            >
              ← Вернуться к данным пассажиров
            </button>
          </div>
        </main>

        {/* Боковая панель */}
        <aside className="payment-page__sidebar">
          {/* Информация о безопасности */}
          <div className="payment-security">
            <h3 className="payment-security__title">Безопасность платежей</h3>
            
            <div className="payment-security__features">
              <div className="payment-security__feature">
                <div className="payment-security__feature-icon">🔒</div>
                <div className="payment-security__feature-text">
                  <div className="payment-security__feature-title">SSL-шифрование</div>
                  <div className="payment-security__feature-description">
                    Все данные защищены 256-битным шифрованием
                  </div>
                </div>
              </div>
              
              <div className="payment-security__feature">
                <div className="payment-security__feature-icon">🛡️</div>
                <div className="payment-security__feature-text">
                  <div className="payment-security__feature-title">3D Secure</div>
                  <div className="payment-security__feature-description">
                    Дополнительная проверка для онлайн-платежей
                  </div>
                </div>
              </div>
              
              <div className="payment-security__feature">
                <div className="payment-security__feature-icon">🏦</div>
                <div className="payment-security__feature-text">
                  <div className="payment-security__feature-title">PCI DSS</div>
                  <div className="payment-security__feature-description">
                    Соответствие международным стандартам безопасности
                  </div>
                </div>
              </div>
            </div>

            <div className="payment-security__logos">
              <div className="payment-security__logo visa">VISA</div>
              <div className="payment-security__logo mastercard">MasterCard</div>
              <div className="payment-security__logo mir">МИР</div>
            </div>
          </div>

          {/* Информация о возврате */}
          <div className="payment-refund">
            <h3 className="payment-refund__title">Условия возврата</h3>
            
            <div className="payment-refund__content">
              <div className="payment-refund__item">
                <div className="payment-refund__icon">💸</div>
                <div className="payment-refund__text">
                  Полный возврат за 24 часа до отправления
                </div>
              </div>
              
              <div className="payment-refund__item">
                <div className="payment-refund__icon">⏰</div>
                <div className="payment-refund__text">
                  Частичный возврат за 3 часа до отправления
                </div>
              </div>
              
              <div className="payment-refund__item">
                <div className="payment-refund__icon">📧</div>
                <div className="payment-refund__text">
                  Возврат на карту в течение 3-10 банковских дней
                </div>
              </div>
            </div>
          </div>

          {/* Поддержка */}
          <div className="payment-support">
            <h3 className="payment-support__title">Нужна помощь?</h3>
            
            <div className="payment-support__contacts">
              <div className="payment-support__contact">
                <div className="payment-support__contact-icon">📞</div>
                <div className="payment-support__contact-info">
                  <div className="payment-support__contact-label">Телефон поддержки</div>
                  <a href="tel:88000000000" className="payment-support__contact-value">
                    8 (800) 000-00-00
                  </a>
                </div>
              </div>
              
              <div className="payment-support__contact">
                <div className="payment-support__contact-icon">💬</div>
                <div className="payment-support__contact-info">
                  <div className="payment-support__contact-label">Онлайн-чат</div>
                  <a href="#" className="payment-support__contact-value">
                    Открыть чат
                  </a>
                </div>
              </div>
              
              <div className="payment-support__contact">
                <div className="payment-support__contact-icon">🕒</div>
                <div className="payment-support__contact-info">
                  <div className="payment-support__contact-label">Время работы</div>
                  <div className="payment-support__contact-value">
                    Круглосуточно, 7 дней в неделю
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default PaymentPage;
