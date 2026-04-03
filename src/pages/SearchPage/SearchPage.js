import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTicket } from '../../context/TicketContext';
import { trainApi } from '../../services/api';
import OrderSteps from '../../components/OrderSteps/OrderSteps';
import TrainCard from '../../components/TrainCard/TrainCard';
import LastTickets from '../../components/LastTickets/LastTickets';
import './SearchPage.css';

// Ценовые категории
const priceRanges = [
  { id: 'all', label: 'Любая цена', min: 0, max: Infinity },
  { id: 'budget', label: 'до 2500 ₽', min: 0, max: 2500 },
  { id: 'medium', label: '2500 - 4000 ₽', min: 2500, max: 4000 },
  { id: 'premium', label: 'от 4000 ₽', min: 4000, max: Infinity },
];

// Типы вагонов - УПРОЩЕННОЕ СООТВЕТСТВИЕ
const wagonTypes = [
  { id: 'all', label: 'Все типы', icon: '🚂', types: ['all'] },
  { id: 'coupe', label: 'Купе', icon: '🚂', types: ['coupe', 'second'] },
  { id: 'platzkart', label: 'Плацкарт', icon: '🛌', types: ['platzkart', 'third'] },
  { id: 'sitting', label: 'Сидячий', icon: '💺', types: ['sitting', 'fourth'] },
  { id: 'lux', label: 'Люкс', icon: '⭐', types: ['lux', 'first'] },
];

function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { searchParams, setSelectedTrain } = useTicket();
  const [trains, setTrains] = useState([]);
  const [filteredTrains, setFilteredTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    priceRange: 'all',
    wagonType: 'all',
    departureTime: 'any',
    hasWifi: false,
    hasConditioner: false,
    hasLinens: false
  });
  const [sortBy, setSortBy] = useState('departureTime');

  // Функция для проверки, подходит ли поезд под выбранный тип вагона
  const hasWagonType = useCallback((train, wagonTypeId) => {
    if (wagonTypeId === 'all') return true;
    
    const selectedWagonType = wagonTypes.find(t => t.id === wagonTypeId);
    if (!selectedWagonType || !train.wagons) return false;
    
    // Если выбраны конкретные типы для фильтрации
    if (selectedWagonType.types && selectedWagonType.types[0] !== 'all') {
      return train.wagons.some(wagon => {
        const wagonTypeLower = (wagon.type || '').toLowerCase();
        const wagonApiTypeLower = (wagon.apiType || '').toLowerCase();
        
        // Проверяем соответствие по всем возможным вариантам
        return selectedWagonType.types.some(type => 
          wagonTypeLower === type || 
          wagonApiTypeLower === type ||
          (type === 'coupe' && (wagonTypeLower === 'second' || wagonApiTypeLower === 'second')) ||
          (type === 'platzkart' && (wagonTypeLower === 'third' || wagonApiTypeLower === 'third')) ||
          (type === 'sitting' && (wagonTypeLower === 'fourth' || wagonApiTypeLower === 'fourth')) ||
          (type === 'lux' && (wagonTypeLower === 'first' || wagonApiTypeLower === 'first'))
        );
      });
    }
    
    return true;
  }, []);

  // Функция для получения минимальной цены поезда
  const getTrainMinPrice = useCallback((train, wagonTypeFilter) => {
    if (!train.wagons || train.wagons.length === 0) {
      return Infinity;
    }
    
    let relevantWagons = train.wagons;
    
    // Если выбран конкретный тип вагона, фильтруем только вагоны этого типа
    if (wagonTypeFilter !== 'all') {
      const selectedWagonType = wagonTypes.find(t => t.id === wagonTypeFilter);
      if (selectedWagonType && selectedWagonType.types) {
        relevantWagons = train.wagons.filter(wagon => {
          const wagonTypeLower = (wagon.type || '').toLowerCase();
          const wagonApiTypeLower = (wagon.apiType || '').toLowerCase();
          
          return selectedWagonType.types.some(type => 
            wagonTypeLower === type || 
            wagonApiTypeLower === type ||
            (type === 'coupe' && (wagonTypeLower === 'second' || wagonApiTypeLower === 'second')) ||
            (type === 'platzkart' && (wagonTypeLower === 'third' || wagonApiTypeLower === 'third')) ||
            (type === 'sitting' && (wagonTypeLower === 'fourth' || wagonApiTypeLower === 'fourth')) ||
            (type === 'lux' && (wagonTypeLower === 'first' || wagonApiTypeLower === 'first'))
          );
        });
      }
    }
    
    if (relevantWagons.length === 0) {
      return Infinity;
    }
    
    const prices = relevantWagons
      .map(wagon => wagon.price || wagon.minPrice || wagon.topPrice)
      .filter(price => price && price > 0);
    
    return prices.length > 0 ? Math.min(...prices) : Infinity;
  }, []);

  // Применение всех фильтров
  const applyFilters = useCallback(() => {
    console.log('=== ПРИМЕНЕНИЕ ФИЛЬТРОВ ===');
    console.log('Текущие фильтры:', filters);
    console.log('Всего поездов:', trains.length);
    
    let filtered = [...trains];
    
    // 1. Фильтр по типу вагона
    if (filters.wagonType !== 'all') {
      filtered = filtered.filter(train => {
        const result = hasWagonType(train, filters.wagonType);
        if (result) {
          console.log(`Поезд ${train.number} подходит под тип ${filters.wagonType}`);
        }
        return result;
      });
      console.log(`После фильтра по типу вагона (${filters.wagonType}): ${filtered.length} поездов`);
    }

    // 2. Фильтр по ценовому диапазону
    const priceRange = priceRanges.find(range => range.id === filters.priceRange);
    if (priceRange && priceRange.id !== 'all') {
      filtered = filtered.filter(train => {
        const minPrice = getTrainMinPrice(train, filters.wagonType);
        const inRange = minPrice >= priceRange.min && minPrice <= priceRange.max;
        if (inRange) {
          console.log(`Поезд ${train.number} (мин. цена ${minPrice}) подходит под цену ${filters.priceRange}`);
        }
        return inRange;
      });
      console.log(`После фильтра по цене: ${filtered.length} поездов`);
    }

    // 3. Фильтр по времени отправления
    if (filters.departureTime !== 'any') {
      filtered = filtered.filter(train => {
        try {
          if (!train.departureTime) return false;
          const departureTime = new Date(train.departureTime);
          const hour = departureTime.getHours();
          
          const ranges = {
            morning: hour >= 5 && hour < 12,
            day: hour >= 12 && hour < 18,
            evening: hour >= 18 && hour < 23,
            night: hour >= 23 || hour < 5
          };
          
          return ranges[filters.departureTime] || false;
        } catch {
          return false;
        }
      });
      console.log(`После фильтра по времени: ${filtered.length} поездов`);
    }

    // 4. Фильтр по услугам
    if (filters.hasWifi) {
      filtered = filtered.filter(train => train.hasWifi === true);
    }
    if (filters.hasConditioner) {
      filtered = filtered.filter(train => train.hasConditioner === true);
    }
    if (filters.hasLinens) {
      filtered = filtered.filter(train => train.hasLinens === true);
    }
    
    console.log(`После всех фильтров: ${filtered.length} поездов`);
    
    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': {
          const priceA = getTrainMinPrice(a, filters.wagonType);
          const priceB = getTrainMinPrice(b, filters.wagonType);
          return priceA - priceB;
        }
        case 'price-desc': {
          const priceA = getTrainMinPrice(a, filters.wagonType);
          const priceB = getTrainMinPrice(b, filters.wagonType);
          return priceB - priceA;
        }
        case 'duration':
          return (a.duration || 0) - (b.duration || 0);
        case 'departureTime':
        default:
          try {
            return new Date(a.departureTime || 0) - new Date(b.departureTime || 0);
          } catch {
            return 0;
          }
      }
    });
    
    setFilteredTrains(filtered);
  }, [trains, filters, sortBy, hasWagonType, getTrainMinPrice]);

  // Применяем фильтры при их изменении
  useEffect(() => {
    if (trains.length > 0) {
      applyFilters();
    }
  }, [applyFilters, trains.length]);

  // Загрузка данных о поездах
  useEffect(() => {
    const fetchTrains = async () => {
      console.log('🔍 Загрузка поездов...');
      
      // Используем моковые данные для тестирования
      const mockTrains = getMockTrains();
      console.log('Загружено поездов:', mockTrains.length);
      
      // Выводим информацию о типах вагонов в каждом поезде
      mockTrains.forEach(train => {
        console.log(`Поезд ${train.number}:`);
        train.wagons?.forEach(wagon => {
          console.log(`  - Вагон: тип="${wagon.type}", apiType="${wagon.apiType}", цена=${wagon.price}`);
        });
      });
      
      setTrains(mockTrains);
      setFilteredTrains(mockTrains);
      setLoading(false);
    };

    fetchTrains();
  }, []);

  const handleFilterChange = (filterName, value) => {
    console.log(`🔄 Изменение фильтра ${filterName}:`, value);
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleResetFilters = () => {
    console.log('🔄 Сброс всех фильтров');
    setFilters({
      priceRange: 'all',
      wagonType: 'all',
      departureTime: 'any',
      hasWifi: false,
      hasConditioner: false,
      hasLinens: false
    });
  };

  const handleTrainSelect = async (train) => {
    try {
      setSelectedTrain({
        ...train,
        originalData: train
      });
      navigate('/seats');
    } catch (error) {
      console.error('Ошибка при выборе поезда:', error);
      alert('Произошла ошибка при выборе поезда. Пожалуйста, попробуйте еще раз.');
    }
  };

  const handleLastTicketClick = (ticketData) => {
    let wagonType = 'coupe';
    let wagonName = 'Купе';
    
    if (ticketData.wagonType === 'first') {
      wagonType = 'lux';
      wagonName = 'Люкс';
    } else if (ticketData.wagonType === 'second') {
      wagonType = 'coupe';
      wagonName = 'Купе';
    } else if (ticketData.wagonType === 'third') {
      wagonType = 'platzkart';
      wagonName = 'Плацкарт';
    } else if (ticketData.wagonType === 'fourth') {
      wagonType = 'sitting';
      wagonName = 'Сидячий';
    }
    
    const trainFromTicket = {
      id: `${ticketData.trainNumber}-${Date.now()}`,
      number: ticketData.trainNumber,
      name: `${ticketData.fromCity} → ${ticketData.toCity}`,
      fromCity: ticketData.fromCity,
      fromStation: ticketData.fromStation,
      toCity: ticketData.toCity,
      toStation: ticketData.toStation,
      departureTime: ticketData.departureDate ? 
        `${ticketData.departureDate.split('.').reverse().join('-')}T${ticketData.departureTime || '00:00'}:00` : 
        new Date().toISOString(),
      arrivalTime: ticketData.arrivalDate ? 
        `${ticketData.arrivalDate.split('.').reverse().join('-')}T${ticketData.arrivalTime || '00:00'}:00` : 
        new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      duration: ticketData.duration || 300,
      minPrice: ticketData.price || 2000,
      wagons: [
        { 
          id: `wagon-${ticketData.id}`,
          type: wagonType, 
          name: wagonName,
          apiType: ticketData.wagonType,
          price: ticketData.price || 2000, 
          availableSeats: 10,
        }
      ],
      hasWifi: true,
      hasConditioner: true,
      hasLinens: true
    };
    
    setSelectedTrain(trainFromTicket);
    navigate('/seats');
  };

  // Моковые данные с правильными типами вагонов
  const getMockTrains = () => {
    return [
      {
        id: '116C-001',
        number: '116C',
        name: 'Москва → Санкт-Петербург',
        fromCity: 'Москва',
        fromStation: 'Ленинградский вокзал',
        toCity: 'Санкт-Петербург',
        toStation: 'Московский вокзал',
        departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        arrivalTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
        duration: 615,
        minPrice: 1920,
        wagons: [
          { type: 'sitting', name: 'Сидячий', apiType: 'fourth', price: 1920, availableSeats: 35 },
          { type: 'platzkart', name: 'Плацкарт', apiType: 'third', price: 2530, availableSeats: 24 },
          { type: 'coupe', name: 'Купе', apiType: 'second', price: 3820, availableSeats: 15 },
          { type: 'lux', name: 'Люкс', apiType: 'first', price: 4950, availableSeats: 8 }
        ],
        hasWifi: true,
        hasConditioner: true,
        hasLinens: true
      },
      {
        id: '117C-002',
        number: '117C',
        name: 'Москва → Казань',
        fromCity: 'Москва',
        fromStation: 'Казанский вокзал',
        toCity: 'Казань',
        toStation: 'Казанский вокзал',
        departureTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        arrivalTime: new Date(Date.now() + 48 * 60 * 60 * 1000 + 8.75 * 60 * 60 * 1000).toISOString(),
        duration: 525,
        minPrice: 1800,
        wagons: [
          { type: 'sitting', name: 'Сидячий', apiType: 'fourth', price: 1800, availableSeats: 42 },
          { type: 'platzkart', name: 'Плацкарт', apiType: 'third', price: 2400, availableSeats: 32 },
          { type: 'coupe', name: 'Купе', apiType: 'second', price: 3600, availableSeats: 18 }
        ],
        hasWifi: false,
        hasConditioner: true,
        hasLinens: true
      },
      {
        id: '118C-003',
        number: '118C',
        name: 'Санкт-Петербург → Москва',
        fromCity: 'Санкт-Петербург',
        fromStation: 'Московский вокзал',
        toCity: 'Москва',
        toStation: 'Ленинградский вокзал',
        departureTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        arrivalTime: new Date(Date.now() + 72 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(),
        duration: 540,
        minPrice: 2100,
        wagons: [
          { type: 'sitting', name: 'Сидячий', apiType: 'fourth', price: 2100, availableSeats: 28 },
          { type: 'platzkart', name: 'Плацкарт', apiType: 'third', price: 2900, availableSeats: 20 },
          { type: 'coupe', name: 'Купе', apiType: 'second', price: 4100, availableSeats: 12 }
        ],
        hasWifi: true,
        hasConditioner: true,
        hasLinens: true
      }
    ];
  };

  const timeRanges = [
    { value: 'any', label: 'Любое время' },
    { value: 'morning', label: 'Утро (5:00 - 12:00)' },
    { value: 'day', label: 'День (12:00 - 18:00)' },
    { value: 'evening', label: 'Вечер (18:00 - 23:00)' },
    { value: 'night', label: 'Ночь (23:00 - 5:00)' }
  ];

  const sortOptions = [
    { value: 'departureTime', label: 'По времени отправления' },
    { value: 'price-asc', label: 'По цене (сначала дешевые)' },
    { value: 'price-desc', label: 'По цене (сначала дорогие)' },
    { value: 'duration', label: 'По времени в пути' }
  ];

  const formatPrice = (price) => {
    return price.toLocaleString('ru-RU');
  };

  return (
    <div className="search-page">
      <OrderSteps />

      <div className="search-page__container">
        <aside className="search-page__sidebar">
          <div className="filters">
            <h3 className="filters__title">Фильтры</h3>

            {/* Тип вагона */}
            <div className="filters__section">
              <h4 className="filters__section-title">Тип вагона</h4>
              <div className="filters__options filters__options--grid">
                {wagonTypes.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    className={`filters__option-btn ${filters.wagonType === type.id ? 'active' : ''}`}
                    onClick={() => handleFilterChange('wagonType', type.id)}
                  >
                    <span className="filters__option-icon">{type.icon}</span>
                    <span className="filters__option-label">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ценовой диапазон */}
            <div className="filters__section">
              <h4 className="filters__section-title">Ценовой диапазон</h4>
              <div className="filters__options filters__options--grid">
                {priceRanges.map(range => (
                  <button
                    key={range.id}
                    type="button"
                    className={`filters__option-btn ${filters.priceRange === range.id ? 'active' : ''}`}
                    onClick={() => handleFilterChange('priceRange', range.id)}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Время отправления */}
            <div className="filters__section">
              <h4 className="filters__section-title">Время отправления</h4>
              <div className="filters__options">
                {timeRanges.map(range => (
                  <label key={range.value} className="filters__option">
                    <input
                      type="radio"
                      name="departureTime"
                      value={range.value}
                      checked={filters.departureTime === range.value}
                      onChange={(e) => handleFilterChange('departureTime', e.target.value)}
                      className="filters__radio"
                    />
                    <span className="filters__option-label">{range.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Услуги */}
            <div className="filters__section">
              <h4 className="filters__section-title">Услуги</h4>
              <div className="filters__options">
                <label className="filters__option filters__option--checkbox">
                  <input
                    type="checkbox"
                    checked={filters.hasWifi}
                    onChange={(e) => handleFilterChange('hasWifi', e.target.checked)}
                    className="filters__checkbox"
                  />
                  <span className="filters__option-label">
                    <span className="filters__option-icon">📶</span>
                    Wi-Fi
                  </span>
                </label>
                <label className="filters__option filters__option--checkbox">
                  <input
                    type="checkbox"
                    checked={filters.hasConditioner}
                    onChange={(e) => handleFilterChange('hasConditioner', e.target.checked)}
                    className="filters__checkbox"
                  />
                  <span className="filters__option-label">
                    <span className="filters__option-icon">❄️</span>
                    Кондиционер
                  </span>
                </label>
                <label className="filters__option filters__option--checkbox">
                  <input
                    type="checkbox"
                    checked={filters.hasLinens}
                    onChange={(e) => handleFilterChange('hasLinens', e.target.checked)}
                    className="filters__checkbox"
                  />
                  <span className="filters__option-label">
                    <span className="filters__option-icon">🛏️</span>
                    Белье включено
                  </span>
                </label>
              </div>
            </div>

            <button 
              className="filters__reset"
              onClick={handleResetFilters}
            >
              Сбросить все фильтры
            </button>
          </div>

          <div className="sidebar__last-tickets">
            <LastTickets onTicketClick={handleLastTicketClick} />
          </div>
        </aside>

        <main className="search-page__main">
          <div className="search-results__header">
            <div className="search-results__title-wrapper">
              <h2 className="search-results__title">
                Найдено {filteredTrains.length} поездов
                {searchParams && (
                  <span className="search-results__route">
                    {searchParams.from} → {searchParams.to}
                  </span>
                )}
              </h2>
              
              {filteredTrains.length > 0 && (
                <div className="search-results__stats">
                  <div className="search-results__stat">
                    <span className="search-results__stat-label">Средняя цена:</span>
                    <span className="search-results__stat-value">
                      {(() => {
                        const validPrices = filteredTrains
                          .map(train => getTrainMinPrice(train, filters.wagonType))
                          .filter(price => price !== Infinity && price > 0);
                        
                        if (validPrices.length === 0) return '— ₽';
                        const average = validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;
                        return `${formatPrice(Math.round(average))} ₽`;
                      })()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="search-results__sort">
              <select 
                className="search-results__sort-select"
                value={sortBy}
                onChange={handleSortChange}
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && !loading && trains.length === 0 && (
            <div className="search-results__error">
              <div className="search-results__error-icon">⚠️</div>
              <div className="search-results__error-text">{error}</div>
            </div>
          )}

          <div className="search-results">
            {loading ? (
              <div className="search-results__loading">
                <div className="loading-spinner"></div>
                <p>Идет поиск поездов...</p>
              </div>
            ) : filteredTrains.length > 0 ? (
              filteredTrains.map(train => (
                <TrainCard 
                  key={train.id}
                  train={train}
                  onSelect={handleTrainSelect}
                />
              ))
            ) : (
              <div className="search-results__empty">
                <div className="search-results__empty-icon">🔍</div>
                <h3 className="search-results__empty-title">Поезда не найдены</h3>
                <p className="search-results__empty-text">
                  Попробуйте изменить параметры фильтров
                </p>
                <button 
                  className="search-results__empty-button"
                  onClick={handleResetFilters}
                >
                  Сбросить фильтры
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default SearchPage;
