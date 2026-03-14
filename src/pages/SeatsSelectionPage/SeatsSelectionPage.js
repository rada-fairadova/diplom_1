import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTicket } from '../../context/TicketContext';
import { trainApi } from '../../services/api';
import './SeatsSelectionPage.css';

// Типы вагонов с соответствием API
const wagonTypesConfig = [
  { 
    type: 'lux', 
    name: 'Люкс', 
    icon: '⭐',
    features: ['2 места в купе', 'Душ/туалет', 'ТВ', 'Кондиционер', 'Белье включено'],
    seatsInfo: 'Отдельные купе с повышенным комфортом',
    seatsPerRow: 2,
    totalSeats: 18
  },
  { 
    type: 'coupe', 
    name: 'Купе', 
    icon: '🚂',
    features: ['4 места в купе', 'Кондиционер', 'Розетки', 'Белье включено'],
    seatsInfo: 'Закрытые купе по 4 места',
    seatsPerRow: 4,
    totalSeats: 36
  },
  { 
    type: 'platzkart', 
    name: 'Плацкарт', 
    icon: '🛌',
    features: ['54 места в вагоне', 'Белье включено', 'Общие розетки'],
    seatsInfo: 'Открытое пространство, боковые и нижние места',
    seatsPerRow: 9,
    totalSeats: 54
  },
  { 
    type: 'sitting', 
    name: 'Сидячий', 
    icon: '💺',
    features: ['Сидячие места', 'Кондиционер', 'Розетки'],
    seatsInfo: 'Удобные сидячие места с откидными столиками',
    seatsPerRow: 6,
    totalSeats: 60
  }
];

function SeatsSelectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedTrain, setSelectedWagon, setSelectedSeats } = useTicket();
  
  const [selectedWagon, setSelectedWagonState] = useState(null);
  const [selectedSeats, setSelectedSeatsState] = useState([]);
  const [availableWagons, setAvailableWagons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seatMap, setSeatMap] = useState([]);

  // Загрузка данных о вагонах
  useEffect(() => {
    const fetchSeatsData = async () => {
      if (!selectedTrain) {
        navigate('/search');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('Загружаем места для поезда:', selectedTrain);

        // Используем вагоны из выбранного поезда
        if (selectedTrain.wagons && selectedTrain.wagons.length > 0) {
          // Преобразуем вагоны из поезда
          const wagons = selectedTrain.wagons.map(wagon => {
            const wagonType = wagonTypesConfig.find(w => 
              w.type === wagon.type
            ) || wagonTypesConfig[1]; // По умолчанию купе

            return {
              id: wagon.id || `wagon-${wagon.type}-${Math.random()}`,
              number: wagon.number || wagonTypesConfig.findIndex(w => w.type === wagon.type) + 1,
              type: wagon.type,
              name: wagonType.name,
              totalSeats: wagonType.totalSeats,
              availableSeats: wagon.availableSeats || Math.floor(Math.random() * 20) + 10,
              price: wagon.price || getDefaultPrice(wagon.type),
              features: wagonType.features,
              icon: wagonType.icon,
              seatsPerRow: wagonType.seatsPerRow
            };
          });

          console.log('Сформированные вагоны:', wagons);
          setAvailableWagons(wagons);

          // Автоматически выбираем первый вагон
          if (wagons.length > 0) {
            handleWagonSelect(wagons[0]);
          }
        } else {
          // Если нет вагонов в поезде, используем моковые данные
          setAvailableWagons(getMockWagons());
          if (getMockWagons().length > 0) {
            handleWagonSelect(getMockWagons()[0]);
          }
        }
      } catch (err) {
        console.error('Ошибка при загрузке мест:', err);
        setError('Не удалось загрузить информацию о местах');
        // Используем моковые данные в качестве резервного варианта
        setAvailableWagons(getMockWagons());
        if (getMockWagons().length > 0) {
          handleWagonSelect(getMockWagons()[0]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSeatsData();
  }, [selectedTrain, navigate]);

  // Генерация карты мест при выборе вагона
  useEffect(() => {
    if (!selectedWagon) return;

    // Генерируем карту мест для выбранного вагона
    const generateSeatMap = () => {
      const seats = [];
      const occupiedSeats = generateOccupiedSeats(selectedWagon.totalSeats, selectedWagon.availableSeats);
      
      for (let i = 1; i <= selectedWagon.totalSeats; i++) {
        seats.push({
          number: i,
          available: !occupiedSeats.includes(i),
          price: selectedWagon.price,
          class: selectedWagon.type
        });
      }
      
      return seats;
    };

    const newSeatMap = generateSeatMap();
    setSeatMap(newSeatMap);
    setSelectedSeatsState([]); // Сбрасываем выбранные места при смене вагона
    
    console.log(`Сгенерирована карта мест для вагона ${selectedWagon.type}:`, newSeatMap.length, 'мест');
  }, [selectedWagon]);

  const handleWagonSelect = (wagon) => {
    console.log('Выбран вагон:', wagon);
    setSelectedWagonState(wagon);
  };

  const handleSeatSelect = (seatNumber) => {
    // Проверяем, доступно ли место
    const seat = seatMap.find(s => s.number === seatNumber);
    if (!seat || !seat.available) {
      alert('Это место уже занято или недоступно');
      return;
    }

    if (selectedSeats.includes(seatNumber)) {
      // Убираем место из выбранных
      setSelectedSeatsState(selectedSeats.filter(s => s !== seatNumber));
    } else {
      // Добавляем место в выбранные
      if (selectedSeats.length < 4) {
        setSelectedSeatsState([...selectedSeats, seatNumber]);
      } else {
        alert('Максимальное количество мест для бронирования - 4');
      }
    }
  };

  const generateOccupiedSeats = (totalSeats, availableSeats) => {
    const occupiedCount = totalSeats - availableSeats;
    const occupiedSeats = [];
    
    // Генерируем случайные занятые места
    for (let i = 0; i < occupiedCount; i++) {
      let seat;
      do {
        seat = Math.floor(Math.random() * totalSeats) + 1;
      } while (occupiedSeats.includes(seat));
      occupiedSeats.push(seat);
    }
    
    return occupiedSeats;
  };

  const calculateTotalPrice = () => {
    if (!selectedWagon || selectedSeats.length === 0) return 0;
    
    return selectedSeats.length * selectedWagon.price;
  };

  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      alert('Пожалуйста, выберите хотя бы одно место');
      return;
    }
    
    // Сохраняем выбранный вагон и места в контекст
    setSelectedWagon(selectedWagon);
    setSelectedSeats(selectedSeats);
    
    console.log('Сохранены данные:', {
      wagon: selectedWagon,
      seats: selectedSeats,
      total: calculateTotalPrice()
    });
    
    // Переходим на страницу пассажиров
    navigate('/passengers');
  };

  const formatPrice = (price) => {
    return price ? price.toLocaleString('ru-RU') : '0';
  };

  const getDefaultPrice = (type) => {
    const prices = {
      'lux': 4950,
      'coupe': 3820,
      'platzkart': 2530,
      'sitting': 1920
    };
    return prices[type] || 2000;
  };

  const getMockWagons = () => {
    return [
      {
        id: 'lux-1',
        number: 1,
        type: 'lux',
        name: 'Люкс',
        totalSeats: 18,
        availableSeats: 8,
        price: 4950,
        features: ['2 места в купе', 'Душ/туалет', 'ТВ', 'Кондиционер', 'Белье включено'],
        icon: '⭐',
        seatsPerRow: 2
      },
      {
        id: 'coupe-2',
        number: 2,
        type: 'coupe',
        name: 'Купе',
        totalSeats: 36,
        availableSeats: 15,
        price: 3820,
        features: ['4 места в купе', 'Кондиционер', 'Розетки', 'Белье включено'],
        icon: '🚂',
        seatsPerRow: 4
      },
      {
        id: 'platzkart-3',
        number: 3,
        type: 'platzkart',
        name: 'Плацкарт',
        totalSeats: 54,
        availableSeats: 24,
        price: 2530,
        features: ['54 места в вагоне', 'Белье включено', 'Общие розетки'],
        icon: '🛌',
        seatsPerRow: 9
      },
      {
        id: 'sitting-4',
        number: 4,
        type: 'sitting',
        name: 'Сидячий',
        totalSeats: 60,
        availableSeats: 35,
        price: 1920,
        features: ['Сидячие места', 'Кондиционер', 'Розетки'],
        icon: '💺',
        seatsPerRow: 6
      }
    ];
  };

  // Функция для отображения мест в виде сетки с учетом типа вагона
  const renderSeatGrid = () => {
    if (!selectedWagon || seatMap.length === 0) return null;

    const seatsPerRow = selectedWagon.seatsPerRow || 4;
    const rows = Math.ceil(selectedWagon.totalSeats / seatsPerRow);
    
    return (
      <div className="seat-grid">
        {Array.from({ length: rows }, (_, rowIndex) => {
          const rowStart = rowIndex * seatsPerRow + 1;
          const rowEnd = Math.min(rowStart + seatsPerRow - 1, selectedWagon.totalSeats);
          
          return (
            <div key={`row-${rowIndex}`} className="seat-row">
              <div className="row-number">Ряд {rowIndex + 1}</div>
              <div className="row-seats">
                {Array.from({ length: seatsPerRow }, (_, seatIndex) => {
                  const seatNumber = rowStart + seatIndex;
                  if (seatNumber > selectedWagon.totalSeats) {
                    return <div key={`empty-${seatIndex}`} className="seat-empty"></div>;
                  }
                  
                  const seat = seatMap.find(s => s.number === seatNumber);
                  const isSelected = selectedSeats.includes(seatNumber);
                  const isAvailable = seat?.available || false;
                  
                  return (
                    <button
                      key={seatNumber}
                      className={`seat ${isSelected ? 'selected' : ''} ${!isAvailable ? 'unavailable' : 'available'}`}
                      onClick={() => handleSeatSelect(seatNumber)}
                      disabled={!isAvailable}
                      title={`Место ${seatNumber} - ${formatPrice(selectedWagon.price)} ₽`}
                    >
                      <span className="seat-number">{seatNumber}</span>
                      {isSelected && <span className="seat-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="seats-selection-page loading">
        <div className="loading-spinner"></div>
        <p>Загрузка доступных мест...</p>
      </div>
    );
  }

  if (!selectedTrain) {
    return (
      <div className="seats-selection-page error">
        <div className="error-message">
          <h2>Поезд не выбран</h2>
          <p>Пожалуйста, вернитесь на страницу поиска и выберите поезд</p>
          <button onClick={() => navigate('/search')} className="back-btn">
            Вернуться к поиску
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="seats-selection-page">
      {/* Шаги оформления */}
      <div className="booking-steps">
        <div className="step completed">
          <div className="step-number">✓</div>
          <div className="step-name">Поиск</div>
        </div>
        <div className="step completed">
          <div className="step-number">✓</div>
          <div className="step-name">Поезд</div>
        </div>
        <div className="step active">
          <div className="step-number">3</div>
          <div className="step-name">Места</div>
        </div>
        <div className="step">
          <div className="step-number">4</div>
          <div className="step-name">Пассажиры</div>
        </div>
        <div className="step">
          <div className="step-number">5</div>
          <div className="step-name">Оплата</div>
        </div>
      </div>

      <div className="seats-selection-container">
        <main className="seats-selection-main">
          {/* Информация о поезде */}
          <div className="trip-summary">
            <h1 className="trip-summary__title">Выбор мест в вагоне</h1>
            <div className="trip-summary__info">
              <div className="trip-summary__train">
                <span className="train-number">Поезд №{selectedTrain.number}</span>
                <span className="train-route">
                  {selectedTrain.fromCity} → {selectedTrain.toCity}
                </span>
              </div>
              
              <div className="trip-summary__details">
                <div className="trip-detail">
                  <div className="trip-detail__station">{selectedTrain.fromStation}</div>
                  <div className="trip-detail__time">
                    {selectedTrain.departureDate || new Date(selectedTrain.departureTime).toLocaleDateString('ru-RU')}, 
                    {new Date(selectedTrain.departureTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                
                <div className="trip-detail-separator">↓</div>
                
                <div className="trip-detail">
                  <div className="trip-detail__station">{selectedTrain.toStation}</div>
                  <div className="trip-detail__time">
                    {selectedTrain.arrivalDate || new Date(selectedTrain.arrivalTime).toLocaleDateString('ru-RU')}, 
                    {new Date(selectedTrain.arrivalTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Сообщение об ошибке */}
          {error && (
            <div className="error-notice">
              <div className="error-notice__icon">⚠️</div>
              <div className="error-notice__text">{error}</div>
            </div>
          )}

          {/* Выбор типа вагона */}
          <div className="wagon-type-section">
            <h2 className="section-title">Выберите тип вагона</h2>
            <p className="section-subtitle">Нажмите на карточку вагона для выбора</p>
            
            {availableWagons.length === 0 ? (
              <div className="no-wagons">
                <div className="no-wagons-icon">🚂</div>
                <h3>Нет доступных вагонов</h3>
                <p>На данный момент нет свободных вагонов в этом поезде</p>
              </div>
            ) : (
              <>
                <div className="wagon-type-grid">
                  {availableWagons.map(wagon => (
                    <div 
                      key={wagon.id}
                      className={`wagon-type-card ${selectedWagon?.id === wagon.id ? 'selected' : ''}`}
                      onClick={() => handleWagonSelect(wagon)}
                    >
                      <div className="wagon-type-icon">{wagon.icon}</div>
                      <div className="wagon-type-content">
                        <h3 className="wagon-type-name">{wagon.name}</h3>
                        <div className="wagon-type-price">{formatPrice(wagon.price)} ₽</div>
                        <div className="wagon-type-features">
                          {wagon.features.slice(0, 2).map((feature, index) => (
                            <div key={index} className="wagon-type-feature">
                              • {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="wagon-type-badge">
                        <span className="available-seats">
                          {wagon.availableSeats} мест
                        </span>
                      </div>
                      {selectedWagon?.id === wagon.id && (
                        <div className="wagon-selected-indicator">
                          <div className="wagon-selected-check">✓</div>
                          <span>Выбрано</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {selectedWagon && (
                  <div className="selected-wagon-info">
                    <div className="selected-wagon-summary">
                      <strong>Выбран:</strong> {selectedWagon.name} вагон №{selectedWagon.number} • 
                      Цена за место: {formatPrice(selectedWagon.price)} ₽ • 
                      Свободно мест: {selectedWagon.availableSeats}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Выбор мест */}
          {selectedWagon ? (
            <div className="seat-selection-section">
              <div className="section-header">
                <h2>Выбор мест в вагоне №{selectedWagon.number} ({selectedWagon.name})</h2>
                <div className="wagon-info-badge">
                  <span className="wagon-type">{selectedWagon.name}</span>
                  <span className="wagon-available">
                    Свободно: {selectedWagon.availableSeats} мест
                  </span>
                </div>
              </div>

              <div className="seat-map-container">
                <div className="seat-map-wrapper">
                  <h3>Схема расположения мест</h3>
                  <p>Выберите места на схеме (максимум 4 места):</p>
                  
                  {renderSeatGrid()}
                  
                  <div className="seat-map-legend">
                    <div className="legend-item">
                      <div className="legend-color available"></div>
                      <span>Свободно</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color selected"></div>
                      <span>Выбрано</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color unavailable"></div>
                      <span>Занято</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color row-number">Ряд</div>
                      <span>Номер ряда</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-wagon-selected">
              <div className="no-wagon-message">
                <div className="no-wagon-icon">🚂</div>
                <h3>Пожалуйста, выберите тип вагона</h3>
                <p>Чтобы продолжить выбор мест, сначала выберите тип вагона выше</p>
              </div>
            </div>
          )}

          {/* Информация о выборе */}
          <div className="selection-info-card">
            <div className="selection-info-content">
              <div className="selection-info-header">
                <h3>Ваш выбор</h3>
                {selectedSeats.length > 0 && (
                  <button 
                    className="clear-selection-btn"
                    onClick={() => setSelectedSeatsState([])}
                  >
                    Очистить выбор мест
                  </button>
                )}
              </div>
              
              <div className="selection-details">
                <div className="detail-row">
                  <span>Тип вагона:</span>
                  <span className="detail-value">
                    {selectedWagon?.name || 'Не выбран'}
                  </span>
                </div>
                
                <div className="detail-row">
                  <span>Номер вагона:</span>
                  <span className="detail-value">
                    {selectedWagon?.number || '—'}
                  </span>
                </div>
                
                <div className="detail-row">
                  <span>Цена за место:</span>
                  <span className="detail-value">
                    {selectedWagon ? formatPrice(selectedWagon.price) + ' ₽' : '—'}
                  </span>
                </div>
                
                <div className="detail-row">
                  <span>Выбрано мест:</span>
                  <span className="detail-value highlight">
                    {selectedSeats.length} / 4
                  </span>
                </div>
                
                {selectedSeats.length > 0 && (
                  <div className="selected-seats-list">
                    <div className="seats-label">Выбранные места:</div>
                    <div className="seats-numbers">
                      {selectedSeats.sort((a, b) => a - b).map(seat => (
                        <span key={seat} className="seat-badge">
                          {seat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="detail-row total">
                  <span>Общая стоимость:</span>
                  <span className="detail-value price">
                    {formatPrice(calculateTotalPrice())} ₽
                  </span>
                </div>
              </div>
              
              <button 
                className="continue-btn"
                onClick={handleContinue}
                disabled={!selectedWagon || selectedSeats.length === 0}
              >
                {!selectedWagon ? 'Выберите вагон' : 
                 selectedSeats.length === 0 ? 'Выберите места' : 
                 `Перейти к пассажирам (${formatPrice(calculateTotalPrice())} ₽)`}
              </button>
            </div>
          </div>
        </main>

        {/* Боковая панель */}
        <aside className="seats-selection-sidebar">
          {/* Статистика */}
          <div className="sidebar-card stats-card">
            <h3>Статистика выбора</h3>
            <div className="stats-content">
              <div className="stat-item">
                <div className="stat-label">Всего мест в вагоне:</div>
                <div className="stat-value">
                  {selectedWagon?.totalSeats || 0}
                </div>
              </div>
              
              <div className="stat-item">
                <div className="stat-label">Свободно мест:</div>
                <div className="stat-value available">
                  {selectedWagon?.availableSeats || 0}
                </div>
              </div>
              
              <div className="stat-item">
                <div className="stat-label">Занято мест:</div>
                <div className="stat-value occupied">
                  {(selectedWagon?.totalSeats || 0) - (selectedWagon?.availableSeats || 0)}
                </div>
              </div>
              
              <div className="stat-item">
                <div className="stat-label">Вы выбрали:</div>
                <div className="stat-value selected">
                  {selectedSeats.length} мест
                </div>
              </div>
            </div>
          </div>

          {/* Подсказки */}
          <div className="sidebar-card tips-card">
            <h3>Полезные советы</h3>
            <ul className="tips-list">
              <li className="tip">
                <span className="tip-icon">💺</span>
                <span className="tip-text">
                  Нажмите на свободное место, чтобы выбрать его
                </span>
              </li>
              <li className="tip">
                <span className="tip-icon">🚂</span>
                <span className="tip-text">
                  Можно выбрать до 4 мест одновременно
                </span>
              </li>
              <li className="tip">
                <span className="tip-icon">🔁</span>
                <span className="tip-text">
                  Нажмите на выбранное место, чтобы отменить выбор
                </span>
              </li>
              <li className="tip">
                <span className="tip-icon">👥</span>
                <span className="tip-text">
                  Выбирайте места в одном ряду для удобства
                </span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default SeatsSelectionPage;
