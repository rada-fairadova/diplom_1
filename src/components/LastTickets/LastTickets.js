import React from 'react';
import './LastTickets.css';

// Моковые данные последних билетов
const mockLastTickets = [
  {
    id: 1,
    fromCity: 'Москва',
    toCity: 'Санкт-Петербург',
    trainNumber: '116С',
    departureDate: '30.08.2023',
    departureTime: '00:10',
    arrivalDate: '30.08.2023',
    arrivalTime: '09:52',
    duration: '9ч 42м',
    wagonType: 'Купе',
    price: 3820
  },
  {
    id: 2,
    fromCity: 'Москва',
    toCity: 'Казань',
    trainNumber: '117С',
    departureDate: '30.08.2023',
    departureTime: '11:30',
    arrivalDate: '30.08.2023',
    arrivalTime: '20:15',
    duration: '8ч 45м',
    wagonType: 'Плацкарт',
    price: 2400
  },
  {
    id: 3,
    fromCity: 'Москва',
    toCity: 'Нижний Новгород',
    trainNumber: '118С',
    departureDate: '30.08.2023',
    departureTime: '15:45',
    arrivalDate: '30.08.2023',
    arrivalTime: '21:30',
    duration: '5ч 45м',
    wagonType: 'Сидячий',
    price: 1500
  }
];

function LastTickets({ onTicketClick }) {
  return (
    <div className="last-tickets">
      <h3 className="last-tickets__title">Последние билеты</h3>
      <div className="last-tickets__list">
        {mockLastTickets.map(ticket => (
          <div 
            key={ticket.id} 
            className="last-ticket"
            onClick={() => onTicketClick && onTicketClick(ticket)}
            style={{ cursor: onTicketClick ? 'pointer' : 'default' }}
          >
            <div className="last-ticket__route">
              <div className="last-ticket__from">
                <span className="last-ticket__city">{ticket.fromCity}</span>
                <span className="last-ticket__station"></span>
              </div>
              <div className="last-ticket__arrow">→</div>
              <div className="last-ticket__to">
                <span className="last-ticket__city">{ticket.toCity}</span>
                <span className="last-ticket__station"></span>
              </div>
            </div>
            <div className="last-ticket__details">
              <div className="last-ticket__train">
                <span className="last-ticket__train-label">Поезд</span>
                <span className="last-ticket__train-number">{ticket.trainNumber}</span>
              </div>
              <div className="last-ticket__time">
                <span className="last-ticket__time-label">Отправление</span>
                <span className="last-ticket__time-value">{ticket.departureDate}, {ticket.departureTime}</span>
              </div>
              <div className="last-ticket__duration">
                <span className="last-ticket__duration-label">В пути</span>
                <span className="last-ticket__duration-value">{ticket.duration}</span>
              </div>
            </div>
            <div className="last-ticket__wagon">
              <span className="last-ticket__wagon-type">{ticket.wagonType}</span>
            </div>
            <div className="last-ticket__price">
              <span className="last-ticket__price-value">от {ticket.price} ₽</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LastTickets;
