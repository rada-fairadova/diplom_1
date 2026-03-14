import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTicket } from '../../context/TicketContext';
import './TrainCard.css';

function TrainCard({ train, onSelect }) {
  const navigate = useNavigate();
  const { setSelectedTrain } = useTicket();

  const handleSelect = () => {
    setSelectedTrain(train);
    if (onSelect) {
      onSelect(train);
    } else {
      navigate('/seats');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ч ${mins} мин`;
  };

  const getWagonTypeName = (type) => {
    const types = {
      sitting: 'Сидячий',
      platzkart: 'Плацкарт',
      coupe: 'Купе',
      lux: 'Люкс'
    };
    return types[type] || type;
  };

  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  return (
    <div className="train-card">
      <div className="train-card__header">
        <div className="train-card__number">{train.number}</div>
        <div className="train-card__name">{train.name}</div>
      </div>

      <div className="train-card__route">
        <div className="train-card__station train-card__station--departure">
          <div className="train-card__time">{formatTime(train.departureTime)}</div>
          <div className="train-card__date">{train.departureDate}</div>
          <div className="train-card__city">{train.fromCity}</div>
          <div className="train-card__station-name">{train.fromStation}</div>
        </div>

        <div className="train-card__duration">
          <div className="train-card__duration-text">
            {formatDuration(train.duration)}
          </div>
          <div className="train-card__duration-line"></div>
        </div>

        <div className="train-card__station train-card__station--arrival">
          <div className="train-card__time">{formatTime(train.arrivalTime)}</div>
          <div className="train-card__date">{train.arrivalDate}</div>
          <div className="train-card__city">{train.toCity}</div>
          <div className="train-card__station-name">{train.toStation}</div>
        </div>
      </div>

      <div className="train-card__wagons">
        <h3 className="train-card__wagons-title">Вагоны</h3>
        <div className="train-card__wagon-types">
          {train.wagons.map((wagon, index) => (
            <div key={index} className="train-card__wagon-type">
              <div className="train-card__wagon-name">
                {getWagonTypeName(wagon.type)}
              </div>
              <div className="train-card__wagon-price">
                от {formatPrice(wagon.price)} ₽
              </div>
              <div className="train-card__wagon-seats">
                {wagon.availableSeats} мест
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="train-card__additional">
        <div className="train-card__services">
          {train.hasWifi && (
            <span className="train-card__service" title="Wi-Fi">📶</span>
          )}
          {train.hasConditioner && (
            <span className="train-card__service" title="Кондиционер">❄️</span>
          )}
          {train.hasLinens && (
            <span className="train-card__service" title="Бельё">🛏️</span>
          )}
        </div>
        
        <div className="train-card__selecting">
          {train.selectingCount > 0 && (
            <span className="train-card__selecting-count">
              {train.selectingCount} человек выбирают места
            </span>
          )}
        </div>
      </div>

      <button 
        className="train-card__select-button"
        onClick={handleSelect}
      >
        Выбрать места
      </button>
    </div>
  );
}

export default TrainCard;
