import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTicket } from '../../context/TicketContext';
import { trainApi } from '../../services/api';
import OrderSteps from '../../components/OrderSteps/OrderSteps';
import TrainCard from '../../components/TrainCard/TrainCard';
import LastTickets from '../../components/LastTickets/LastTickets';
import './SearchPage.css';

const priceRanges = [
  { id: 'all', label: 'Любая цена', min: 0, max: Infinity },
  { id: 'budget', label: 'до 2500 ₽', min: 0, max: 2500 },
  { id: 'medium', label: '2500 - 4000 ₽', min: 2500, max: 4000 },
  { id: 'premium', label: 'от 4000 ₽', min: 4000, max: Infinity },
];

const wagonTypes = [
  { id: 'all', label: 'Все типы', icon: '🚂', apiTypes: ['first', 'second', 'third', 'fourth'] },
  { id: 'lux', label: 'Люкс', icon: '⭐', apiTypes: ['first'] },
  { id: 'coupe', label: 'Купе', icon: '🚂', apiTypes: ['second'] },
  { id: 'platzkart', label: 'Плацкарт', icon: '🛌', apiTypes: ['third'] },
  { id: 'sitting', label: 'Сидячий', icon: '💺', apiTypes: ['fourth'] },
];

const timeRanges = [
  { value: 'any', label: 'Любое время' },
  { value: 'morning', label: 'Утро (5:00–12:00)' },
  { value: 'day', label: 'День (12:00–18:00)' },
  { value: 'evening', label: 'Вечер (18:00–23:00)' },
  { value: 'night', label: 'Ночь (23:00–5:00)' }
];

function formatDate(date) {
  if (!date || isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ru-RU');
}

function formatTime(date) {
  if (!date || isNaN(date.getTime())) return '';
  return date.toISOString();
}

const MOCK_TRAINS_CACHE = {};

function generateMockTrains(fromCity, toCity) {
  const cacheKey = `${fromCity}_${toCity}`;
  
  if (MOCK_TRAINS_CACHE[cacheKey]) {
    return JSON.parse(JSON.stringify(MOCK_TRAINS_CACHE[cacheKey]));
  }
  
  const trains = [];
  const trainData = [
    { number: '116C', name: 'Сапсан', type: 'express', departureHour: 6, departureMinute: 0, durationMinutes: 240 },
    { number: '044A', name: 'Невский экспресс', type: 'express', departureHour: 10, departureMinute: 15, durationMinutes: 300 },
    { number: '720A', name: 'Татарстан', type: 'regular', departureHour: 14, departureMinute: 30, durationMinutes: 720 },
    { number: '256B', name: 'Урал', type: 'regular', departureHour: 18, departureMinute: 45, durationMinutes: 1080 },
    { number: '302H', name: 'Волга', type: 'regular', departureHour: 22, departureMinute: 0, durationMinutes: 1440 },
  ];

  for (let i = 0; i < trainData.length; i++) {
    const data = trainData[i];
    const departureDate = new Date(2024, 4, 20, data.departureHour, data.departureMinute, 0);
    const arrivalDate = new Date(departureDate.getTime() + data.durationMinutes * 60000);
    
    const trainId = `mock-${cacheKey}-${i}`;
    const wagons = [];
    
    wagons.push({
      id: `${trainId}-coupe`, type: 'coupe', name: 'Купе', apiType: 'second',
      price: 2000 + i * 500, availableSeats: 10, topPrice: 2300 + i * 500
    });
    
    wagons.push({
      id: `${trainId}-platzkart`, type: 'platzkart', name: 'Плацкарт', apiType: 'third',
      price: 1200 + i * 300, availableSeats: 20, topPrice: 1350 + i * 300
    });
    
    if (data.type === 'express') {
      wagons.push({
        id: `${trainId}-lux`, type: 'lux', name: 'Люкс', apiType: 'first',
        price: 4000 + i * 800, availableSeats: 5, topPrice: 4500 + i * 800
      });
    }
    
    if (i !== 2) {
      wagons.push({
        id: `${trainId}-sitting`, type: 'sitting', name: 'Сидячий', apiType: 'fourth',
        price: 800 + i * 200, availableSeats: 15, topPrice: 900 + i * 200
      });
    }

    trains.push({
      id: trainId,
      number: data.number,
      name: data.name,
      fromCity, toCity,
      fromStation: 'Центральный вокзал',
      toStation: 'Главный вокзал',
      departureTime: formatTime(departureDate),
      arrivalTime: formatTime(arrivalDate),
      departureDate: formatDate(departureDate),
      arrivalDate: formatDate(arrivalDate),
      duration: data.durationMinutes,
      minPrice: Math.min(...wagons.map(w => w.price)),
      wagons,
      hasWifi: i % 2 === 0,
      hasConditioner: i !== 1,
      hasLinens: i !== 3
    });
  }
  
  MOCK_TRAINS_CACHE[cacheKey] = JSON.parse(JSON.stringify(trains));
  return trains;
}

// Ключ для localStorage
const FILTERS_STORAGE_KEY = 'train_search_filters';

function SearchPage() {
  const navigate = useNavigate();
  const { searchParams, setSelectedTrain } = useTicket();

  const [trains, setTrains] = useState([]);
  const [filteredTrains, setFilteredTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Загружаем фильтры из localStorage при инициализации
  const [filters, setFilters] = useState(() => {
    const defaultFilters = {
      priceRange: 'all',
      wagonType: 'all',
      departureTime: 'any',
      hasWifi: false,
      hasConditioner: false,
      hasLinens: false
    };
    
    try {
      const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultFilters, ...parsed };
      }
    } catch (e) {
      // Игнорируем ошибки парсинга
    }
    
    return defaultFilters;
  });
  
  const [sortBy, setSortBy] = useState('departureTime');

  // Сохраняем фильтры в localStorage при каждом изменении
  useEffect(() => {
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch (e) {
      // Игнорируем ошибки сохранения
    }
  }, [filters]);

  const getTrainMinPrice = useCallback((train, wagonFilter) => {
    if (!train?.wagons?.length) return Infinity;
    if (wagonFilter === 'all') return Math.min(...train.wagons.map(w => w.price));
    
    const selectedWagon = wagonTypes.find(t => t.id === wagonFilter);
    if (!selectedWagon?.apiTypes) return Math.min(...train.wagons.map(w => w.price));
    
    const matchingWagons = train.wagons.filter(w => selectedWagon.apiTypes.includes(w.apiType));
    return matchingWagons.length > 0 ? Math.min(...matchingWagons.map(w => w.price)) : Infinity;
  }, []);

  // Загрузка поездов при изменении searchParams
  useEffect(() => {
    if (!searchParams?.from || !searchParams?.to) {
      setTrains([]);
      setFilteredTrains([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const timer = setTimeout(() => {
      const mockTrains = generateMockTrains(searchParams.from, searchParams.to);
      setTrains(mockTrains);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchParams]);

  // Фильтрация и сортировка при изменении фильтров или поездов
  useEffect(() => {
    if (!trains.length) {
      setFilteredTrains([]);
      return;
    }

    let filtered = [...trains];

    // Фильтр по типу вагона
    if (filters.wagonType !== 'all') {
      const selectedWagon = wagonTypes.find(t => t.id === filters.wagonType);
      if (selectedWagon?.apiTypes) {
        filtered = filtered.filter(train => 
          train.wagons.some(wagon => selectedWagon.apiTypes.includes(wagon.apiType))
        );
      }
    }

    // Фильтр по цене
    if (filters.priceRange !== 'all') {
      const priceRange = priceRanges.find(r => r.id === filters.priceRange);
      if (priceRange) {
        filtered = filtered.filter(train => {
          const minPrice = getTrainMinPrice(train, filters.wagonType);
          return isFinite(minPrice) && minPrice >= priceRange.min && minPrice <= priceRange.max;
        });
      }
    }

    // Фильтр по времени
    if (filters.departureTime !== 'any') {
      filtered = filtered.filter(train => {
        try {
          const date = new Date(train.departureTime);
          if (isNaN(date.getTime())) return false;
          const hour = date.getHours();
          switch (filters.departureTime) {
            case 'morning': return hour >= 5 && hour < 12;
            case 'day': return hour >= 12 && hour < 18;
            case 'evening': return hour >= 18 && hour < 23;
            case 'night': return hour >= 23 || hour < 5;
            default: return true;
          }
        } catch { return false; }
      });
    }

    // Фильтры по услугам
    if (filters.hasWifi) filtered = filtered.filter(train => train.hasWifi);
    if (filters.hasConditioner) filtered = filtered.filter(train => train.hasConditioner);
    if (filters.hasLinens) filtered = filtered.filter(train => train.hasLinens);

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return getTrainMinPrice(a, filters.wagonType) - getTrainMinPrice(b, filters.wagonType);
        case 'price-desc': return getTrainMinPrice(b, filters.wagonType) - getTrainMinPrice(a, filters.wagonType);
        case 'duration': return (a.duration || 0) - (b.duration || 0);
        case 'departureTime':
        default: {
          const timeA = new Date(a.departureTime).getTime();
          const timeB = new Date(b.departureTime).getTime();
          if (isNaN(timeA) || isNaN(timeB)) return 0;
          return timeA - timeB;
        }
      }
    });

    setFilteredTrains(filtered);
  }, [trains, filters, sortBy, getTrainMinPrice]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [filterName]: value };
      return newFilters;
    });
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      priceRange: 'all',
      wagonType: 'all',
      departureTime: 'any',
      hasWifi: false,
      hasConditioner: false,
      hasLinens: false
    };
    setFilters(defaultFilters);
    setSortBy('departureTime');
    localStorage.removeItem(FILTERS_STORAGE_KEY);
  };

  const handleTrainSelect = (train) => {
    setSelectedTrain({ ...train, originalData: train });
    navigate('/seats');
  };

  return (
    <div className="search-page">
      <OrderSteps currentStep={1} />

      <div className="search-page__content">
        <div className="filters">
          <h3 className="filters__title">Фильтры</h3>

          <div className="filters__section">
            <h4 className="filters__section-title">Тип вагона</h4>
            <div className="wagon-types">
              {wagonTypes.map(wagon => (
                <button
                  key={wagon.id}
                  type="button"
                  onClick={() => handleFilterChange('wagonType', wagon.id)}
                  className={`wagon-types__btn ${filters.wagonType === wagon.id ? 'wagon-types__btn--active' : ''}`}
                >
                  <span className="wagon-types__icon">{wagon.icon}</span>
                  <span className="wagon-types__label">{wagon.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="filters__section">
            <h4 className="filters__section-title">Цена</h4>
            <div className="filters__options">
              {priceRanges.map(range => (
                <button
                  key={range.id}
                  type="button"
                  onClick={() => handleFilterChange('priceRange', range.id)}
                  className={`filters__btn ${filters.priceRange === range.id ? 'filters__btn--active' : ''}`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filters__section">
            <h4 className="filters__section-title">Время отправления</h4>
            <div className="filters__options">
              {timeRanges.map(range => (
                <button
                  key={range.value}
                  type="button"
                  onClick={() => handleFilterChange('departureTime', range.value)}
                  className={`filters__btn ${filters.departureTime === range.value ? 'filters__btn--active' : ''}`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filters__section">
            <h4 className="filters__section-title">Услуги в поезде</h4>
            <div className="filters__checkboxes">
              <button
                type="button"
                onClick={() => handleFilterChange('hasWifi', !filters.hasWifi)}
                className={`filters__checkbox-btn ${filters.hasWifi ? 'filters__checkbox-btn--active' : ''}`}
              >
                <span>{filters.hasWifi ? '☑' : '☐'}</span>
                <span>Wi‑Fi</span>
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('hasConditioner', !filters.hasConditioner)}
                className={`filters__checkbox-btn ${filters.hasConditioner ? 'filters__checkbox-btn--active' : ''}`}
              >
                <span>{filters.hasConditioner ? '☑' : '☐'}</span>
                <span>Кондиционер</span>
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('hasLinens', !filters.hasLinens)}
                className={`filters__checkbox-btn ${filters.hasLinens ? 'filters__checkbox-btn--active' : ''}`}
              >
                <span>{filters.hasLinens ? '☑' : '☐'}</span>
                <span>Постельное бельё</span>
              </button>
            </div>
          </div>

          <button onClick={handleResetFilters} className="filters__reset-btn" type="button">
            Сбросить все фильтры
          </button>
        </div>

        <div className="search-results">
          <div className="results-header">
            <h3 className="results-title">Найдено поездов: {filteredTrains.length}</h3>
            <div className="sort-controls">
              <label htmlFor="sort-select" className="sort-label">Сортировка:</label>
              <select id="sort-select" value={sortBy} onChange={handleSortChange} className="sort-select">
                <option value="departureTime">По времени отправления</option>
                <option value="price-asc">По возрастанию цены</option>
                <option value="price-desc">По убыванию цены</option>
                <option value="duration">По длительности поездки</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Загружаем расписание поездов...</p>
            </div>
          )}

          {!loading && filteredTrains.length === 0 && (
            <div className="no-results">
              <p>По вашим фильтрам поездов не найдено</p>
              <button onClick={handleResetFilters} className="reset-filters-link" type="button">
                Сбросить фильтры
              </button>
            </div>
          )}

          {!loading && filteredTrains.length > 0 && (
            <div className="trains-list">
              {filteredTrains.map((train) => (
                <TrainCard 
                  key={train.id} 
                  train={train} 
                  onSelect={handleTrainSelect} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <LastTickets onTicketClick={(ticketData) => {
        const typeMap = {
          'first': { type: 'lux', name: 'Люкс' },
          'second': { type: 'coupe', name: 'Купе' },
          'third': { type: 'platzkart', name: 'Плацкарт' },
          'fourth': { type: 'sitting', name: 'Сидячий' }
        };
        
        const wagonInfo = typeMap[ticketData.wagonApiType] || typeMap['second'];
        const depDate = new Date(2024, 4, 20, 8 + Math.floor(Math.random() * 12));
        const arrDate = new Date(depDate.getTime() + (ticketData.durationMinutes || 300) * 60000);

        setSelectedTrain({
          id: `ticket-${Date.now()}`,
          number: ticketData.trainNumber || '116C',
          name: ticketData.trainName || 'Сапсан',
          fromCity: ticketData.fromCity || '',
          fromStation: ticketData.fromStation || '',
          toCity: ticketData.toCity || '',
          toStation: ticketData.toStation || '',
          departureTime: formatTime(depDate),
          arrivalTime: formatTime(arrDate),
          departureDate: formatDate(depDate),
          arrivalDate: formatDate(arrDate),
          duration: ticketData.durationMinutes || 300,
          minPrice: ticketData.price || 0,
          wagons: [{
            id: `w-${Date.now()}`,
            type: wagonInfo.type,
            name: wagonInfo.name,
            apiType: ticketData.wagonApiType || 'second',
            price: ticketData.price || 0,
            availableSeats: 10
          }],
          hasWifi: true,
          hasConditioner: true,
          hasLinens: true
        });
        navigate('/seats');
      }} />
    </div>
  );
}

export default SearchPage;