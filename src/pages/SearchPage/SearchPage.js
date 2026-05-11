import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Типы вагонов
const wagonTypes = [
  { id: 'all', label: 'Все типы', icon: '🚂', apiTypes: ['first', 'second', 'third', 'fourth'] },
  { id: 'lux', label: 'Люкс', icon: '⭐', apiTypes: ['first'] },
  { id: 'coupe', label: 'Купе', icon: '🚂', apiTypes: ['second'] },
  { id: 'platzkart', label: 'Плацкарт', icon: '🛌', apiTypes: ['third'] },
  { id: 'sitting', label: 'Сидячий', icon: '💺', apiTypes: ['fourth'] },
];

// Временные диапазоны
const timeRanges = [
  { value: 'any', label: 'Любое время' },
  { value: 'morning', label: 'Утро (5:00–12:00)' },
  { value: 'day', label: 'День (12:00–18:00)' },
  { value: 'evening', label: 'Вечер (18:00–23:00)' },
  { value: 'night', label: 'Ночь (23:00–5:00)' }
];

function SearchPage() {
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

  // Вспомогательная функция для получения API-типа вагона
  const getWagonApiType = useCallback((wagon) => {
    if (!wagon) return null;
    
    // 1. Проверяем apiType
    if (wagon.apiType && ['first', 'second', 'third', 'fourth'].includes(wagon.apiType)) {
      return wagon.apiType;
    }
    
    // 2. Проверяем type на прямые значения API
    if (wagon.type && ['first', 'second', 'third', 'fourth'].includes(wagon.type)) {
      return wagon.type;
    }
    
    // 3. Обратный маппинг из UI-типов
    const reverseMap = {
      'lux': 'first',
      'coupe': 'second',
      'platzkart': 'third',
      'sitting': 'fourth'
    };
    
    if (wagon.type && reverseMap[wagon.type]) {
      return reverseMap[wagon.type];
    }
    
    if (wagon.apiType && reverseMap[wagon.apiType]) {
      return reverseMap[wagon.apiType];
    }
    
    return null;
  }, []);

  // Получение минимальной цены среди вагонов определенного типа
  const getMinPriceForWagonType = useCallback((train, selectedWagonType) => {
    if (!train?.wagons?.length) return Infinity;

    let relevantWagons = train.wagons;

    // Если выбран конкретный тип вагона, фильтруем только по нему
    if (selectedWagonType && selectedWagonType !== 'all') {
      const selectedApiTypes = wagonTypes.find(t => t.id === selectedWagonType)?.apiTypes || [];
      
      relevantWagons = train.wagons.filter(wagon => {
        const apiType = getWagonApiType(wagon);
        return apiType && selectedApiTypes.includes(apiType);
      });
    }

    if (!relevantWagons.length) return Infinity;

    const prices = relevantWagons
      .map(w => w.price)
      .filter(price => price != null && !isNaN(price) && price > 0);

    return prices.length > 0 ? Math.min(...prices) : Infinity;
  }, [getWagonApiType]);

  // Применяем фильтры и сортировку
  useEffect(() => {
    if (!trains.length) {
      setFilteredTrains([]);
      return;
    }

    let filtered = [...trains];

    // 1. Фильтр по типу вагона
    if (filters.wagonType !== 'all') {
      const selectedApiTypes = wagonTypes.find(t => t.id === filters.wagonType)?.apiTypes || [];
      
      filtered = filtered.filter(train => {
        if (!train.wagons?.length) return false;
        
        return train.wagons.some(wagon => {
          const apiType = getWagonApiType(wagon);
          return apiType && selectedApiTypes.includes(apiType);
        });
      });
    }

    // 2. Фильтр по ценовому диапазону
    if (filters.priceRange !== 'all') {
      const priceRange = priceRanges.find(range => range.id === filters.priceRange);
      
      if (priceRange) {
        filtered = filtered.filter(train => {
          const minPrice = getMinPriceForWagonType(train, 'all');
          return isFinite(minPrice) && minPrice >= priceRange.min && minPrice <= priceRange.max;
        });
      }
    }

    // 3. Фильтр по времени отправления
    if (filters.departureTime !== 'any') {
      filtered = filtered.filter(train => {
        try {
          if (!train.departureTime) return false;
          const hour = new Date(train.departureTime).getHours();
          if (isNaN(hour)) return false;
          
          switch (filters.departureTime) {
            case 'morning': return hour >= 5 && hour < 12;
            case 'day': return hour >= 12 && hour < 18;
            case 'evening': return hour >= 18 && hour < 23;
            case 'night': return hour >= 23 || hour < 5;
            default: return true;
          }
        } catch {
          return false;
        }
      });
    }

    // 4. Фильтры по услугам
    if (filters.hasWifi) {
      filtered = filtered.filter(train => train.hasWifi === true);
    }
    if (filters.hasConditioner) {
      filtered = filtered.filter(train => train.hasConditioner === true);
    }
    if (filters.hasLinens) {
      filtered = filtered.filter(train => train.hasLinens === true);
    }

    // 5. Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return getMinPriceForWagonType(a, filters.wagonType) - 
                 getMinPriceForWagonType(b, filters.wagonType);
        
        case 'price-desc':
          return getMinPriceForWagonType(b, filters.wagonType) - 
                 getMinPriceForWagonType(a, filters.wagonType);
        
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
  }, [trains, filters, sortBy, getMinPriceForWagonType, getWagonApiType]);

  // Загрузка поездов
  useEffect(() => {
    const fetchTrains = async () => {
      try {
        setLoading(true);
        setError(null);

        let fromCityId = null;
        let toCityId = null;

        // Поиск ID городов
        if (searchParams?.from) {
          try {
            const fromCities = await trainApi.searchCities(searchParams.from);
            if (fromCities && fromCities.length > 0) {
              fromCityId = fromCities[0]._id || fromCities[0].id;
            }
          } catch (e) {
            console.error('Ошибка поиска города отправления:', e);
          }
        }

        if (searchParams?.to) {
          try {
            const toCities = await trainApi.searchCities(searchParams.to);
            if (toCities && toCities.length > 0) {
              toCityId = toCities[0]._id || toCities[0].id;
            }
          } catch (e) {
            console.error('Ошибка поиска города прибытия:', e);
          }
        }

        // Fallback ID
        if (!fromCityId) fromCityId = '1';
        if (!toCityId) toCityId = '2';

        const apiParams = {
          from_city_id: fromCityId,
          to_city_id: toCityId,
          date_start: searchParams?.departureDate || new Date().toISOString().split('T')[0],
          date_end: searchParams?.arrivalDate || searchParams?.departureDate || new Date().toISOString().split('T')[0],
          have_first_class: true,
          have_second_class: true,
          have_third_class: true,
          have_fourth_class: true,
          limit: 50,
          offset: 0,
          sort: 'date'
        };

        const response = await trainApi.searchRoutes(apiParams);
        let formattedTrains = [];

        if (response && response.items && Array.isArray(response.items)) {
          formattedTrains = response.items
            .map((item) => {
              try {
                const formatted = trainApi.formatRouteForUI(item);
                return formatted;
              } catch (e) {
                console.error('Ошибка форматирования маршрута:', e);
                return null;
              }
            })
            .filter(train => train !== null);
        }

        // Резервные данные если ничего не загрузилось
        if (formattedTrains.length === 0) {
          const mockResponse = trainApi.getMockRoutesResponse();
          if (mockResponse && mockResponse.items) {
            formattedTrains = mockResponse.items
              .map(item => trainApi.formatRouteForUI(item))
              .filter(train => train !== null);
          }
        }

        setTrains(formattedTrains);
      } catch (err) {
        console.error('Критическая ошибка:', err);
        setError('Произошла ошибка при загрузке');
        
        // Используем моковые данные при ошибке
        const mockResponse = trainApi.getMockRoutesResponse();
        const mockTrains = mockResponse.items
          .map(item => trainApi.formatRouteForUI(item))
          .filter(train => train !== null);
        
        setTrains(mockTrains);
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
  };

  const handleTrainSelect = (train) => {
    setSelectedTrain({ ...train, originalData: train });
    navigate('/seats');
  };

  const handleLastTicketClick = (ticketData) => {
    const typeMap = {
      'first': { type: 'lux', name: 'Люкс' },
      'second': { type: 'coupe', name: 'Купе' },
      'third': { type: 'platzkart', name: 'Плацкарт' },
      'fourth': { type: 'sitting', name: 'Сидячий' }
    };
    
    const wagonInfo = typeMap[ticketData.wagonType] || typeMap['second'];

    const trainFromTicket = {
      id: `ticket-${Date.now()}`,
      number: ticketData.trainNumber || '000',
      name: `${ticketData.fromCity || ''} → ${ticketData.toCity || ''}`,
      fromCity: ticketData.fromCity || '',
      fromStation: ticketData.fromStation || '',
      toCity: ticketData.toCity || '',
      toStation: ticketData.toStation || '',
      departureTime: ticketData.departureDate 
        ? `${ticketData.departureDate.split('.').reverse().join('-')}T${ticketData.departureTime || '00:00'}:00`
        : new Date().toISOString(),
      arrivalTime: ticketData.arrivalDate
        ? `${ticketData.arrivalDate.split('.').reverse().join('-')}T${ticketData.arrivalTime || '00:00'}:00`
        : new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      duration: ticketData.duration || 300,
      wagons: [{
        id: `w-${Date.now()}`,
        type: wagonInfo.type,
        name: wagonInfo.name,
        apiType: ticketData.wagonType,
        price: ticketData.price || 2000,
        availableSeats: Math.floor(Math.random() * 15) + 5
      }],
      hasWifi: true,
      hasConditioner: true,
      hasLinens: true
    };

    setSelectedTrain(trainFromTicket);
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
              <button onClick={() => setError(null)} className="error-dismiss" type="button">×</button>
            </div>
          )}

          {!loading && !error && filteredTrains.length === 0 && trains.length > 0 && (
            <div className="no-results">
              <p>По вашим фильтрам поездов не найдено</p>
              <button onClick={handleResetFilters} className="reset-filters-link" type="button">
                Сбросить фильтры
              </button>
            </div>
          )}

          {!loading && !error && trains.length === 0 && (
            <div className="no-results">
              <p>Поезда не найдены</p>
              <p style={{fontSize: '14px', color: '#666'}}>Попробуйте изменить параметры поиска</p>
            </div>
          )}

          {!loading && !error && filteredTrains.length > 0 && (
            <div className="trains-list">
              {filteredTrains.map(train => (
                <TrainCard key={train.id} train={train} onSelect={handleTrainSelect} />
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
