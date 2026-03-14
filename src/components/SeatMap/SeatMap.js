import React, { useState } from 'react';
import './SeatMap.css';

function SeatMap() {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [wagonNumber] = useState(5);
  const seatPrice = 2500;

  // Простая схема из 36 мест
  const seats = Array.from({ length: 36 }, (_, index) => ({
    id: index + 1,
    number: index + 1,
    coupe: Math.floor(index / 4) + 1,
    position: (index % 4) + 1,
    type: (index % 2 === 0) ? 'upper' : 'lower',
    isAvailable: Math.random() > 0.2,
    price: seatPrice
  }));

  const handleSeatClick = (seat) => {
    if (!seat.isAvailable) return;
    
    const isSelected = selectedSeats.includes(seat.id);
    
    if (isSelected) {
      setSelectedSeats(selectedSeats.filter(id => id !== seat.id));
    } else {
      setSelectedSeats([...selectedSeats, seat.id]);
    }
  };

  const getSeatLabel = (seat) => {
    const positions = ['Верхнее слева', 'Нижнее слева', 'Верхнее справа', 'Нижнее справа'];
    return positions[seat.position - 1] || positions[0];
  };

  const getTotalPrice = () => {
    return selectedSeats.length * seatPrice;
  };

  const clearSelection = () => {
    setSelectedSeats([]);
  };

  return (
    <div className="seat-map">
      <div className="seat-map__header">
        <h2>Выберите места</h2>
        <div className="seat-map__info">
          <span>Вагон №{wagonNumber}</span>
          <span>Свободно: {seats.filter(s => s.isAvailable).length} мест</span>
        </div>
      </div>

      <div className="seat-map__legend">
        <div className="legend-item">
          <div className="legend-color available"></div>
          <span>Свободно</span>
        </div>
        <div className="legend-item">
          <div className="legend-color selected"></div>
          <span>Выбрано</span>
        </div>
        <div className="legend-item">
          <div className="legend-color occupied"></div>
          <span>Занято</span>
        </div>
      </div>

      <div className="seat-map__layout">
        <div className="wagon-aisle"></div>
        
        <div className="seats-left">
          {seats.filter(seat => seat.position <= 2).map(seat => (
            <div
              key={seat.id}
              className={`seat ${seat.isAvailable ? (selectedSeats.includes(seat.id) ? 'selected' : 'available') : 'occupied'} ${seat.type}`}
              onClick={() => handleSeatClick(seat)}
              title={`Место ${seat.number}, ${getSeatLabel(seat)}`}
            >
              <div className="seat-number">{seat.number}</div>
              <div className="seat-type">{seat.type === 'upper' ? 'В' : 'Н'}</div>
            </div>
          ))}
        </div>

        <div className="coupe-numbers">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <div key={num} className="coupe-number">К{num}</div>
          ))}
        </div>

        <div className="seats-right">
          {seats.filter(seat => seat.position > 2).map(seat => (
            <div
              key={seat.id}
              className={`seat ${seat.isAvailable ? (selectedSeats.includes(seat.id) ? 'selected' : 'available') : 'occupied'} ${seat.type}`}
              onClick={() => handleSeatClick(seat)}
              title={`Место ${seat.number}, ${getSeatLabel(seat)}`}
            >
              <div className="seat-number">{seat.number}</div>
              <div className="seat-type">{seat.type === 'upper' ? 'В' : 'Н'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="seat-map__selection">
        <div className="selected-seats">
          <h3>Выбранные места:</h3>
          {selectedSeats.length > 0 ? (
            <div className="seats-list">
              {selectedSeats.map(seatId => {
                const seat = seats.find(s => s.id === seatId);
                if (!seat) return null;
                
                return (
                  <div key={seatId} className="selected-seat">
                    <span>Место {seat.number} ({getSeatLabel(seat)})</span>
                    <span>{seat.price} ₽</span>
                    <button 
                      className="remove-btn"
                      onClick={() => handleSeatClick(seat)}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="no-seats">Выберите места на схеме</p>
          )}
        </div>

        <div className="seat-summary">
          <div className="summary-row">
            <span>Мест:</span>
            <span>{selectedSeats.length}</span>
          </div>
          <div className="summary-row">
            <span>Цена за место:</span>
            <span>{seatPrice} ₽</span>
          </div>
          <div className="summary-row total">
            <span>Итого:</span>
            <span>{getTotalPrice()} ₽</span>
          </div>
          
          <div className="seat-actions">
            <button 
              className="clear-btn"
              onClick={clearSelection}
              disabled={selectedSeats.length === 0}
            >
              Очистить
            </button>
            <button 
              className="continue-btn"
              disabled={selectedSeats.length === 0}
            >
              Продолжить ({selectedSeats.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SeatMap;
