import React, { useState, useEffect } from 'react';
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

// Типы вагонов с русскими названиями
const wagonTypes = [
  { id: 'all', label: 'Все типы', icon: '🚂', apiTypes: ['first', 'second', 'third', 'fourth'] },
  { id: 'coupe', label: 'Купе', icon: '🚂', apiTypes: ['second'] },
  { id: 'platzkart', label: 'Плацкарт', icon: '🛌', apiTypes: ['third'] },
  { id: 'sitting', label: 'Сидячий', icon: '💺', apiTypes: ['fourth'] },
  { id: 'lux', label: 'Люкс', icon: '⭐', apiTypes: ['first'] },
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

  useEffect(() => {
    const fetchTrains = async () => {
      console.log('🔍 Начало загрузки поездов, searchParams:', searchParams);
      
      if (!searchParams || (!searchParams.from && !searchParams.to)) {
        console.warn('⚠️ Параметры поиска неполные');
        setError('Пожалуйста, укажите направление поиска');
        const demoTrains = getMockTrains();
        setTrains(demoTrains);
        setFilteredTrains(demoTrains);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Сначала ищем ID городов по их названиям
        let fromCityId = null;
        let toCityId = null;
        
        if (searchParams.from) {
          try {
            const fromCities = await trainApi.searchCities(searchParams.from);
            if (fromCities && fromCities.length > 0) {
              fromCityId = fromCities[0]._id || fromCities[0].id;
            }
          } catch (cityError) {
            console.error('Ошибка поиска города отправления:', cityError);
          }
        }
        
        if (searchParams.to) {
          try {
            const toCities = await trainApi.searchCities(searchParams.to);
            if (toCities && toCities.length > 0) {
              toCityId = toCities[0]._id || toCities[0].id;
            }
          } catch (cityError) {
            console.error('Ошибка поиска города прибытия:', cityError);
          }
        }

        // Формируем параметры для API
        const apiParams = {
          from_city_id: fromCityId,
          to_city_id: toCityId,
          date_start: searchParams.departureDate || new Date().toISOString().split('T')[0],
          date_end: searchParams.arrivalDate || searchParams.departureDate || new Date().toISOString().split('T')[0],
          have_first_class: true,
          have_second_class: true,
          have_third_class: true,
          have_fourth_class: true,
          limit: 50,
          offset: 0,
          sort: 'date'
        };

        // Если нет ID городов, используем моковые данные
        if (!fromCityId || !toCityId) {
          const mockTrains = getMockTrains();
          setTrains(mockTrains);
          setFilteredTrains(mockTrains);
          setLoading(false);
          return;
        }

        const response = await trainApi.searchRoutes(apiParams);

        let formattedTrains = [];
        
        if (response && response.items && Array.isArray(response.items) && response.items.length > 0) {
          formattedTrains = response.items.map(item => {
            try {
              const formatted = trainApi.formatRouteForUI(item);
              
              // Конвертируем типы вагонов API в наши названия
              if (formatted.wagons) {
                formatted.wagons = formatted.wagons.map(wagon => {
                  // Сохраняем оригинальный тип API
                  const apiType = wagon.type;
                  
                  // Конвертируем API тип в наш тип с русскими названиями
                  let type = wagon.type;
                  let name = wagon.name;
                  
                  // Конвертируем API названия в русские
                  if (wagon.type === 'first') {
                    type = 'lux';
                    name = 'Люкс';
                  } else if (wagon.type === 'second') {
                    type = 'coupe';
                    name = 'Купе';
                  } else if (wagon.type === 'third') {
                    type = 'platzkart';
                    name = 'Плацкарт';
                  } else if (wagon.type === 'fourth') {
                    type = 'sitting';
                    name = 'Сидячий';
                  }
                  
                  return {
                    ...wagon,
                    type: type,
                    name: name,
                    apiType: apiType // Сохраняем оригинальный тип API для фильтрации
                  };
                });
              }
              
              return formatted;
            } catch (formatError) {
              console.error('Ошибка форматирования поезда:', formatError);
              return null;
            }
          }).filter(train => train !== null);
          
          if (formattedTrains.length === 0) {
            setError('Найденные маршруты не удалось обработать');
          }
        } else {
          setError('На выбранные даты поездов не найдено');
        }
        
        // Если через API ничего не нашли, используем моковые данные
        if (formattedTrains.length === 0) {
          formattedTrains = getMockTrains();
        }
        
        setTrains(formattedTrains);
        setFilteredTrains(formattedTrains);
        
      } catch (err) {
        console.error('Ошибка при загрузке поездов:', err);
        setError('Не удалось загрузить данные о поездах');
        
        // Используем моковые данные при ошибке
        const demoTrains = getMockTrains();
        setTrains(demoTrains);
        setFilteredTrains(demoTrains);
      } finally {
        setLoading(false);
      }
    };

    fetchTrains();
  }, [searchParams]);

  useEffect(() => {
    // Фильтрация поездов
    let filtered = [...trains];
    
    // Фильтр по типу вагона
    if (filters.wagonType !== 'all') {
      const selectedApiTypes = wagonTypes.find(t => t.id === filters.wagonType)?.apiTypes || [];
      
      filtered = filtered.filter(train => {
        if (!train.wagons || train.wagons.length === 0) {
          return false;
        }
        
        const hasWagonType = train.wagons.some(wagon => {
          return selectedApiTypes.includes(wagon.apiType || wagon.type);
        });
        
        return hasWagonType;
      });
    }

    // Фильтр по ценовому диапазону
    const priceRange = priceRanges.find(range => range.id === filters.priceRange);
    if (priceRange && priceRange.id !== 'all') {
      filtered = filtered.filter(train => {
        const relevantWagons = filters.wagonType !== 'all' 
          ? train.wagons.filter(wagon => {
              const selectedApiTypes = wagonTypes.find(t => t.id === filters.wagonType)?.apiTypes || [];
              return selectedApiTypes.includes(wagon.apiType || wagon.type);
            })
          : train.wagons;
        
        if (!relevantWagons || relevantWagons.length === 0) return false;
        
        const minPrice = Math.min(...relevantWagons.map(wagon => wagon.price || Infinity));
        const inRange = minPrice >= priceRange.min && minPrice <= priceRange.max;
        
        return inRange;
      });
    }

    // Фильтр по времени отправления
    if (filters.departureTime !== 'any') {
      filtered = filtered.filter(train => {
        try {
          if (!train.departureTime) return false;
          const departureTime = new Date(train.departureTime);
          const hour = departureTime.getHours();
          
          let inRange = false;
          if (filters.departureTime === 'morning') inRange = hour >= 5 && hour < 12;
          if (filters.departureTime === 'day') inRange = hour >= 12 && hour < 18;
          if (filters.departureTime === 'evening') inRange = hour >= 18 && hour < 23;
          if (filters.departureTime === 'night') inRange = hour >= 23 || hour < 5;
          
          return inRange;
        } catch {
          return true;
        }
      });
    }

    // Фильтр по услугам
    if (filters.hasWifi) {
      filtered = filtered.filter(train => train.hasWifi === true);
    }
    if (filters.hasConditioner) {
      filtered = filtered.filter(train => train.hasConditioner === true);
    }
    if (filters.hasLinens) {
      filtered = filtered.filter(train => train.hasLinens === true);
    }

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          const priceA = getTrainMinPrice(a, filters.wagonType);
          const priceB = getTrainMinPrice(b, filters.wagonType);
          return priceA - priceB;
        case 'price-desc':
          const priceADesc = getTrainMinPrice(a, filters.wagonType);
          const priceBDesc = getTrainMinPrice(b, filters.wagonType);
          return priceBDesc - priceADesc;
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
  }, [trains, filters, sortBy]);

  // Функция для получения минимальной цены поезда с учетом типа вагона
  const getTrainMinPrice = (train, wagonTypeFilter) => {
    if (!train.wagons || train.wagons.length === 0) {
      return Infinity;
    }
    
    const relevantWagons = wagonTypeFilter !== 'all' 
      ? train.wagons.filter(wagon => {
          const selectedApiTypes = wagonTypes.find(t => t.id === wagonTypeFilter)?.apiTypes || [];
          return selectedApiTypes.includes(wagon.apiType || wagon.type);
        })
      : train.wagons;
    
    if (!relevantWagons || relevantWagons.length === 0) {
      return Infinity;
    }
    
    const prices = relevantWagons
      .map(wagon => wagon.price)
      .filter(price => price && price > 0);
    
    return prices.length > 0 ? Math.min(...prices) : Infinity;
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
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

  const handleTrainSelect = async (train) => {
    try {
      // Сохраняем выбранный поезд в контекст
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

  // Функция для обработки клика на последний билет
  const handleLastTicketClick = (ticketData) => {
    // Конвертируем тип вагона API в наш тип
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
    
    // Создаем объект поезда из данных билета
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
      departureDate: ticketData.departureDate || new Date().toLocaleDateString('ru-RU'),
      arrivalDate: ticketData.arrivalDate || new Date(Date.now() + 5 * 60 * 60 * 1000).toLocaleDateString('ru-RU'),
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
          topPrice: ticketData.price * 1.2 || 2400
        }
      ],
      hasWifi: true,
      hasConditioner: true,
      hasLinens: true
    };
    
    setSelectedTrain(trainFromTicket);
    navigate('/seats');
  };

  // Функция для получения моковых данных
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
        departureDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU'),
        arrivalDate: new Date(Date.now() + 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toLocaleDateString('ru-RU'),
        duration: 615,
        minPrice: 1920,
        wagons: [
          { 
            id: 'wagon-1',
            type: 'sitting', 
            name: 'Сидячий',
            apiType: 'fourth',
            price: 1920, 
            availableSeats: 35,
            topPrice: 2100,
            number: '1'
          },
          { 
            id: 'wagon-2',
            type: 'platzkart', 
            name: 'Плацкарт',
            apiType: 'third',
            price: 2530, 
            availableSeats: 24,
            topPrice: 2800,
            number: '2'
          },
          { 
            id: 'wagon-3',
            type: 'coupe', 
            name: 'Купе',
            apiType: 'second',
            price: 3820, 
            availableSeats: 15,
            topPrice: 4200,
            number: '3'
          },
          { 
            id: 'wagon-4',
            type: 'lux', 
            name: 'Люкс',
            apiType: 'first',
            price: 4950, 
            availableSeats: 8,
            topPrice: 5500,
            number: '4'
          }
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
        departureDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toLocaleDateString('ru-RU'),
        arrivalDate: new Date(Date.now() + 48 * 60 * 60 * 1000 + 8.75 * 60 * 60 * 1000).toLocaleDateString('ru-RU'),
        duration: 525,
        minPrice: 1800,
        wagons: [
          { 
            id: 'wagon-5',
            type: 'sitting', 
            name: 'Сидячий',
            apiType: 'fourth',
            price: 1800, 
            availableSeats: 42,
            topPrice: 2000,
            number: '5'
          },
          { 
            id: 'wagon-6',
            type: 'platzkart', 
            name: 'Плацкарт',
            apiType: 'third',
            price: 2400, 
            availableSeats: 32,
            topPrice: 2700,
            number: '6'
          },
          { 
            id: 'wagon-7',
            type: 'coupe', 
            name: 'Купе',
            apiType: 'second',
            price: 3600, 
            availableSeats: 18,
            topPrice: 4000,
            number: '7'
          }
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
        departureDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toLocaleDateString('ru-RU'),
        arrivalDate: new Date(Date.now() + 72 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toLocaleDateString('ru-RU'),
        duration: 540,
        minPrice: 2100,
        wagons: [
          { 
            id: 'wagon-8',
            type: 'sitting', 
            name: 'Сидячий',
            apiType: 'fourth',
            price: 2100, 
            availableSeats: 28,
            topPrice: 2300,
            number: '8'
          },
          { 
            id: 'wagon-9',
            type: 'platzkart', 
            name: 'Плацкарт',
            apiType: 'third',
            price: 2900, 
            availableSeats: 20,
            topPrice: 3200,
            number: '9'
          },
          { 
            id: 'wagon-10',
            type: 'coupe', 
            name: 'Купе',
            apiType: 'second',
            price: 4100, 
            availableSeats: 12,
            topPrice: 4500,
            number: '10'
          }
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

  // Форматирование цены
  const formatPrice = (price) => {
    return price.toLocaleString('ru-RU');
  };

  return (
    <div className="search-page">
      <OrderSteps />

      <div className="search-page__container">
        {/* Боковая панель с фильтрами */}
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

          {/* Последние билеты */}
          <div className="sidebar__last-tickets">
            <LastTickets onTicketClick={handleLastTicketClick} />
          </div>
        </aside>

        {/* Основной контент */}
        <main className="search-page__main">
          {/* Заголовок с результатами */}
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
                  <div className="search-results__stat">
                    <span className="search-results__stat-label">Среднее время в пути:</span>
                    <span className="search-results__stat-value">
                      {filteredTrains.length > 0 
                        ? `${Math.round(filteredTrains.reduce((sum, train) => sum + (train.duration || 0), 0) / filteredTrains.length / 60)} ч`
                        : '—'
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Сортировка */}
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

          {/* Сообщение об ошибке */}
          {error && !loading && trains.length === 0 && (
            <div className="search-results__error">
              <div className="search-results__error-icon">⚠️</div>
              <div className="search-results__error-text">{error}</div>
            </div>
          )}

          {/* Статистика фильтров */}
          {(filters.wagonType !== 'all' || filters.priceRange !== 'all' || filters.departureTime !== 'any' || filters.hasWifi || filters.hasConditioner || filters.hasLinens) && (
            <div className="filters-summary">
              <div className="filters-summary__title">Примененные фильтры:</div>
              <div className="filters-summary__tags">
                {filters.wagonType !== 'all' && (
                  <div className="filters-summary__tag">
                    <span className="filters-summary__tag-text">
                      {wagonTypes.find(t => t.id === filters.wagonType)?.label}
                    </span>
                    <button 
                      className="filters-summary__tag-remove"
                      onClick={() => handleFilterChange('wagonType', 'all')}
                    >
                      ×
                    </button>
                  </div>
                )}
                {filters.priceRange !== 'all' && (
                  <div className="filters-summary__tag">
                    <span className="filters-summary__tag-text">
                      {priceRanges.find(r => r.id === filters.priceRange)?.label}
                    </span>
                    <button 
                      className="filters-summary__tag-remove"
                      onClick={() => handleFilterChange('priceRange', 'all')}
                    >
                      ×
                    </button>
                  </div>
                )}
                {filters.departureTime !== 'any' && (
                  <div className="filters-summary__tag">
                    <span className="filters-summary__tag-text">
                      {timeRanges.find(t => t.value === filters.departureTime)?.label}
                    </span>
                    <button 
                      className="filters-summary__tag-remove"
                      onClick={() => handleFilterChange('departureTime', 'any')}
                    >
                      ×
                    </button>
                  </div>
                )}
                {(filters.hasWifi || filters.hasConditioner || filters.hasLinens) && (
                  <div className="filters-summary__tag">
                    <span className="filters-summary__tag-text">
                      {[
                        filters.hasWifi && 'Wi-Fi',
                        filters.hasConditioner && 'Кондиционер',
                        filters.hasLinens && 'Белье'
                      ].filter(Boolean).join(', ')}
                    </span>
                    <button 
                      className="filters-summary__tag-remove"
                      onClick={() => {
                        handleFilterChange('hasWifi', false);
                        handleFilterChange('hasConditioner', false);
                        handleFilterChange('hasLinens', false);
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
                <button 
                  className="filters-summary__clear-all"
                  onClick={handleResetFilters}
                >
                  Очистить все
                </button>
              </div>
            </div>
          )}

          {/* Результаты поиска */}
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
                  filteredWagonType={filters.wagonType !== 'all' ? filters.wagonType : null}
                />
              ))
            ) : (
              <div className="search-results__empty">
                <div className="search-results__empty-icon">🔍</div>
                <h3 className="search-results__empty-title">Поезда не найдены</h3>
                <p className="search-results__empty-text">
                  {trains.length > 0 
                    ? 'Попробуйте изменить параметры фильтров' 
                    : error || 'К сожалению, на выбранные даты поездов не найдено'
                  }
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

          {/* Пагинация */}
          {filteredTrains.length > 0 && (
            <div className="search-results__pagination">
              <button className="pagination__button pagination__button--prev" disabled>
                ← Назад
              </button>
              <div className="pagination__pages">
                <button className="pagination__page pagination__page--active">1</button>
                <button className="pagination__page">2</button>
                <button className="pagination__page">3</button>
              </div>
              <button className="pagination__button pagination__button--next">
                Далее →
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default SearchPage;
