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

const STORAGE_KEYS = {
  FILTERS: 'train_search_filters',
  SORT: 'train_search_sort'
};

const generateMockTrains = (fromCity, toCity, fromStation, toStation) => {
  const trains = [];
  const trainConfigs = [
    { number: '116C', name: 'Сапсан', type: 'express' },
    { number: '044A', name: 'Невский экспресс', type: 'express' },
    { number: '720A', name: 'Татарстан', type: 'regular' },
    { number: '256B', name: 'Урал', type: 'regular' },
    { number: '302H', name: 'Волга', type: 'regular' },
  ];

  const baseDate = new Date('2024-05-20');

  for (let i = 0; i < 5; i++) {
    const config = trainConfigs[i];
    const departureHour = 6 + i * 3;
    const departureDate = new Date(baseDate);
    departureDate.setHours(departureHour, [0, 15, 30, 45][i], 0);
    
    const durationMinutes = 180 + i * 60 + Math.floor(Math.random() * 60);
    const arrivalDate = new Date(departureDate.getTime() + durationMinutes * 60000);
    
    const trainId = `train-${Date.now()}-${i}`;
    const wagons = [];
    
    // Купе
    const coupePrice = 2000 + i * 500 + Math.floor(Math.random() * 500);
    wagons.push({
      id: `${trainId}-coupe`,
      type: 'coupe',
      name: 'Купе',
      apiType: 'second',
      price: coupePrice,
      availableSeats: 5 + Math.floor(Math.random() * 15),
      topPrice: coupePrice + 300
    });
    
    // Плацкарт
    const platzkartPrice = 1200 + i * 300 + Math.floor(Math.random() * 300);
    wagons.push({
      id: `${trainId}-platzkart`,
      type: 'platzkart',
      name: 'Плацкарт',
      apiType: 'third',
      price: platzkartPrice,
      availableSeats: 10 + Math.floor(Math.random() * 30),
      topPrice: platzkartPrice + 150
    });
    
    // Люкс (только у экспрессов)
    if (config.type === 'express') {
      const luxPrice = 4000 + i * 800 + Math.floor(Math.random() * 500);
      wagons.push({
        id: `${trainId}-lux`,
        type: 'lux',
        name: 'Люкс',
        apiType: 'first',
        price: luxPrice,
        availableSeats: 2 + Math.floor(Math.random() * 4),
        topPrice: luxPrice + 500
      });
    }
    
    // Сидячий
    if (i !== 2) {
      const sittingPrice = 800 + i * 200 + Math.floor(Math.random() * 200);
      wagons.push({
        id: `${trainId}-sitting`,
        type: 'sitting',
        name: 'Сидячий',
        apiType: 'fourth',
        price: sittingPrice,
        availableSeats: 15 + Math.floor(Math.random() * 20),
        topPrice: sittingPrice + 100
      });
    }

    const minPrice = Math.min(...wagons.map(w => w.price));

    trains.push({
      id: trainId,
      number: config.number,
      name: config.name,
      fromCity: fromCity,
      fromStation: fromStation || 'Центральный вокзал',
      toCity: toCity,
      toStation: toStation || 'Главный вокзал',
      departureTime: departureDate.toISOString(),
      arrivalTime: arrivalDate.toISOString(),
      departureDate: departureDate.toLocaleDateString('ru-RU'),
      arrivalDate: arrivalDate.toLocaleDateString('ru-RU'),
      duration: durationMinutes,
      minPrice: minPrice,
      wagons: wagons,
      hasWifi: i % 2 === 0,
      hasConditioner: i !== 1,
      hasLinens: i !== 3
    });
  }
  
  return trains;
};

function SearchPage() {
  const navigate = useNavigate();
  const { searchParams, setSelectedTrain } = useTicket();

  const [trains, setTrains] = useState([]);
  const [filteredTrains, setFilteredTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
      const saved = localStorage.getItem(STORAGE_KEYS.FILTERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...defaultFilters, ...parsed };
        }
      }
    } catch (e) {
      console.error('Ошибка загрузки фильтров:', e);
    }
    
    return defaultFilters;
  });
  
  const [sortBy, setSortBy] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SORT) || 'departureTime';
    } catch (e) {
      return 'departureTime';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(filters));
    } catch (e) {
      console.error('Ошибка сохранения фильтров:', e);
    }
  }, [filters]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SORT, sortBy);
    } catch (e) {
      console.error('Ошибка сохранения сортировки:', e);
    }
  }, [sortBy]);

  // Получение минимальной цены для поезда с учетом фильтра вагона
  const getTrainMinPrice = useCallback((train, wagonFilter) => {
    if (!train?.wagons?.length) return Infinity;
    
    if (wagonFilter === 'all') {
      return Math.min(...train.wagons.map(w => w.price));
    }
    
    const selectedWagon = wagonTypes.find(t => t.id === wagonFilter);
    if (!selectedWagon || !selectedWagon.apiTypes) {
      return Math.min(...train.wagons.map(w => w.price));
    }
    
    const matchingWagons = train.wagons.filter(w => 
      selectedWagon.apiTypes.includes(w.apiType)
    );
    
    return matchingWagons.length > 0 
      ? Math.min(...matchingWagons.map(w => w.price)) 
      : Infinity;
  }, []);

  // Фильтрация и сортировка
  useEffect(() => {
    if (!trains.length) {
      setFilteredTrains([]);
      return;
    }

    let filtered = [...trains];

    // 1. Фильтр по типу вагона
    if (filters.wagonType !== 'all') {
      const selectedWagon = wagonTypes.find(t => t.id === filters.wagonType);
      if (selectedWagon && selectedWagon.apiTypes) {
        filtered = filtered.filter(train => 
          train.wagons.some(wagon => selectedWagon.apiTypes.includes(wagon.apiType))
        );
      }
    }

    // 2. Фильтр по цене
    if (filters.priceRange !== 'all') {
      const priceRange = priceRanges.find(r => r.id === filters.priceRange);
      if (priceRange) {
        filtered = filtered.filter(train => {
          const minPrice = getTrainMinPrice(train, filters.wagonType);
          return isFinite(minPrice) && minPrice >= priceRange.min && minPrice <= priceRange.max;
        });
      }
    }

    // 3. Фильтр по времени
    if (filters.departureTime !== 'any') {
      filtered = filtered.filter(train => {
        const hour = new Date(train.departureTime).getHours();
        switch (filters.departureTime) {
          case 'morning': return hour >= 5 && hour < 12;
          case 'day': return hour >= 12 && hour < 18;
          case 'evening': return hour >= 18 && hour < 23;
          case 'night': return hour >= 23 || hour < 5;
          default: return true;
        }
      });
    }

    // 4. Фильтры по услугам
    if (filters.hasWifi) filtered = filtered.filter(train => train.hasWifi);
    if (filters.hasConditioner) filtered = filtered.filter(train => train.hasConditioner);
    if (filters.hasLinens) filtered = filtered.filter(train => train.hasLinens);

    // 5. Сортировка
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
          return a.duration - b.duration;
        case 'departureTime':
        default:
          return new Date(a.departureTime) - new Date(b.departureTime);
      }
    });

    setFilteredTrains(filtered);
  }, [trains, filters, sortBy, getTrainMinPrice]);

  // Загрузка поездов
  useEffect(() => {
    const fetchTrains = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!searchParams?.from || !searchParams?.to) {
          setTrains([]);
          setLoading(false);
          return;
        }

        let fromCityName = searchParams.from;
        let toCityName = searchParams.to;
        let fromStation = 'Центральный вокзал';
        let toStation = 'Главный вокзал';

        try {
          const fromCities = await trainApi.searchCities(searchParams.from);
          const toCities = await trainApi.searchCities(searchParams.to);
          
          if (fromCities.length > 0) {
            fromCityName = fromCities[0].name;
            fromStation = fromCities[0].railway_station_name || fromStation;
          }
          if (toCities.length > 0) {
            toCityName = toCities[0].name;
            toStation = toCities[0].railway_station_name || toStation;
          }

          const fromCityId = fromCities[0]?._id || fromCities[0]?.id;
          const toCityId = toCities[0]?._id || toCities[0]?.id;

          if (fromCityId && toCityId) {
            const response = await trainApi.searchRoutes({
              from_city_id: fromCityId,
              to_city_id: toCityId,
              date_start: '2024-05-20',
              date_end: '2024-05-20',
            });

            if (response?.items?.length > 0) {
              const apiTrains = response.items
                .map((item, index) => trainApi.formatRouteForUI(item, index))
                .filter(train => train !== null);
              
              if (apiTrains.length > 0) {
                setTrains(apiTrains);
                setLoading(false);
                return;
              }
            }
          }
        } catch (apiError) {
          console.warn('API недоступен, используем демо-данные');
        }

        // Генерируем демо-поезда
        const mockTrains = generateMockTrains(fromCityName, toCityName, fromStation, toStation);
        setTrains(mockTrains);
        
      } catch (err) {
        console.error('Ошибка:', err);
        setError('Произошла ошибка при загрузке данных');
        setTrains([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrains();
  }, [searchParams]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleResetFilters = () => {
    setFilters({
      priceRange: 'all',
      wagonType: 'all',
      departureTime: 'any',
      hasWifi: false,
      hasConditioner: false,
      hasLinens: false
    });
    setSortBy('departureTime');
    localStorage.removeItem(STORAGE_KEYS.FILTERS);
    localStorage.removeItem(STORAGE_KEYS.SORT);
  };

  const handleTrainSelect = (train) => {
    setSelectedTrain({ ...train, originalData: train });
    setTimeout(() => navigate('/seats'), 100);
  };

  const handleLastTicketClick = (ticketData) => {
    const typeMap = {
      'first': { type: 'lux', name: 'Люкс' },
      'second': { type: 'coupe', name: 'Купе' },
      'third': { type: 'platzkart', name: 'Плацкарт' },
      'fourth': { type: 'sitting', name: 'Сидячий' }
    };
    
    const wagonInfo = typeMap[ticketData.wagonApiType] || typeMap['second'];
    const departureDate = new Date(2024, 4, 20, 8 + Math.floor(Math.random() * 12));
    const durationMinutes = ticketData.durationMinutes || 300;
    const arrivalDate = new Date(departureDate.getTime() + durationMinutes * 60000);

    const trainFromTicket = {
      id: `ticket-${Date.now()}`,
      number: ticketData.trainNumber || '116C',
      name: ticketData.trainName || 'Сапсан',
      fromCity: ticketData.fromCity || '',
      fromStation: ticketData.fromStation || '',
      toCity: ticketData.toCity || '',
      toStation: ticketData.toStation || '',
      departureTime: departureDate.toISOString(),
      arrivalTime: arrivalDate.toISOString(),
      departureDate: departureDate.toLocaleDateString('ru-RU'),
      arrivalDate: arrivalDate.toLocaleDateString('ru-RU'),
      duration: durationMinutes,
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
    };
    
    setSelectedTrain(trainFromTicket);
    setTimeout(() => navigate('/seats'), 100);
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
                <label 
                  key={wagon.id} 
                  className={`wagon-types__option ${filters.wagonType === wagon.id ? 'wagon-types__option--active' : ''}`}
                >
                  <input 
                    type="radio" 
                    name="wagonType" 
                    value={wagon.id} 
                    checked={filters.wagonType === wagon.id}
                    onChange={(e) => handleFilterChange('wagonType', e.target.value)} 
                    className="wagon-types__radio" 
                  />
                  <span className="wagon-types__icon">{wagon.icon}</span>
                  <span className="wagon-types__label">{wagon.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filters__section">
            <h4 className="filters__section-title">Цена</h4>
            <div className="filters__options">
              {priceRanges.map(range => (
                <label key={range.id} className="filters__option">
                  <input 
                    type="radio" 
                    name="priceRange" 
                    value={range.id} 
                    checked={filters.priceRange === range.id}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)} 
                    className="filters__radio" 
                  />
                  <span className="filters__option-label">{range.label}</span>
                </label>
              ))}
            </div>
          </div>

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

          <div className="filters__section">
            <h4 className="filters__section-title">Услуги в поезде</h4>
            <div className="filters__checkboxes">
              <label className="filters__checkbox-label">
                <input 
                  type="checkbox" 
                  checked={filters.hasWifi} 
                  onChange={(e) => handleFilterChange('hasWifi', e.target.checked)} 
                  className="filters__checkbox" 
                />
                <span className="filters__checkbox-text">Wi‑Fi</span>
              </label>
              <label className="filters__checkbox-label">
                <input 
                  type="checkbox" 
                  checked={filters.hasConditioner} 
                  onChange={(e) => handleFilterChange('hasConditioner', e.target.checked)} 
                  className="filters__checkbox" 
                />
                <span className="filters__checkbox-text">Кондиционер</span>
              </label>
              <label className="filters__checkbox-label">
                <input 
                  type="checkbox" 
                  checked={filters.hasLinens} 
                  onChange={(e) => handleFilterChange('hasLinens', e.target.checked)} 
                  className="filters__checkbox" 
                />
                <span className="filters__checkbox-text">Постельное бельё</span>
              </label>
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

          {error && !loading && (
            <div className="error-state">
              <p className="error-message">{error}</p>
            </div>
          )}

          {!loading && !error && filteredTrains.length === 0 && (
            <div className="no-results">
              <p>По вашим фильтрам поездов не найдено</p>
              <button onClick={handleResetFilters} className="reset-filters-link" type="button">
                Сбросить фильтры
              </button>
            </div>
          )}

          {!loading && !error && filteredTrains.length > 0 && (
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

      <LastTickets onTicketClick={handleLastTicketClick} />
    </div>
  );
}

export default SearchPage;
