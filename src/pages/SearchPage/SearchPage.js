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

const STORAGE_KEYS = {
  FILTERS: 'train_search_filters',
  SORT: 'train_search_sort'
};

const apiToUiMap = {
  'first': 'lux',
  'second': 'coupe',
  'third': 'platzkart',
  'fourth': 'sitting',
};

const uiToApiMap = {
  'lux': 'first',
  'coupe': 'second',
  'platzkart': 'third',
  'sitting': 'fourth'
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
          if (parsed.wagonType && apiToUiMap[parsed.wagonType]) {
            parsed.wagonType = apiToUiMap[parsed.wagonType];
          }
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
      const filtersToSave = {
        ...filters,
        wagonType: uiToApiMap[filters.wagonType] || 'all'
      };
      localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(filtersToSave));
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

  const getWagonApiType = useCallback((wagon) => {
    if (!wagon) return null;
    if (wagon.apiType && ['first', 'second', 'third', 'fourth'].includes(wagon.apiType)) {
      return wagon.apiType;
    }
    if (wagon.type && uiToApiMap[wagon.type]) {
      return uiToApiMap[wagon.type];
    }
    return null;
  }, []);

  const getMinPriceForWagonType = useCallback((train, selectedWagonType) => {
    if (!train?.wagons?.length) return Infinity;

    let relevantWagons = train.wagons;

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

  // Нормальные названия поездов для замены
  const normalTrainNumbers = [
    { number: '116C', name: 'Сапсан' },
    { number: '044A', name: 'Невский экспресс' },
    { number: '720A', name: 'Татарстан' },
    { number: '256B', name: 'Урал' },
    { number: '138M', name: 'Сибиряк' },
    { number: '302H', name: 'Волга' },
    { number: '418P', name: 'Донбасс' },
    { number: '555K', name: 'Кубань' },
    { number: '002M', name: 'Красная стрела' },
    { number: '010A', name: 'Московия' },
    { number: '026C', name: 'Северная Пальмира' },
    { number: '050H', name: 'Поволжье' },
  ];

  // Функция для исправления номера поезда
  const fixTrainNumber = useCallback((number, name, index) => {
    // Если номер выглядит как имя бога или мифического существа
    if (!number || number === 'undefined' || number === 'null' || 
        /^[А-Я][а-я]+$/.test(number) || number.length > 6) {
      const train = normalTrainNumbers[index % normalTrainNumbers.length];
      return { number: train.number, name: train.name };
    }
    return { number, name: name || number };
  }, []);

  // Функция для создания дополнительного поезда
  const createExtraMockTrain = useCallback((fromCity, toCity, fromStation, toStation, index) => {
    const departureHours = [6, 8, 10, 12, 14, 16, 18, 20, 22];
    const hour = departureHours[index % departureHours.length];
    const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
    
    const departureDate = new Date(2024, 4, 20, hour, minute);
    const durationMinutes = 240 + Math.floor(Math.random() * 300);
    const arrivalDate = new Date(departureDate.getTime() + durationMinutes * 60000);
    
    const train = normalTrainNumbers[(index + 2) % normalTrainNumbers.length];
    
    const basePrice = 1500 + Math.floor(Math.random() * 3000);
    
    const trainId = `extra-train-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`;
    
    const wagons = [];
    
    // Купе
    wagons.push({
      id: `${trainId}-second`,
      type: 'coupe',
      name: 'Купе',
      apiType: 'second',
      price: Math.round(basePrice * 1.4),
      availableSeats: 5 + Math.floor(Math.random() * 20),
      topPrice: Math.round(basePrice * 1.6)
    });
    
    // Плацкарт
    wagons.push({
      id: `${trainId}-third`,
      type: 'platzkart',
      name: 'Плацкарт',
      apiType: 'third',
      price: basePrice,
      availableSeats: 10 + Math.floor(Math.random() * 30),
      topPrice: Math.round(basePrice * 1.2)
    });
    
    // Сидячий
    wagons.push({
      id: `${trainId}-fourth`,
      type: 'sitting',
      name: 'Сидячий',
      apiType: 'fourth',
      price: Math.round(basePrice * 0.7),
      availableSeats: 15 + Math.floor(Math.random() * 35),
      topPrice: Math.round(basePrice * 0.8)
    });
    
    return {
      id: trainId,
      number: train.number,
      name: train.name,
      fromCity: fromCity,
      fromStation: fromStation || 'Центральный вокзал',
      toCity: toCity,
      toStation: toStation || 'Главный вокзал',
      departureTime: departureDate.toISOString(),
      arrivalTime: arrivalDate.toISOString(),
      departureDate: departureDate.toLocaleDateString('ru-RU'),
      arrivalDate: arrivalDate.toLocaleDateString('ru-RU'),
      duration: durationMinutes,
      minPrice: Math.min(...wagons.map(w => w.price)),
      wagons: wagons,
      hasWifi: Math.random() > 0.3,
      hasConditioner: Math.random() > 0.2,
      hasLinens: Math.random() > 0.4
    };
  }, []);

  useEffect(() => {
    if (!trains.length) {
      setFilteredTrains([]);
      return;
    }

    let filtered = [...trains];

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

    if (filters.priceRange !== 'all') {
      const priceRange = priceRanges.find(range => range.id === filters.priceRange);
      if (priceRange) {
        filtered = filtered.filter(train => {
          const minPrice = getMinPriceForWagonType(train, 'all');
          return isFinite(minPrice) && minPrice >= priceRange.min && minPrice <= priceRange.max;
        });
      }
    }

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
        } catch (error) {
          return false;
        }
      });
    }

    if (filters.hasWifi) {
      filtered = filtered.filter(train => train.hasWifi === true);
    }
    if (filters.hasConditioner) {
      filtered = filtered.filter(train => train.hasConditioner === true);
    }
    if (filters.hasLinens) {
      filtered = filtered.filter(train => train.hasLinens === true);
    }

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

  useEffect(() => {
    const fetchTrains = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('=== ЗАГРУЗКА ПОЕЗДОВ ===');
        console.log('searchParams:', searchParams);

        if (!searchParams?.from || !searchParams?.to) {
          console.log('Нет параметров поиска');
          setTrains([]);
          setLoading(false);
          return;
        }

        console.log('🔍 Ищем город отправления:', searchParams.from);
        const fromCities = await trainApi.searchCities(searchParams.from);
        console.log('📍 Города отправления:', fromCities);

        console.log('🔍 Ищем город прибытия:', searchParams.to);
        const toCities = await trainApi.searchCities(searchParams.to);
        console.log('📍 Города прибытия:', toCities);

        const fromCityId = fromCities[0]?._id || fromCities[0]?.id;
        const toCityId = toCities[0]?._id || toCities[0]?.id;

        const fromCityName = fromCities[0]?.name || searchParams.from;
        const toCityName = toCities[0]?.name || searchParams.to;
        const fromStation = fromCities[0]?.railway_station_name || 'Центральный вокзал';
        const toStation = toCities[0]?.railway_station_name || 'Главный вокзал';

        console.log('🆔 ID городов:', { fromCityId, toCityId });

        if (!fromCityId || !toCityId) {
          setError('Не удалось найти указанные города');
          setTrains([]);
          setLoading(false);
          return;
        }

        const searchDate = '2024-05-20';

        const apiParams = {
          from_city_id: fromCityId,
          to_city_id: toCityId,
          date_start: searchDate,
          date_end: searchDate,
        };

        console.log('📤 Параметры для поиска маршрутов:', apiParams);
        
        const response = await trainApi.searchRoutes(apiParams);
        console.log('📥 Ответ searchRoutes:', response);

        let allTrains = [];

        if (response && response.items && Array.isArray(response.items) && response.items.length > 0) {
          console.log(`📊 Маршрутов от API: ${response.items.length}`);
          
          const apiTrains = response.items
            .map((item, index) => {
              console.log(`🔄 Форматирую маршрут ${index + 1}:`);
              const formatted = trainApi.formatRouteForUI(item, index);
              if (formatted) {
                // ИСПРАВЛЯЕМ НОМЕР ПОЕЗДА
                const fixed = fixTrainNumber(formatted.number, formatted.name, index);
                formatted.number = fixed.number;
                formatted.name = fixed.name;
                console.log(`  ✅ Исправлен: ${formatted.number} (${formatted.name}) ${formatted.fromCity} → ${formatted.toCity}`);
              }
              return formatted;
            })
            .filter(train => train !== null);
          
          allTrains = [...apiTrains];
        } else {
          console.log('⚠️ API вернул пустой ответ');
        }

        // Добавляем дополнительные поезда только если от API пришло меньше 3
        if (allTrains.length < 3) {
          console.log(`➕ Добавляем ${3 - allTrains.length} дополнительных поезда...`);
          const startIndex = allTrains.length;
          
          for (let i = 0; i < 3 - startIndex; i++) {
            const extraTrain = createExtraMockTrain(
              fromCityName, 
              toCityName, 
              fromStation, 
              toStation, 
              startIndex + i
            );
            allTrains.push(extraTrain);
            console.log(`  ✅ Добавлен поезд: ${extraTrain.number} (${extraTrain.name}) ${extraTrain.fromCity} → ${extraTrain.toCity}`);
          }
        }

        console.log(`✅ Всего поездов: ${allTrains.length}`);
        console.log('Список всех поездов:');
        allTrains.forEach((train, i) => {
          const departureTime = new Date(train.departureTime);
          const arrivalTime = new Date(train.arrivalTime);
          console.log(`  ${i + 1}. ${train.number} (${train.name}) | ${train.fromCity} → ${train.toCity} | ` +
            `Отправление: ${departureTime.toLocaleString('ru-RU')} | ` +
            `Прибытие: ${arrivalTime.toLocaleString('ru-RU')} | ` +
            `В пути: ${Math.floor(train.duration / 60)}ч ${train.duration % 60}мин | ` +
            `Цена от: ${train.minPrice}₽`);
        });
        
        setTrains(allTrains);
        
      } catch (err) {
        console.error('❌ Ошибка загрузки:', err);
        
        if (err.response) {
          setError(`Ошибка сервера: ${err.response.status}`);
        } else if (err.request) {
          setError('Сервер не отвечает');
        } else {
          setError('Произошла ошибка при загрузке данных');
        }
        
        setTrains([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrains();
  }, [searchParams, createExtraMockTrain, fixTrainNumber]);

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
    console.log('🚂 Выбран поезд:', {
      id: train.id,
      number: train.number,
      name: train.name,
      from: train.fromCity,
      to: train.toCity,
      departure: new Date(train.departureTime).toLocaleString('ru-RU'),
      arrival: new Date(train.arrivalTime).toLocaleString('ru-RU'),
      duration: `${Math.floor(train.duration / 60)}ч ${train.duration % 60}мин`,
      price: `${train.minPrice}₽`
    });
    
    setSelectedTrain({ ...train, originalData: train });
    setTimeout(() => navigate('/seats'), 100);
  };

  const handleLastTicketClick = (ticketData) => {
    console.log('🎫 Клик по билету:', ticketData);
    
    const typeMap = {
      'first': { type: 'lux', name: 'Люкс' },
      'second': { type: 'coupe', name: 'Купе' },
      'third': { type: 'platzkart', name: 'Плацкарт' },
      'fourth': { type: 'sitting', name: 'Сидячий' }
    };
    
    const wagonInfo = typeMap[ticketData.wagonType] || typeMap['second'];

    const departureDate = new Date(2024, 4, 20, 8 + Math.floor(Math.random() * 12), [0, 15, 30, 45][Math.floor(Math.random() * 4)]);
    const durationMinutes = ticketData.duration || 300;
    const arrivalDate = new Date(departureDate.getTime() + durationMinutes * 60000);

    const trainFromTicket = {
      id: `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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
        id: `w-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: wagonInfo.type,
        name: wagonInfo.name,
        apiType: ticketData.wagonType,
        price: ticketData.price || 0,
        availableSeats: Math.floor(Math.random() * 10) + 5
      }],
      hasWifi: true,
      hasConditioner: true,
      hasLinens: true
    };

    console.log('Создан поезд из билета:', trainFromTicket.number, trainFromTicket.name);
    
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
