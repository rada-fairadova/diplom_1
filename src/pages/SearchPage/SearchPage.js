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

const FILTERS_STORAGE_KEY = 'train_search_filters';

function SearchPage() {
  const navigate = useNavigate();
  const { searchParams, setSelectedTrain } = useTicket();

  const [trains, setTrains] = useState([]);
  const [filteredTrains, setFilteredTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  
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

  // === ИЗМЕНЕНО: добавлено подробное логирование ===
  useEffect(() => {
    if (!searchParams?.from || !searchParams?.to) {
      setTrains([]);
      setFilteredTrains([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log('🔍 [SEARCH] Начинаем поиск:', { from: searchParams.from, to: searchParams.to });

    // Загружаем города для получения ID
    Promise.all([
      trainApi.searchCities(searchParams.from),
      trainApi.searchCities(searchParams.to)
    ]).then(([fromCities, toCities]) => {
      const fromCity = fromCities[0];
      const toCity = toCities[0];
      
      if (!fromCity || !toCity) {
        console.warn('⚠️ [CITIES] Города не найдены');
        setTrains([]);
        setLoading(false);
        return;
      }

      console.log('🏙️ [CITIES] Найдены:', { from: fromCity.name, to: toCity.name });

      // === ИЗМЕНЕНО: добавлены дополнительные параметры в запрос ===
      const requestParams = {
        from_city_id: fromCity._id,
        to_city_id: toCity._id,
        ...(searchParams.date_start && { date_start: searchParams.date_start }),
        ...(searchParams.date_end && { date_end: searchParams.date_end }),
      };

      console.log('📤 [REQUEST] Параметры запроса:', requestParams);

      // Реальный запрос к API
      return trainApi.searchRoutes(requestParams).then(response => {
        console.log('📥 [RESPONSE] Получено маршрутов:', response.items?.length || 0);
        const apiRoutes = response.items || [];
        const formattedTrains = apiRoutes
          .map((route, index) => trainApi.formatRouteForUI(route, index))
          .filter(Boolean);
        
        console.log('🚂 [FORMATTED] Отформатировано поездов:', formattedTrains.length);
        setTrains(formattedTrains);
        setLoading(false);
      });
    }).catch((error) => {
      console.error('❌ [FATAL] Ошибка загрузки:', error);
      setTrains([]);
      setLoading(false);
    });
  }, [searchParams]);

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

    setFilteredTrains(filtered);
  }, [trains, filters, getTrainMinPrice]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [filterName]: value };
      return newFilters;
    });
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