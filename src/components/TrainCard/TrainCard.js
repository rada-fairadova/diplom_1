import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTicket } from '../../context/TicketContext';
import './TrainCard.css';

function TrainCard({ train, onSelect }) {
  const navigate = useNavigate();
  const { setSelectedTrain } = useTicket();

  const handleSelect = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Выбран поезд:', train);
    
    if (!train) {
      console.error('Поезд не определен');
      return;
    }
    
    setSelectedTrain(train);
    
    if (onSelect) {
      onSelect(train);
    } else {
      navigate('/seats');
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--.--.----';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0 ч 0 мин';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ч ${mins} мин`;
  };

  const getWagonTypeName = (type) => {
    const types = {
      sitting: 'Сидячий',
      platzkart: 'Плацкарт',
      coupe: 'Купе',
      lux: 'Люкс',
      first: 'Люкс',
      second: 'Купе',
      third: 'Плацкарт',
      fourth: 'Сидячий'
    };
    return types[type] || type;
  };

  const formatPrice = (price) => {
    if (!price) return '0';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Получаем минимальную цену из всех вагонов
  const getMinPrice = () => {
    if (!train.wagons || train.wagons.length === 0) return 0;
    const prices = train.wagons.map(w => w.price || 0).filter(p => p > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  return (
    <div className="train-card" onClick={handleSelect} style={{ cursor: 'pointer' }}>
      <div className="train-card__header">
        <div className="train-card__number">{train.number || '---'}</div>
        <div className="train-card__name">{train.name || '---'}</div>
      </div>

      <div className="train-card__route">
        <div className="train-card__station train-card__station--departure">
          <div className="train-card__time">{formatTime(train.departureTime)}</div>
          <div className="train-card__date">{formatDate(train.departureTime)}</div>
          <div className="train-card__city">{train.fromCity || '---'}</div>
          <div className="train-card__station-name">{train.fromStation || '---'}</div>
        </div>

        <div className="train-card__duration">
          <div className="train-card__duration-text">
            {formatDuration(train.duration)}
          </div>
          <div className="train-card__duration-line"></div>
        </div>

        <div className="train-card__station train-card__station--arrival">
          <div className="train-card__time">{formatTime(train.arrivalTime)}</div>
          <div className="train-card__date">{formatDate(train.arrivalTime)}</div>
          <div className="train-card__city">{train.toCity || '---'}</div>
          <div className="train-card__station-name">{train.toStation || '---'}</div>
        </div>
      </div>

      <div className="train-card__wagons">
        <h3 className="train-card__wagons-title">Вагоны</h3>
        <div className="train-card__wagon-types">
          {train.wagons && train.wagons.length > 0 ? (
            train.wagons.map((wagon, index) => (
              <div key={index} className="train-card__wagon-type">
                <div className="train-card__wagon-name">
                  {getWagonTypeName(wagon.type)}
                </div>
                <div className="train-card__wagon-price">
                  от {formatPrice(wagon.price)} ₽
                </div>
                <div className="train-card__wagon-seats">
                  {wagon.availableSeats || 0} мест
                </div>
              </div>
            ))
          ) : (
            <div className="train-card__wagon-type">
              <div className="train-card__wagon-name">Нет данных</div>
            </div>
          )}
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
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSelect(e);
        }}
        type="button"
      >
        Выбрать места
      </button>
    </div>
  );
}

export default TrainCard;
