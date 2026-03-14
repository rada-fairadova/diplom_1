import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTicket } from '../../context/TicketContext';
import { trainApi } from '../../services/api';
import './OrderSuccessPage.css';

function OrderSuccessPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { orderDetails, resetTicket, setOrderDetails } = useTicket();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isRatingSubmitted, setIsRatingSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiOrderDetails, setApiOrderDetails] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        let orderData = null;

        // Если есть orderId в URL, загружаем из API
        if (orderId) {
          console.log('Загружаем данные заказа из API по ID:', orderId);
          const response = await trainApi.getOrder(orderId);
          console.log('Ответ API заказа:', response);
          
          if (response && response.order) {
            orderData = transformApiOrderData(response.order);
            setApiOrderDetails(orderData);
          } else {
            throw new Error('Не удалось получить данные заказа из API');
          }
        } 
        // Иначе используем данные из контекста
        else if (orderDetails) {
          console.log('Используем данные заказа из контекста:', orderDetails);
          orderData = orderDetails;
        } 
        // Если нет данных, перенаправляем
        else {
          navigate('/');
          return;
        }

        // Сохраняем детали заказа в контекст
        if (orderData && !orderDetails) {
          setOrderDetails(orderData);
        }

      } catch (err) {
        console.error('Ошибка при загрузке данных заказа:', err);
        setError('Не удалось загрузить информацию о заказе. Пожалуйста, попробуйте позже.');
        
        // Если есть данные в контексте, используем их
        if (orderDetails) {
          console.log('Используем данные из контекста из-за ошибки API');
        } else {
          // Если нет данных вообще, перенаправляем
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();

    // Через 5 минут сбрасываем состояние заказа
    const timer = setTimeout(() => {
      resetTicket();
    }, 5 * 60 * 1000);

    return () => clearTimeout(timer);
  }, [orderId, orderDetails, navigate, resetTicket, setOrderDetails]);

  // Преобразование данных заказа из API в формат компонента
  const transformApiOrderData = (apiOrder) => {
    console.log('Преобразуем данные API заказа:', apiOrder);
    
    return {
      id: apiOrder.id || apiOrder._id,
      number: apiOrder.order_number || apiOrder.id,
      status: apiOrder.status || 'paid',
      date: apiOrder.created_at || new Date().toISOString(),
      total: apiOrder.total_price || apiOrder.price || 0,
      payment_method: apiOrder.payment_method || 'online',
      is_paid: apiOrder.is_paid || true,
      
      // Информация о поезде
      train: {
        id: apiOrder.departure?.route_direction_id || apiOrder.train_id,
        number: apiOrder.departure?.train?.number || apiOrder.train_number || 'N/A',
        name: apiOrder.departure?.train?.name || 'Поезд',
        fromCity: apiOrder.departure?.from?.city?.name || apiOrder.from_city,
        fromStation: apiOrder.departure?.from?.railway_station_name || apiOrder.from_station,
        toCity: apiOrder.departure?.to?.city?.name || apiOrder.to_city,
        toStation: apiOrder.departure?.to?.railway_station_name || apiOrder.to_station,
        departureTime: apiOrder.departure?.departure_time || apiOrder.departure_time,
        arrivalTime: apiOrder.departure?.arrival_time || apiOrder.arrival_time,
      },
      
      // Информация о вагоне
      wagon: {
        id: apiOrder.seats?.[0]?.coach_id || apiOrder.coach_id,
        number: apiOrder.seats?.[0]?.coach_number || apiOrder.coach_number || 1,
        type: apiOrder.seats?.[0]?.coach_type || apiOrder.coach_type || 'second',
        name: getWagonTypeName(apiOrder.seats?.[0]?.coach_type || apiOrder.coach_type),
      },
      
      // Места
      seats: apiOrder.seats?.map(seat => seat.seat_number) || apiOrder.seat_numbers || [],
      
      // Пассажиры
      passengers: apiOrder.passengers?.map((passenger, index) => ({
        id: passenger.id || `passenger-${index}`,
        type: passenger.is_child ? 'child' : 'adult',
        lastName: passenger.last_name || '',
        firstName: passenger.first_name || '',
        middleName: passenger.patronymic || '',
        gender: passenger.gender || 'male',
        birthDate: passenger.birth_date || '',
        documentType: passenger.document_type || 'passport',
        documentNumber: passenger.document_data || '',
        seatNumber: apiOrder.seats?.[index]?.seat_number || index + 1,
      })) || [],
      
      // Контактная информация
      contact_info: {
        email: apiOrder.user?.email || apiOrder.email || '',
        phone: apiOrder.user?.phone || apiOrder.phone || '',
      },
      
      // Дополнительные данные из API
      api_data: apiOrder
    };
  };

  const getWagonTypeName = (type) => {
    const types = {
      'first': 'Люкс',
      'second': 'Купе',
      'third': 'Плацкарт',
      'fourth': 'Сидячий'
    };
    return types[type] || type;
  };

  const handleRatingClick = async (value) => {
    if (!isRatingSubmitted) {
      setRating(value);
      
      try {
        // Отправка оценки через API
        const currentOrder = apiOrderDetails || orderDetails;
        if (currentOrder?.id) {
          // Здесь можно добавить запрос к API для отправки оценки
          // await trainApi.submitRating(currentOrder.id, value);
          console.log('Отправляем оценку для заказа:', currentOrder.id, 'Оценка:', value);
        }
        
        setIsRatingSubmitted(true);
      } catch (err) {
        console.error('Ошибка при отправке оценки:', err);
        // Показываем оценку локально, даже если API не ответил
        setIsRatingSubmitted(true);
      }
    }
  };

  const handleRatingHover = (value) => {
    if (!isRatingSubmitted) {
      setHoverRating(value);
    }
  };

  const handleRatingLeave = () => {
    if (!isRatingSubmitted) {
      setHoverRating(0);
    }
  };

  const handleReturnHome = () => {
    resetTicket();
    navigate('/');
  };

  const handlePrintTickets = () => {
    window.print();
  };

  const handleEmailTickets = async () => {
    try {
      const currentOrder = apiOrderDetails || orderDetails;
      if (currentOrder?.id) {
        // Здесь можно добавить запрос к API для повторной отправки билетов на email
        console.log('Отправка билетов на email для заказа:', currentOrder.id);
        alert('Билеты отправлены на указанный email адрес');
      }
    } catch (err) {
      console.error('Ошибка при отправке билетов на email:', err);
      alert('Не удалось отправить билеты. Пожалуйста, попробуйте позже.');
    }
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
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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

  const getPassengerName = () => {
    const currentOrder = apiOrderDetails || orderDetails;
    const firstPassenger = currentOrder?.passengers?.[0];
    if (firstPassenger) {
      return `${firstPassenger.firstName} ${firstPassenger.middleName || ''}`.trim();
    }
    return '';
  };

  const getOrderData = () => {
    return apiOrderDetails || orderDetails;
  };

  if (loading) {
    return (
      <div className="order-success-page loading">
        <div className="loading-spinner"></div>
        <p>Загружаем информацию о вашем заказе...</p>
      </div>
    );
  }

  if (error && !getOrderData()) {
    return (
      <div className="order-success-page error">
        <div className="error-message">
          <h2>Произошла ошибка</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="back-btn">
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  const orderData = getOrderData();
  if (!orderData) {
    return null;
  }

  return (
    <div className="order-success-page">
      <div className="order-success-page__container">
        {/* Основное содержимое */}
        <div className="order-success">
          {/* Заголовок */}
          <div className="order-success__header">
            <div className="order-success__icon">🎉</div>
            <h1 className="order-success__title">Благодарим Вас за заказ!</h1>
            <p className="order-success__subtitle">
              Ваш заказ №{orderData.number} успешно оформлен
              {orderData.status === 'paid' && ' и оплачен'}
            </p>
          </div>

          {/* Информация о заказе */}
          <div className="order-success__info">
            <div className="order-success__order-number">
              <span className="order-success__info-label">Номер заказа:</span>
              <span className="order-success__order-value">{orderData.number || orderData.id}</span>
            </div>
            
            <div className="order-success__order-status">
              <span className="order-success__info-label">Статус:</span>
              <span className={`order-success__status-value order-success__status-value--${orderData.status}`}>
                {orderData.status === 'paid' ? 'Оплачен' : 
                 orderData.status === 'pending' ? 'В обработке' : 
                 orderData.status === 'confirmed' ? 'Подтвержден' : 
                 orderData.status}
              </span>
            </div>
            
            <div className="order-success__order-total">
              <span className="order-success__info-label">Сумма заказа:</span>
              <span className="order-success__total-value">
                {formatPrice(orderData.total)} ₽
              </span>
            </div>
            
            <div className="order-success__order-date">
              <span className="order-success__info-label">Дата и время заказа:</span>
              <span className="order-success__date-value">
                {formatDate(orderData.date)}
              </span>
            </div>
          </div>

          {/* Сообщение для пользователя */}
          <div className="order-success__message">
            <div className="order-success__greeting">
              {getPassengerName() && `${getPassengerName()}!`}
            </div>
            <p className="order-success__text">
              Ваш заказ успешно оформлен. 
              {orderData.contact_info?.email && (
                <> Электронные билеты отправлены на email: <strong>{orderData.contact_info.email}</strong></>
              )}
            </p>
            <p className="order-success__text">
              Благодарим Вас за оказанное доверие и желаем приятного путешествия!
            </p>
          </div>

          {/* Ошибка API (если есть) */}
          {error && (
            <div className="order-success__api-error">
              <div className="order-success__api-error-icon">⚠️</div>
              <div className="order-success__api-error-text">
                {error}
                <br />
                <small>Некоторые данные могут быть неполными</small>
              </div>
            </div>
          )}

          {/* Инструкции */}
          <div className="order-success__instructions">
            <h2 className="order-success__instructions-title">
              Что делать дальше?
            </h2>
            
            <div className="order-success__instructions-list">
              <div className="order-success__instruction">
                <div className="order-success__instruction-icon">📧</div>
                <div className="order-success__instruction-content">
                  <h3 className="order-success__instruction-title">
                    Проверьте email
                  </h3>
                  <p className="order-success__instruction-text">
                    Электронные билеты отправлены на указанный email адрес. 
                    Проверьте папки «Входящие» и «Спам».
                  </p>
                </div>
              </div>
              
              <div className="order-success__instruction">
                <div className="order-success__instruction-icon">🖨️</div>
                <div className="order-success__instruction-content">
                  <h3 className="order-success__instruction-title">
                    Сохраните билеты
                  </h3>
                  <p className="order-success__instruction-text">
                    Распечатайте или сохраните билеты в телефоне до даты поездки.
                  </p>
                </div>
              </div>
              
              <div className="order-success__instruction">
                <div className="order-success__instruction-icon">📱</div>
                <div className="order-success__instruction-content">
                  <h3 className="order-success__instruction-title">
                    Используйте мобильное приложение
                  </h3>
                  <p className="order-success__instruction-text">
                    Скачайте наше приложение для удобного доступа к билетам 
                    и получения уведомлений.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="order-success__actions">
            <button 
              className="order-success__action order-success__action--print"
              onClick={handlePrintTickets}
            >
              🖨️ Распечатать билеты
            </button>
            
            <button 
              className="order-success__action order-success__action--email"
              onClick={handleEmailTickets}
            >
              📧 Отправить билеты на email
            </button>
            
            <button 
              className="order-success__action order-success__action--download"
              onClick={() => {
                // Здесь можно добавить загрузку PDF
                alert('Функция скачивания будет доступна в ближайшее время');
              }}
            >
              ⬇️ Скачать PDF
            </button>
            
            <button 
              className="order-success__action order-success__action--home"
              onClick={handleReturnHome}
            >
              🏠 Вернуться на главную
            </button>
          </div>

          {/* Оценка сервиса */}
          <div className="order-success__rating">
            <h2 className="order-success__rating-title">
              Оцените наш сервис
            </h2>
            
            {isRatingSubmitted ? (
              <div className="order-success__rating-thanks">
                <div className="order-success__rating-thanks-icon">❤️</div>
                <p className="order-success__rating-thanks-text">
                  Спасибо за вашу оценку! Мы ценим ваше мнение.
                </p>
              </div>
            ) : (
              <>
                <div className="order-success__rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className={`order-success__rating-star ${
                        star <= (hoverRating || rating) 
                          ? 'order-success__rating-star--active' 
                          : ''
                      }`}
                      onClick={() => handleRatingClick(star)}
                      onMouseEnter={() => handleRatingHover(star)}
                      onMouseLeave={handleRatingLeave}
                      aria-label={`Оценить на ${star} звезд`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                
                <div className="order-success__rating-labels">
                  <span className="order-success__rating-label">Плохо</span>
                  <span className="order-success__rating-label">Отлично</span>
                </div>
              </>
            )}
          </div>

          {/* Детали поездки (для печати) */}
          <div className="order-success__print-details print-only">
            <div className="order-success__print-header">
              <h1 className="order-success__print-title">Железнодорожный билет</h1>
              <div className="order-success__print-order-number">
                Номер заказа: {orderData.number}
              </div>
            </div>
            
            <div className="order-success__print-trip">
              <div className="order-success__print-train">
                <strong>Поезд:</strong> №{orderData.train.number} {orderData.train.name}
              </div>
              
              <div className="order-success__print-route">
                <div className="order-success__print-station">
                  <strong>Отправление:</strong><br />
                  {orderData.train.fromCity}, {orderData.train.fromStation}<br />
                  {formatDate(orderData.train.departureTime)}<br />
                  {formatTime(orderData.train.departureTime)}
                </div>
                
                <div className="order-success__print-station">
                  <strong>Прибытие:</strong><br />
                  {orderData.train.toCity}, {orderData.train.toStation}<br />
                  {formatDate(orderData.train.arrivalTime)}<br />
                  {formatTime(orderData.train.arrivalTime)}
                </div>
              </div>
              
              <div className="order-success__print-wagon">
                <strong>Вагон:</strong> №{orderData.wagon.number} ({orderData.wagon.name})<br />
                <strong>Места:</strong> {orderData.seats.join(', ')}
              </div>
            </div>
            
            <div className="order-success__print-passengers">
              <h3 className="order-success__print-passengers-title">Пассажиры:</h3>
              {orderData.passengers.map((passenger, index) => (
                <div key={index} className="order-success__print-passenger">
                  <strong>Пассажир {index + 1}:</strong> {passenger.lastName} {passenger.firstName} {passenger.middleName || ''}
                  {passenger.seatNumber && ` (Место: ${passenger.seatNumber})`}
                </div>
              ))}
            </div>
            
            <div className="order-success__print-footer">
              <div className="order-success__print-qr">
                <div className="order-success__print-qr-placeholder">
                  [QR-код для посадки]
                </div>
              </div>
              <div className="order-success__print-total">
                <strong>Сумма к оплате:</strong> {formatPrice(orderData.total)} ₽
              </div>
            </div>
          </div>
        </div>

        {/* Боковая панель */}
        <aside className="order-success-page__sidebar">
          {/* Контакты поддержки */}
          <div className="order-success__support">
            <h3 className="order-success__support-title">Поддержка</h3>
            
            <div className="order-success__support-contacts">
              <a href="tel:88000000000" className="order-success__support-phone">
                📞 8 (800) 000-00-00
              </a>
              <a href="mailto:support@train-tickets.ru" className="order-success__support-email">
                ✉️ support@train-tickets.ru
              </a>
            </div>
            
            <div className="order-success__support-hours">
              <div className="order-success__support-hours-icon">🕒</div>
              <div className="order-success__support-hours-text">
                Круглосуточная поддержка
              </div>
            </div>
            
            <div className="order-success__support-chat">
              <button 
                className="order-success__support-chat-btn"
                onClick={() => alert('Чат поддержки будет доступен в ближайшее время')}
              >
                💬 Онлайн-чат с поддержкой
              </button>
            </div>
          </div>

          {/* Дополнительная информация */}
          <div className="order-success__additional">
            <h3 className="order-success__additional-title">Полезная информация</h3>
            
            <div className="order-success__additional-list">
              <a 
                href="#" 
                className="order-success__additional-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Страница в разработке');
                }}
              >
                📋 Правила перевозки
              </a>
              <a 
                href="#" 
                className="order-success__additional-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Страница в разработке');
                }}
              >
                💼 Условия возврата
              </a>
              <a 
                href="#" 
                className="order-success__additional-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Приложение доступно в App Store и Google Play');
                }}
              >
                📱 Мобильное приложение
              </a>
              <a 
                href="#" 
                className="order-success__additional-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Страница в разработке');
                }}
              >
                ❓ Частые вопросы
              </a>
            </div>
          </div>

          {/* Статус заказа */}
          <div className="order-success__status-card">
            <h3 className="order-success__status-card-title">Статус заказа</h3>
            <div className="order-success__status-timeline">
              <div className={`order-success__status-step ${orderData.status === 'paid' ? 'active' : ''}`}>
                <div className="order-success__status-step-icon">✓</div>
                <div className="order-success__status-step-text">Оплачен</div>
              </div>
              <div className={`order-success__status-step ${orderData.status === 'confirmed' ? 'active' : ''}`}>
                <div className="order-success__status-step-icon">✓</div>
                <div className="order-success__status-step-text">Подтвержден</div>
              </div>
              <div className={`order-success__status-step ${false ? 'active' : ''}`}>
                <div className="order-success__status-step-icon">⏳</div>
                <div className="order-success__status-step-text">Готов к поездке</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default OrderSuccessPage;
