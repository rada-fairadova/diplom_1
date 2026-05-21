import React, { useState, useEffect } from 'react';
import { trainApi } from '../../services/api';
import './LastTickets.css';

// Моковые данные последних билетов (используются как запасной вариант)
const mockLastTickets = [
  {
    id: 1,
    fromCity: 'Москва',
    toCity: 'Санкт-Петербург',
    fromStation: 'Ленинградский вокзал',
    toStation: 'Московский вокзал',
    trainNumber: '116С',
    trainName: 'Сапсан',
    departureDate: '30.08.2023',
    departureTime: '00:10',
    arrivalDate: '30.08.2023',
    arrivalTime: '09:52',
    duration: '9ч 42м',
    durationMinutes: 582,
    wagonType: 'Купе',
    wagonApiType: 'second',
    price: 3820
  },
  {
    id: 2,
    fromCity: 'Москва',
    toCity: 'Казань',
    fromStation: 'Казанский вокзал',
    toStation: 'Центральный вокзал',
    trainNumber: '117С',
    trainName: 'Татарстан',
    departureDate: '30.08.2023',
    departureTime: '11:30',
    arrivalDate: '30.08.2023',
    arrivalTime: '20:15',
    duration: '8ч 45м',
    durationMinutes: 525,
    wagonType: 'Плацкарт',
    wagonApiType: 'third',
    price: 2400
  },
  {
    id: 3,
    fromCity: 'Москва',
    toCity: 'Нижний Новгород',
    fromStation: 'Курский вокзал',
    toStation: 'Московский вокзал',
    trainNumber: '118С',
    trainName: 'Волга',
    departureDate: '30.08.2023',
    departureTime: '15:45',
    arrivalDate: '30.08.2023',
    arrivalTime: '21:30',
    duration: '5ч 45м',
    durationMinutes: 345,
    wagonType: 'Сидячий',
    wagonApiType: 'fourth',
    price: 1500
  }
];

function LastTickets({ onTicketClick }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLastTickets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Загрузка последних билетов...');
        
        // Пытаемся получить данные из API
        const lastRoutes = await trainApi.getLastRoutes();
        
        console.log('📦 Ответ API последних билетов:', lastRoutes);
        
        if (lastRoutes && lastRoutes.length > 0) {
          // Форматируем данные из API
          const formattedTickets = lastRoutes.slice(0, 3).map((route, index) => {
            // Определяем тип вагона
            const wagonTypeMap = {
              'first': { type: 'Люкс', apiType: 'first' },
              'second': { type: 'Купе', apiType: 'second' },
              'third': { type: 'Плацкарт', apiType: 'third' },
              'fourth': { type: 'Сидячий', apiType: 'fourth' }
            };
            
            // Если API вернул тип вагона, используем его, иначе определяем по минимальной цене
            let wagonType = 'second';
            if (route.wagonType && wagonTypeMap[route.wagonType]) {
              wagonType = route.wagonType;
            } else if (route.departure?.have_first_class) {
              wagonType = 'first';
            }
            
            const wagon = wagonTypeMap[wagonType] || wagonTypeMap['second'];
            
            // Форматируем даты
            const departureDate = route.departure?.from?.datetime 
              ? new Date(route.departure.from.datetime)
              : new Date();
            const arrivalDate = route.departure?.to?.datetime 
              ? new Date(route.departure.to.datetime)
              : new Date(Date.now() + (route.duration || 360) * 1000);
            
            const durationMinutes = Math.floor(
              route.departure?.duration 
                ? route.departure.duration / 60 
                : (route.duration || 360)
            );
            
            const hours = Math.floor(durationMinutes / 60);
            const minutes = durationMinutes % 60;
            const durationStr = `${hours}ч ${minutes > 0 ? minutes + 'м' : ''}`;
            
            return {
              id: route._id || `api-${index}`,
              fromCity: route.from_city?.name || route.departure?.from?.city?.name || 'Москва',
              toCity: route.to_city?.name || route.departure?.to?.city?.name || 'Санкт-Петербург',
              fromStation: route.from_city?.railway_station_name || 
                          route.departure?.from?.railway_station_name || 'Центральный вокзал',
              toStation: route.to_city?.railway_station_name || 
                        route.departure?.to?.railway_station_name || 'Главный вокзал',
              trainNumber: route.train?.number || '116С',
              trainName: route.train?.name || 'Сапсан',
              departureDate: departureDate.toLocaleDateString('ru-RU'),
              departureTime: departureDate.toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              arrivalDate: arrivalDate.toLocaleDateString('ru-RU'),
              arrivalTime: arrivalDate.toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              duration: durationStr,
              durationMinutes: durationMinutes,
              wagonType: wagon.type,
              wagonApiType: wagon.apiType,
              price: route.min_price || 2500
            };
          });
          
          console.log('✅ Последние билеты из API:', formattedTickets);
          setTickets(formattedTickets);
        } else {
          // Если API вернул пустой массив, используем моковые данные
          console.log('⚠️ API вернул пустой массив, используем моковые данные');
          setTickets(mockLastTickets);
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки последних билетов:', error);
        setError('Не удалось загрузить последние билеты');
        // При ошибке используем моковые данные
        console.log('🔄 Используем моковые данные из-за ошибки');
        setTickets(mockLastTickets);
      } finally {
        setLoading(false);
      }
    };

    fetchLastTickets();
  }, []);

  if (loading) {
    return (
      <div className="last-tickets">
        <h3 className="last-tickets__title">Последние билеты</h3>
        <div className="last-tickets__loading">
          <div className="last-tickets__spinner"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error && tickets.length === 0) {
    return (
      <div className="last-tickets">
        <h3 className="last-tickets__title">Последние билеты</h3>
        <div className="last-tickets__error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!tickets.length) {
    return null;
  }

  return (
    <div className="last-tickets">
      <h3 className="last-tickets__title">Последние билеты</h3>
      <div className="last-tickets__list">
        {tickets.map(ticket => (
          <div 
            key={ticket.id} 
            className="last-ticket"
            onClick={() => onTicketClick && onTicketClick(ticket)}
            style={{ cursor: onTicketClick ? 'pointer' : 'default' }}
            title={onTicketClick ? 'Нажмите, чтобы выбрать этот маршрут' : ''}
          >
            <div className="last-ticket__route">
              <div className="last-ticket__from">
                <span className="last-ticket__city">{ticket.fromCity}</span>
                <span className="last-ticket__station">{ticket.fromStation}</span>
              </div>
              <div className="last-ticket__arrow">→</div>
              <div className="last-ticket__to">
                <span className="last-ticket__city">{ticket.toCity}</span>
                <span className="last-ticket__station">{ticket.toStation}</span>
              </div>
            </div>
            <div className="last-ticket__details">
              <div className="last-ticket__train-info">
                <span className="last-ticket__train-label">Поезд</span>
                <span className="last-ticket__train-number">{ticket.trainNumber}</span>
                {ticket.trainName && (
                  <span className="last-ticket__train-name">{ticket.trainName}</span>
                )}
              </div>
              <div className="last-ticket__time-info">
                <div className="last-ticket__departure">
                  <span className="last-ticket__time-label">Отправление</span>
                  <span className="last-ticket__time-value">
                    {ticket.departureDate}, {ticket.departureTime}
                  </span>
                </div>
                <div className="last-ticket__travel-time">
                  <span className="last-ticket__duration-label">В пути</span>
                  <span className="last-ticket__duration-value">{ticket.duration}</span>
                </div>
                <div className="last-ticket__arrival">
                  <span className="last-ticket__time-label">Прибытие</span>
                  <span className="last-ticket__time-value">
                    {ticket.arrivalDate}, {ticket.arrivalTime}
                  </span>
                </div>
              </div>
            </div>
            <div className="last-ticket__footer">
              <div className="last-ticket__wagon">
                <span className="last-ticket__wagon-icon">
                  {ticket.wagonType === 'Люкс' && '⭐'}
                  {ticket.wagonType === 'Купе' && '🚂'}
                  {ticket.wagonType === 'Плацкарт' && '🛌'}
                  {ticket.wagonType === 'Сидячий' && '💺'}
                </span>
                <span className="last-ticket__wagon-type">{ticket.wagonType}</span>
              </div>
              <div className="last-ticket__price">
                <span className="last-ticket__price-label">от</span>
                <span className="last-ticket__price-value">
                  {ticket.price.toLocaleString('ru-RU')} 
                </span>
                <span className="last-ticket__price-currency">₽</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LastTickets;
