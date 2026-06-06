import React, { useState, useEffect, useCallback } from 'react';
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
  const { 
    selectedTrain, 
    setSelectedWagon: setSelectedWagonContext, 
    setSelectedSeats: setSelectedSeatsContext 
  } = useTicket();
  
  // Локальное состояние
  const [selectedWagon, setSelectedWagonLocal] = useState(null);
  const [selectedSeats, setSelectedSeatsLocal] = useState([]);
  const [availableWagons, setAvailableWagons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seatMap, setSeatMap] = useState([]);

  // Функция для получения цены по умолчанию
  const getDefaultPrice = useCallback((type) => {
    const prices = {
      'lux': 0,
      'coupe': 0,
      'platzkart': 0,
      'sitting': 0
    };
    return prices[type] || 0;
  }, []);

  // Функция для генерации занятых мест на основе данных из API
  const generateOccupiedSeats = useCallback((totalSeats, availableSeats, apiSeats = null) => {
    const occupiedSeats = [];
    
    // Если есть данные из API, используем их
    if (apiSeats && Array.isArray(apiSeats) && apiSeats.length > 0) {
      apiSeats.forEach(seat => {
        if (!seat.available && seat.index !== undefined) {
          // API может возвращать index начиная с 0
          const seatNumber = seat.index + 1;
          if (!occupiedSeats.includes(seatNumber) && seatNumber <= totalSeats) {
            occupiedSeats.push(seatNumber);
          }
        }
      });
      
      if (occupiedSeats.length > 0) {
        console.log('Занятые места из API:', occupiedSeats);
        return occupiedSeats;
      }
    }
    
    // Если API не вернул данные, генерируем на основе доступного количества
    const occupiedCount = Math.max(0, totalSeats - availableSeats);
    
    for (let i = 0; i < occupiedCount; i++) {
      let seat;
      do {
        seat = Math.floor(Math.random() * totalSeats) + 1;
      } while (occupiedSeats.includes(seat));
      occupiedSeats.push(seat);
    }
    
    return occupiedSeats;
  }, []);

  // Функция для загрузки данных о местах через API
  const fetchSeatsFromApi = useCallback(async (routeId, wagonApiType) => {
    try {
      const seatsData = await trainApi.getRouteSeats(routeId, { 
        have_first_class: wagonApiType === 'first',
        have_second_class: wagonApiType === 'second',
        have_third_class: wagonApiType === 'third',
        have_fourth_class: wagonApiType === 'fourth'
      });
      
      if (seatsData && Array.isArray(seatsData) && seatsData.length > 0) {
        console.log('Получены данные о местах из API:', seatsData.length, 'записей');
        return seatsData;
      }
      return null;
    } catch (error) {
      console.log('API не вернул данные о местах, используем расчет:', error.message);
      return null;
    }
  }, []);

  // Обработчик выбора вагона
  const handleWagonSelect = useCallback(async (wagon) => {
    console.log('Выбран вагон:', wagon);
    setSelectedWagonLocal(wagon);
    setSelectedSeatsLocal([]);
  }, []);

  // Обработчик выбора места
  const handleSeatSelect = useCallback((seatNumber) => {
    const seat = seatMap.find(s => s.number === seatNumber);
    if (!seat || !seat.available) {
      alert('Это место уже занято или недоступно');
      return;
    }

    setSelectedSeatsLocal(prev => {
      if (prev.includes(seatNumber)) {
        return prev.filter(s => s !== seatNumber);
      } else {
        if (prev.length < 4) {
          return [...prev, seatNumber];
        } else {
          alert('Максимальное количество мест для бронирования - 4');
          return prev;
        }
      }
    });
  }, [seatMap]);

  // Загрузка данных о вагонах
  useEffect(() => {
    const fetchSeatsData = async () => {
      if (!selectedTrain) {
        console.warn('Нет выбранного поезда, перенаправляем на поиск');
        navigate('/search');
        return;
      }

      const trainData = selectedTrain.originalData || selectedTrain.train || selectedTrain;

      if (!trainData || !trainData.number) {
        setError('Данные о поезде повреждены или неполны. Пожалуйста, начните поиск заново.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('Загружаем места для поезда:', trainData);

        if (trainData.wagons && trainData.wagons.length > 0) {
          // Загружаем данные для каждого типа вагона параллельно
          const wagonsPromises = trainData.wagons.map(async (wagon, index) => {
            const wagonTypeConfig = wagonTypesConfig.find(w => 
              w.type === (wagon.type || wagon.apiType)
            ) || wagonTypesConfig.find(w => 
              w.type === (wagon.apiType || wagon.type)
            ) || wagonTypesConfig[1];

            // Пытаемся получить данные о местах из API
            const routeId = trainData.id || selectedTrain.id;
            let apiSeats = null;
            if (routeId) {
              apiSeats = await fetchSeatsFromApi(routeId, wagon.apiType || wagon.type);
            }

            return {
              ...wagonTypeConfig,
              id: wagon.id || `wagon-${wagon.type}-${index}`,
              number: wagon.number || (index + 1),
              type: wagon.type || wagon.apiType,
              name: wagon.name || wagonTypeConfig.name,
              totalSeats: wagon.totalSeats || wagonTypeConfig.totalSeats,
              availableSeats: apiSeats 
                ? apiSeats.filter(s => s.available).length 
                : (wagon.availableSeats || 0),
              price: wagon.price || 0,
              features: wagonTypeConfig.features,
              icon: wagonTypeConfig.icon,
              seatsPerRow: wagonTypeConfig.seatsPerRow,
              apiSeats: apiSeats // Сохраняем для использования при генерации карты мест
            };
          });

          const wagons = await Promise.all(wagonsPromises);
          console.log('Сформированные вагоны:', wagons);
          setAvailableWagons(wagons);
        } else {
          console.warn('У поезда нет доступных вагонов');
          setAvailableWagons([]);
          setError('У этого поезда нет доступных вагонов');
        }
      } catch (err) {
        console.error('Ошибка при загрузке мест:', err);
        setError('Не удалось загрузить информацию о местах');
        setAvailableWagons([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSeatsData();
  }, [selectedTrain, navigate, getDefaultPrice, fetchSeatsFromApi]);

  // Выбор первого вагона по умолчанию
  useEffect(() => {
    if (availableWagons.length > 0 && !selectedWagon) {
      handleWagonSelect(availableWagons[0]);
    }
  }, [availableWagons, selectedWagon, handleWagonSelect]);

  // Генерация карты мест при выборе вагона
  useEffect(() => {
    if (!selectedWagon) return;

    const generateSeatMap = () => {
      const seats = [];
      const occupiedSeats = generateOccupiedSeats(
        selectedWagon.totalSeats, 
        selectedWagon.availableSeats,
        selectedWagon.apiSeats
      );
      
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
    setSelectedSeatsLocal([]);
    
    console.log(`Сгенерирована карта мест для вагона ${selectedWagon.type}:`, newSeatMap.length, 'мест');
  }, [selectedWagon, generateOccupiedSeats]);

  // Функция для расчета общей стоимости
  const calculateTotalPrice = useCallback(() => {
    if (!selectedWagon || selectedSeats.length === 0) return 0;
    return selectedSeats.length * selectedWagon.price;
  }, [selectedWagon, selectedSeats]);

  // Обработчик продолжения
  const handleContinue = useCallback(() => {
    if (selectedSeats.length === 0) {
      alert('Пожалуйста, выберите хотя бы одно место');
      return;
    }
    
    const trainData = selectedTrain.originalData || selectedTrain.train || selectedTrain;
    
    const bookingData = {
      train: {
        id: trainData.id || selectedTrain.id,
        number: trainData.number,
        name: `${trainData.fromCity} → ${trainData.toCity}`,
        fromCity: trainData.fromCity,
        toCity: trainData.toCity,
        fromStation: trainData.fromStation,
        toStation: trainData.toStation,
        departureTime: trainData.departureTime,
        arrivalTime: trainData.arrivalTime,
        departureDate: trainData.departureDate,
        arrivalDate: trainData.arrivalDate
      },
      wagon: {
        id: selectedWagon.id,
        type: selectedWagon.type,
        name: selectedWagon.name,
        number: selectedWagon.number,
        price: selectedWagon.price
      },
      seats: selectedSeats.map(seatNumber => ({
        number: seatNumber,
        price: selectedWagon.price
      })),
      totalPrice: calculateTotalPrice()
    };
    
    console.log('📦 Данные для API (бронирование):', bookingData);
    
    setSelectedWagonContext({
      ...selectedWagon,
      bookingData: bookingData
    });
    setSelectedSeatsContext(selectedSeats);
    
    localStorage.setItem('bookingData', JSON.stringify(bookingData));
    localStorage.setItem('selectedWagon', JSON.stringify(selectedWagon));
    localStorage.setItem('selectedSeats', JSON.stringify(selectedSeats));
    
    navigate('/passengers');
  }, [
    selectedWagon, 
    selectedSeats, 
    calculateTotalPrice, 
    setSelectedWagonContext, 
    setSelectedSeatsContext, 
    navigate, 
    selectedTrain
  ]);

  // Форматирование цены
  const formatPrice = useCallback((price) => {
    return price ? price.toLocaleString('ru-RU') : '0';
  }, []);

  // Состояние загрузки
  if (loading) {
    return (
      <div className="seats-selection-page loading">
        <div className="loading-spinner"></div>
        <p>Загрузка доступных мест...</p>
      </div>
    );
  }

  // Состояние ошибки - нет поезда
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

  const trainData = selectedTrain.originalData || selectedTrain.train || selectedTrain;

  // Функция для отображения мест в виде сетки
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

  return (
    <div className="seats-selection-page">
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
          <div className="trip-summary">
            <h1 className="trip-summary__title">Выбор мест в вагоне</h1>
            <div className="trip-summary__info">
              <div className="trip-summary__train">
                <span className="train-number">Поезд №{trainData.number}</span>
                <span className="train-route">
                  {trainData.fromCity} → {trainData.toCity}
                </span>
              </div>
              
              <div className="trip-summary__details">
                <div className="trip-detail">
                  <div className="trip-detail__station">{trainData.fromStation}</div>
                  <div className="trip-detail__time">
                    {trainData.departureDate || new Date(trainData.departureTime).toLocaleDateString('ru-RU')}, 
                    {new Date(trainData.departureTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                
                <div className="trip-detail-separator">↓</div>
                
                <div className="trip-detail">
                  <div className="trip-detail__station">{trainData.toStation}</div>
                  <div className="trip-detail__time">
                    {trainData.arrivalDate || new Date(trainData.arrivalTime).toLocaleDateString('ru-RU')}, 
                    {new Date(trainData.arrivalTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="error-notice">
              <div className="error-notice__icon">⚠️</div>
              <div className="error-notice__text">{error}</div>
            </div>
          )}

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
                      style={{ cursor: 'pointer' }}
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

          <div className="selection-info-card">
            <div className="selection-info-content">
              <div className="selection-info-header">
                <h3>Ваш выбор</h3>
                {selectedSeats.length > 0 && (
                  <button 
                    className="clear-selection-btn"
                    onClick={() => setSelectedSeatsLocal([])}
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

        <aside className="seats-selection-sidebar">
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