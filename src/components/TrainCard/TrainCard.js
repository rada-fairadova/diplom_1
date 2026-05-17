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
    
    console.log('🚂 TrainCard: Выбран поезд:', {
      id: train?.id,
      number: train?.number,
      name: train?.name,
      from: train?.fromCity,
      to: train?.toCity,
      wagonsCount: train?.wagons?.length || 0
    });
    
    if (!train || !train.id) {
      console.error('❌ TrainCard: Некорректные данные поезда:', train);
      return;
    }
    
    // Используем переданный обработчик, если он есть
    if (onSelect) {
      onSelect(train);
    } else {
      // Иначе сохраняем в контекст и переходим
      setSelectedTrain(train);
      navigate('/seats');
    }
  };

  // Проверка на валидность данных
  if (!train || !train.number) {
    console.error('❌ TrainCard получил некорректные данные:', train);
    return (
      <div className="train-card train-card--error">
        <p>Ошибка загрузки данных поезда</p>
      </div>
    );
  }

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '--:--';
      return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.error('Ошибка форматирования времени:', error);
      return '--:--';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--.--.----';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '--.--.----';
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Ошибка форматирования даты:', error);
      return '--.--.----';
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes < 0) return '0 ч 0 мин';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ч ${mins} мин`;
  };

  const getWagonTypeName = (type) => {
    const types = {
      'sitting': 'Сидячий',
      'platzkart': 'Плацкарт',
      'coupe': 'Купе',
      'lux': 'Люкс',
      'first': 'Люкс',
      'second': 'Купе',
      'third': 'Плацкарт',
      'fourth': 'Сидячий'
    };
    return types[type] || type || 'Неизвестно';
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return '0';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Генерируем уникальный ключ для элементов
  const uniqueKey = train.id || `train-${train.number}-${train.fromCity}-${train.toCity}`;

  return (
    <div 
      className="train-card" 
      onClick={handleSelect} 
      style={{ cursor: 'pointer' }}
      data-train-id={uniqueKey}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleSelect(e);
        }
      }}
    >
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
              <div 
                key={`${uniqueKey}-wagon-${index}`} 
                className="train-card__wagon-type"
              >
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
              <div className="train-card__wagon-name">Нет данных о вагонах</div>
            </div>
          )}
        </div>
      </div>

      <div className="train-card__additional">
        <div className="train-card__services">
          {train.hasWifi && (
            <span className="train-card__service" title="Wi-Fi">📶 Wi-Fi</span>
          )}
          {train.hasConditioner && (
            <span className="train-card__service" title="Кондиционер">❄️ Кондиционер</span>
          )}
          {train.hasLinens && (
            <span className="train-card__service" title="Бельё">🛏️ Бельё</span>
          )}
          {!train.hasWifi && !train.hasConditioner && !train.hasLinens && (
            <span className="train-card__service train-card__service--none">
              Без дополнительных услуг
            </span>
          )}
        </div>
        
        {train.selectingCount > 0 && (
          <div className="train-card__selecting">
            <span className="train-card__selecting-count">
              {train.selectingCount} человек выбирают места
            </span>
          </div>
        )}
      </div>

      <button 
        className="train-card__select-button"
        onClick={handleSelect}
        type="button"
      >
        Выбрать места
      </button>
    </div>
  );
}

export default TrainCard;
