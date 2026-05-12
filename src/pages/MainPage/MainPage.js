import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TicketSearch from '../../components/TicketSearch/TicketSearch';
import LastTickets from '../../components/LastTickets/LastTickets';
import { useTicket } from '../../context/TicketContext';
import { trainApi } from '../../services/api';
import './MainPage.css';

// Импортируем изображения
import avatar1 from '../../assets/images/image1.png';
import avatar2 from '../../assets/images/image2.png';
import svg1 from '../../assets/svg/Subtract.svg';
import svg2 from '../../assets/svg/Subtract-2.svg';
import svg3 from '../../assets/svg/Subtract-3.svg';

function MainPage() {
  const navigate = useNavigate();
  const { 
    setSelectedTrain, 
    setSelectedWagon, 
    setSelectedSeats, 
    updateSearchParams 
  } = useTicket();
  const [lastTickets, setLastTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Загрузка последних билетов при монтировании
  useEffect(() => {
    fetchLastTickets();
  }, []);

  // Функция форматирования маршрута в билет для последних билетов
  const formatRouteToLastTicket = (route) => {
    const from = route.from || {};
    const to = route.to || {};
    const fromCity = from.city || {};
    const toCity = to.city || {};
    
    const departureTime = from.datetime ? new Date(from.datetime) : new Date();
    const arrivalTime = to.datetime ? new Date(to.datetime) : new Date();
    
    // Вычисляем длительность в минутах
    let duration = route.duration;
    if (!duration && departureTime && arrivalTime) {
      duration = Math.floor((arrivalTime - departureTime) / (1000 * 60));
    }
    
    // Определяем тип вагона по доступным классам
    let wagonType = 'fourth';
    if (route.have_first_class) wagonType = 'first';
    else if (route.have_second_class) wagonType = 'second';
    else if (route.have_third_class) wagonType = 'third';
    
    return {
      id: route._id,
      trainNumber: route.train?.name || route.train?.number || 'Unknown',
      fromCity: fromCity.name || 'Unknown',
      fromStation: from.railway_station_name || 'Unknown station',
      toCity: toCity.name || 'Unknown',
      toStation: to.railway_station_name || 'Unknown station',
      departureDate: departureTime.toLocaleDateString('ru-RU'),
      arrivalDate: arrivalTime.toLocaleDateString('ru-RU'),
      departureTime: departureTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      arrivalTime: arrivalTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      duration: duration || 0,
      minPrice: trainApi.getMinPrice(route),
      price: trainApi.getMinPrice(route),
      wagonType: wagonType
    };
  };

  const fetchLastTickets = async () => {
    try {
      setLoading(true);
      
      // Получаем список городов
      const cities = await trainApi.getAllCities();
      
      if (!cities || cities.length < 2) {
        console.warn('Недостаточно городов для поиска');
        setLastTickets(getMockTickets());
        return;
      }
      
      // Ищем популярные направления (Москва и Санкт-Петербург)
      const moscow = cities.find(city => 
        city.name?.toLowerCase().includes('москв') || 
        city.name?.toLowerCase().includes('moscow')
      );
      
      const stPetersburg = cities.find(city => 
        city.name?.toLowerCase().includes('санкт-петербург') || 
        city.name?.toLowerCase().includes('спб') ||
        city.name?.toLowerCase().includes('петербург')
      );
      
      let fromCity = null;
      let toCity = null;
      
      // Если нашли Москву и СПБ - используем их
      if (moscow && stPetersburg) {
        fromCity = moscow;
        toCity = stPetersburg;
      } else {
        // Иначе берем первые два города из списка
        fromCity = cities[0];
        toCity = cities[1];
      }
      
      // Выполняем поиск маршрутов
      const response = await trainApi.searchRoutes({
        from_city_id: fromCity._id,
        to_city_id: toCity._id,
        date_start: new Date().toISOString().split('T')[0],
        limit: 6,
        sort: 'date'
      });
      
      if (response && response.items && response.items.length > 0) {
        const formattedTickets = response.items.map(route => formatRouteToLastTicket(route));
        setLastTickets(formattedTickets);
      } else {
        // Если маршрутов нет, используем мок-данные
        setLastTickets(getMockTickets());
      }
      
    } catch (error) {
      console.error('Error fetching last tickets:', error);
      // В случае ошибки показываем заглушки
      setLastTickets(getMockTickets());
    } finally {
      setLoading(false);
    }
  };

  // Заглушки для демонстрации
  const getMockTickets = () => {
    return [
      {
        id: '1',
        trainNumber: '123С',
        fromCity: 'Москва',
        fromStation: 'Курский вокзал',
        toCity: 'Санкт-Петербург',
        toStation: 'Московский вокзал',
        departureDate: '25.12.2023',
        arrivalDate: '25.12.2023',
        departureTime: '20:30',
        arrivalTime: '04:55',
        duration: 505,
        price: 2500,
        wagonType: 'second'
      },
      {
        id: '2',
        trainNumber: '456М',
        fromCity: 'Санкт-Петербург',
        fromStation: 'Московский вокзал',
        toCity: 'Москва',
        toStation: 'Курский вокзал',
        departureDate: '26.12.2023',
        arrivalDate: '26.12.2023',
        departureTime: '22:15',
        arrivalTime: '06:40',
        duration: 505,
        price: 2400,
        wagonType: 'third'
      },
      {
        id: '3',
        trainNumber: '789Ф',
        fromCity: 'Казань',
        fromStation: 'Казанский вокзал',
        toCity: 'Екатеринбург',
        toStation: 'Екатеринбург-Пассажирский',
        departureDate: '27.12.2023',
        arrivalDate: '28.12.2023',
        departureTime: '18:45',
        arrivalTime: '09:20',
        duration: 875,
        price: 3500,
        wagonType: 'second'
      },
      {
        id: '4',
        trainNumber: '001А',
        fromCity: 'Новосибирск',
        fromStation: 'Новосибирск-Главный',
        toCity: 'Владивосток',
        toStation: 'Владивосток-Пассажирский',
        departureDate: '29.12.2023',
        arrivalDate: '31.12.2023',
        departureTime: '15:20',
        arrivalTime: '08:45',
        duration: 2525,
        price: 8500,
        wagonType: 'second'
      },
      {
        id: '5',
        trainNumber: '042Ч',
        fromCity: 'Екатеринбург',
        fromStation: 'Екатеринбург-Пассажирский',
        toCity: 'Тюмень',
        toStation: 'Тюменский вокзал',
        departureDate: '28.12.2023',
        arrivalDate: '28.12.2023',
        departureTime: '23:50',
        arrivalTime: '06:15',
        duration: 385,
        price: 1800,
        wagonType: 'third'
      },
      {
        id: '6',
        trainNumber: '055М',
        fromCity: 'Самара',
        fromStation: 'Самарский вокзал',
        toCity: 'Казань',
        toStation: 'Казанский вокзал',
        departureDate: '30.12.2023',
        arrivalDate: '30.12.2023',
        departureTime: '08:30',
        arrivalTime: '14:20',
        duration: 350,
        price: 2200,
        wagonType: 'fourth'
      }
    ];
  };

  // Функция для обработки клика на последний билет
  const handleLastTicketClick = async (ticketData) => {
    console.log('Клик на последний билет на главной странице:', ticketData);
    
    try {
      // Получаем детальную информацию о маршруте
      const routeDetails = await trainApi.getRouteDetails(ticketData.id);
      
      if (routeDetails) {
        // Форматируем данные маршрута для UI
        const trainFromTicket = trainApi.formatRouteForUI(routeDetails);
        
        if (trainFromTicket) {
          // Сохраняем в контекст
          setSelectedTrain(trainFromTicket);
          
          // Выбираем первый вагон, если есть
          if (trainFromTicket.wagons && trainFromTicket.wagons.length > 0) {
            setSelectedWagon(trainFromTicket.wagons[0]);
          }
          
          // Сбрасываем выбранные места
          setSelectedSeats([]);
          
          // Сохраняем тип вагона
          if (ticketData.wagonType && ticketData.wagonType !== 'all') {
            localStorage.setItem('selectedWagonType', ticketData.wagonType);
          }
          
          // Переходим на страницу выбора мест
          navigate('/seats');
        } else {
          handleFallbackNavigation(ticketData);
        }
      } else {
        // Если не удалось получить детали, используем данные из билета
        handleFallbackNavigation(ticketData);
      }
    } catch (error) {
      console.error('Error fetching route details:', error);
      // В случае ошибки используем fallback навигацию
      handleFallbackNavigation(ticketData);
    }
  };

  // Fallback навигация (если API не доступен)
  const handleFallbackNavigation = (ticketData) => {
    const trainFromTicket = {
      id: `${ticketData.trainNumber}-${Date.now()}`,
      number: ticketData.trainNumber,
      name: `${ticketData.fromCity} → ${ticketData.toCity}`,
      fromCity: ticketData.fromCity,
      fromStation: ticketData.fromStation || `${ticketData.fromCity} вокзал`,
      toCity: ticketData.toCity,
      toStation: ticketData.toStation || `${ticketData.toCity} вокзал`,
      departureTime: ticketData.departureDate ? 
        `${ticketData.departureDate.split('.').reverse().join('-')}T${ticketData.departureTime || '00:00'}:00` : 
        '2023-12-31T00:00:00',
      arrivalTime: ticketData.arrivalDate ? 
        `${ticketData.arrivalDate.split('.').reverse().join('-')}T${ticketData.arrivalTime || '00:00'}:00` : 
        '2023-12-31T23:59:00',
      departureDate: ticketData.departureDate || '31.12.2023',
      arrivalDate: ticketData.arrivalDate || '31.12.2023',
      duration: ticketData.duration || 300,
      minPrice: ticketData.price || 2000,
      wagons: [
        { 
          type: ticketData.wagonType?.toLowerCase() || 'second', 
          name: ticketData.wagonType === 'first' ? 'Люкс' : 
                ticketData.wagonType === 'second' ? 'Купе' : 
                ticketData.wagonType === 'third' ? 'Плацкарт' : 'Сидячий',
          price: ticketData.price || 2000, 
          availableSeats: 10,
          topPrice: ticketData.price || 2000
        }
      ],
      hasWifi: true,
      hasConditioner: true,
      hasLinens: true,
      selectingCount: 5
    };
    
    // Сохраняем в контекст
    setSelectedTrain(trainFromTicket);
    setSelectedWagon(trainFromTicket.wagons[0]);
    setSelectedSeats([]);
    
    // Сохраняем тип вагона
    if (ticketData.wagonType && ticketData.wagonType !== 'all') {
      localStorage.setItem('selectedWagonType', ticketData.wagonType);
    }
    
    // Переходим на страницу выбора мест
    navigate('/seats');
  };

  return (
    <div className="main-page">
      
      {/* Hero секция */}
      <section className="hero">
        <div className="hero__content">
          <h1 className="hero__title">Вся жизнь - путешествие!</h1>
          <p className="hero__subtitle">
            Найдите и забронируйте железнодорожные билеты онлайн
          </p>
          <TicketSearch />
        </div>
      </section>

      {/* О нас */}
      <section id="about" className="about">
        <div className="about__container">
          <h2 className="about__title">О НАС</h2>
          <div className="about__content">
            <div className="about__text">
              <p>
                Мы рады видеть вас! Мы работаем для Вас с 2003 года. 
                18 лет мы наблюдаем, как с каждым днем все больше людей 
                заказывают жд билеты через интернет.
              </p>
              <p>
                Сегодня можно заказать железнодорожные билеты онлайн всего в 2 клика, 
                но стоит ли это делать? Мы расскажем о преимуществах заказа через интернет.
              </p>
              <div className="about__advantages">
                <div className="about__advantage">
                  <span className="about__advantage-icon">🎯</span>
                  <div className="about__advantage-text">
                    <strong>Покупать жд билеты дешево можно за 90 суток до отправления поезда.</strong>
                  </div>
                </div>
                <div className="about__advantage">
                  <span className="about__advantage-icon">📊</span>
                  <div className="about__advantage-text">
                    <strong>Благодаря динамическому ценообразованию цена на билеты в это время самая низкая.</strong>
                  </div>
                </div>
              </div>
            </div>
            <div className="about__image">
              <div className="about__image-placeholder">
                🚂
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Как это работает */}
      <section id="how-it-works" className="how-it-works">
        <div className="how-it-works__container">
          <h2 className="how-it-works__title">КАК ЭТО РАБОТАЕТ</h2>
          <div className="how-it-works__steps">
            <div className="how-it-works__step">
              <div className="how-it-works__step-number">
                <img 
                    src={svg1}
                    alt="1"
                    className='svg-icon'
                  />
              </div>
              <h3 className="how-it-works__step-title">Удобный заказ на сайте</h3>
              <p className="how-it-works__step-description">
                Простой и интуитивно понятный интерфейс позволяет быстро найти 
                и забронировать нужные билеты
              </p>
            </div>
            <div className="how-it-works__step">
              <div className="how-it-works__step-number">
                <img 
                    src={svg2}
                    alt="2"
                    className='svg-icon'
                  />
              </div>
              <h3 className="how-it-works__step-title">Нет необходимости ехать в офис</h3>
              <p className="how-it-works__step-description">
                Заказывайте билеты из дома, офиса или в дороге через мобильное приложение
              </p>
            </div>
            <div className="how-it-works__step">
              <div className="how-it-works__step-number">
                <img 
                    src={svg3}
                    alt="3"
                    className='svg-icon'
                  />
              </div>
              <h3 className="how-it-works__step-title">Огромный выбор направлений</h3>
              <p className="how-it-works__step-description">
                Билеты на поезда по всей России и странам СНГ
              </p>
            </div>
          </div>
          <Link to="/search" className="how-it-works__cta">
            Узнать больше →
          </Link>
        </div>
      </section>

      {/* Последние билеты */}
      <section className="last-tickets-section">
        {loading ? (
          <div className="loading-tickets">
            <p>Загрузка последних билетов...</p>
          </div>
        ) : (
          <LastTickets 
            tickets={lastTickets} 
            onTicketClick={handleLastTicketClick} 
          />
        )}
      </section>

      {/* Отзывы */}
      <section id="reviews" className="reviews">
        <div className="reviews__container">
          <h2 className="reviews__title">ОТЗЫВЫ</h2>
          <div className="reviews__list">
            <div className="review">
              <div className="review__header">
                <div className="review__avatar">
                  <img 
                    src={avatar2}
                    alt="Екатерина Вальнова"
                    className="review__avatar-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const fallback = document.createElement('div');
                      fallback.className = 'review__avatar-fallback';
                      fallback.textContent = 'ЕВ';
                      e.target.parentElement.appendChild(fallback);
                    }}
                  />
                </div>
                <div className="review__author-info">
                  <h3 className="review__author">Екатерина Вальнова</h3>
                  <div className="review__rating">★★★★★</div>
                </div>
              </div>
              <blockquote className="review__text">
                "Доброжелательные подсказки на всех этапах помогут правильно заполнить 
                поля и без затруднений купить авиа или ж/д билет, даже если вы заказываете 
                онлайн билет впервые."
              </blockquote>
            </div>
            <div className="review">
              <div className="review__header">
                <div className="review__avatar">
                  <img 
                    src={avatar1}
                    alt="Евгений Стрыкало"
                    className="review__avatar-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const fallback = document.createElement('div');
                      fallback.className = 'review__avatar-fallback';
                      fallback.textContent = 'ЕС';
                      e.target.parentElement.appendChild(fallback);
                    }}
                  />
                </div>
                <div className="review__author-info">
                  <h3 className="review__author">Евгений Стрыкало</h3>
                  <div className="review__rating">★★★★★</div>
                </div>
              </div>
              <blockquote className="review__text">
                "СМС-сопровождение до посадки. Сразу после оплаты ж/д билетов и за 3 часа 
                до отправления мы пришлем вам СМС-напоминание о поездке."
              </blockquote>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default MainPage;
