import React, { useState } from 'react';
import './SeatSelection.css';

function SeatSelection({ wagon, selectedSeats = [], onSeatSelect }) {
  const [seats] = useState(generateSeats(wagon));

  function generateSeats(wagonType) {
    // Генерация мест в зависимости от типа вагона
    const seatsMap = {
      sitting: generateSittingSeats(),
      platzkart: generatePlatzkartSeats(),
      coupe: generateCoupeSeats(),
      lux: generateLuxSeats()
    };
    return seatsMap[wagonType] || [];
  }

  function generateSittingSeats() {
    const seats = [];
    for (let i = 1; i <= 60; i++) {
      seats.push({
        id: i,
        number: i,
        price: 1920,
        available: Math.random() > 0.3
      });
    }
    return seats;
  }

  function generatePlatzkartSeats() {
    const seats = [];
    for (let i = 1; i <= 54; i++) {
      seats.push({
        id: i,
        number: i,
        price: 2500,
        available: Math.random() > 0.3,
        type: i <= 36 ? 'lower' : 'upper'
      });
    }
    return seats;
  }

  function generateCoupeSeats() {
    const seats = [];
    for (let i = 1; i <= 36; i++) {
      seats.push({
        id: i,
        number: i,
        price: 3500,
        available: Math.random() > 0.3,
        type: i % 2 === 0 ? 'lower' : 'upper'
      });
    }
    return seats;
  }

  function generateLuxSeats() {
    const seats = [];
    for (let i = 1; i <= 18; i++) {
      seats.push({
        id: i,
        number: i,
        price: 7000,
        available: Math.random() > 0.3
      });
    }
    return seats;
  }

  const handleSeatClick = (seat) => {
    if (!seat.available) return;
    
    if (selectedSeats.includes(seat.id)) {
      onSeatSelect(selectedSeats.filter(id => id !== seat.id));
    } else {
      onSeatSelect([...selectedSeats, seat.id]);
    }
  };

  return (
    <div className="seat-selection">
      <div className="seat-selection__wagon-info">
        <h3>Вагон №{wagon.number}</h3>
        <p>Тип: {getWagonTypeName(wagon.type)}</p>
        <p>Выбрано мест: {selectedSeats.length}</p>
      </div>

      <div className="seat-selection__grid">
        {seats.map(seat => (
          <button
            key={seat.id}
            className={`seat-selection__seat ${selectedSeats.includes(seat.id) ? 'seat-selection__seat--selected' : ''} ${!seat.available ? 'seat-selection__seat--unavailable' : ''}`}
            onClick={() => handleSeatClick(seat)}
            disabled={!seat.available}
          >
            <span className="seat-selection__seat-number">{seat.number}</span>
            <span className="seat-selection__seat-price">{seat.price} ₽</span>
          </button>
        ))}
      </div>

      <div className="seat-selection__legend">
        <div className="seat-selection__legend-item">
          <div className="seat-selection__legend-color seat-selection__legend-color--available"></div>
          <span>Свободно</span>
        </div>
        <div className="seat-selection__legend-item">
          <div className="seat-selection__legend-color seat-selection__legend-color--selected"></div>
          <span>Выбрано</span>
        </div>
        <div className="seat-selection__legend-item">
          <div className="seat-selection__legend-color seat-selection__legend-color--unavailable"></div>
          <span>Занято</span>
        </div>
      </div>
    </div>
  );
}

function getWagonTypeName(type) {
  const types = {
    sitting: 'Сидячий',
    platzkart: 'Плацкарт',
    coupe: 'Купе',
    lux: 'Люкс'
  };
  return types[type] || type;
}

export default SeatSelection;
