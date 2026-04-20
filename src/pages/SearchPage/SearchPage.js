import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

// Временные диапазоны для фильтра по времени отправления
const timeRanges = [
  { value: 'any', label: 'Любое время' },
  { value: 'morning', label: 'Утро (5:00–12:00)' },
  { value: 'day', label: 'День (12:00–18:00)' },
  { value: 'evening', label: 'Вечер (18:00–23:00)' },
  { value: 'night', label: 'Ночь (23:00–5:00)' }
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

  // Функция для получения минимальной цены поезда
  const getTrainMinPrice = useCallback((train, wagonTypeFilter) => {
    if (!train || !train.wagons || train.wagons.length === 0) {
      return Infinity;
    }

    let relevantWagons = train.wagons;

    if (wagonTypeFilter && wagonTypeFilter !== 'all') {
      const selectedApiTypes = wagonTypes.find(t => t.id === wagonTypeFilter)?.apiTypes || [];
      relevantWagons = train.wagons.filter(wagon => {
        const wagonApiType = wagon.apiType || wagon.type;
        return selectedApiTypes.includes(wagonApiType);
      });
    }

    if (!relevantWagons || relevantWagons.length === 0) {
      return Infinity;
    }

    const prices = relevantWagons
      .map(wagon => wagon.price || wagon.minPrice || wagon.topPrice)
      .filter(price => price && price > 0);

    return prices.length > 0 ? Math.min(...prices) : Infinity;
  }, []);

  // Применяем фильтры и сортировку
  useEffect(() => {
    console.log('Применение фильтров, trains.length:', trains.length);
    
    if (!trains.length) {
      setFilteredTrains([]);
      return;
    }

    let filtered = [...trains];

    // Фильтр по типу вагона
    if (filters.wagonType !== 'all') {
      const selectedApiTypes = wagonTypes.find(t => t.id === filters.wagonType)?.apiTypes || [];
      filtered = filtered.filter(train => {
        if (!train.wagons || train.wagons.length === 0) return false;
        return train.wagons.some(wagon => {
          const wagonApiType = wagon.apiType || wagon.type;
          return selectedApiTypes.includes(wagonApiType);
        });
      });
      console.log('После фильтра по типу вагона:', filtered.length);
    }

    // Фильтр по ценовому диапазону
    const priceRange = priceRanges.find(range => range.id === filters.priceRange);
    if (priceRange && priceRange.id !== 'all') {
      filtered = filtered.filter(train => {
        const minPrice = getTrainMinPrice(train, filters.wagonType);
        return minPrice >= priceRange.min && minPrice <= priceRange.max;
      });
      console.log('После фильтра по цене:', filtered.length);
    }

    // Фильтр по времени отправления
    if (filters.departureTime !== 'any') {
      filtered = filtered.filter(train => {
        try {
          if (!train.departureTime) return false;
          const hour = new Date(train.departureTime).getHours();
          switch (filters.departureTime) {
            case 'morning': return hour >= 5 && hour < 12;
            case 'day': return hour >= 12 && hour < 18;
            case 'evening': return hour >= 18 && hour < 23;
            case 'night': return hour >= 23 || hour < 5;
            default: return true;
          }
        } catch {
          return true;
        }
      });
      console.log('После фильтра по времени:', filtered.length);
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
          return getTrainMinPrice(a, filters.wagonType) - getTrainMinPrice(b, filters.wagonType);
        case 'price-desc':
          return getTrainMinPrice(b, filters.wagonType) - getTrainMinPrice(a, filters.wagonType);
        case 'duration':
          return (a.duration || 0) - (b.duration || 0);
        default:
          try {
            return new Date(a.departureTime || 0) - new Date(b.departureTime || 0);
          } catch {
            return 0;
          }
      }
    });

    console.log('Итоговое количество поездов:', filtered.length);
    setFilteredTrains(filtered);
  }, [trains, filters, sortBy, getTrainMinPrice]);

  // Загрузка поездов
  useEffect(() => {
    const fetchTrains = async () => {
      console.log('🔍 Начало загрузки поездов, searchParams:', searchParams);

      if (!searchParams || (!searchParams.from && !searchParams.to)) {
        console.warn('⚠️ Параметры поиска неполные');
        setError('Пожалуйста, укажите направление поиска');
        const demoTrains = getMockTrains();
        setTrains(demoTrains);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

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

        if (!fromCityId || !toCityId) {
          console.log('Используем моковые данные (города не найдены)');
          const mockTrains = getMockTrains();
          setTrains(mockTrains);
          setLoading(false);
          return;
        }

        const response = await trainApi.searchRoutes(apiParams);
        console.log('Ответ API:', response);

        let formattedTrains = [];

        if (response && response.items && Array.isArray(response.items) && response.items.length > 0) {
          formattedTrains = response.items.map(item => {
            try {
              const formatted = trainApi.formatRouteForUI(item);

              if (formatted.wagons) {
                formatted.wagons = formatted.wagons.map(wagon => {
                  const apiType = wagon.type;
                  let type = wagon.type;
                  let name = wagon.name;

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
                    apiType: apiType
                  };
                });
              }

              return formatted;
            } catch (formatError) {
              console.error('Ошибка форматирования поезда:', formatError);
              return null;
            }
          }).filter(train => train !== null);
        }

        if (formattedTrains.length === 0) {
          console.log('Поезда не найдены, используем моковые данные');
          formattedTrains = getMockTrains();
        }

        setTrains(formattedTrains);

      } catch (err) {
        console.error('Ошибка при загрузке поездов:', err);
        setError('Не удалось загрузить данные о поездах');
        const demoTrains = getMockTrains();
        setTrains(demoTrains);
      } finally {
        setLoading(false);
      }
    };

    fetchTrains();
  }, [searchParams]);

  const handleFilterChange = (filterName, value) => {
    console.log(`Изменение фильтра ${filterName}:`, value);
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleSortChange = (e) => {
    const newSortBy = e.target.value;
    console.log('Изменение сортировки:', newSortBy);
    setSortBy(newSortBy);
  };

  const handleResetFilters = () => {
    console.log('Сброс всех фильтров');
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

  const getMockTrains = () => {
    const now = new Date();
    return [
      {
        id: 'train-116C-001',
        number: '116C',
        name: 'Москва → Санкт‑Петербург',
        fromCity: 'Москва',
        fromStation: 'Ленинградский вокзал',
        toCity: 'Санкт‑Петербург',
        toStation: 'Московский вокзал',
        departureTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0).toISOString(),
        arrivalTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 30, 0).toISOString(),
        duration: 330,
        minPrice: 2800,
        wagons: [
          {
            id: 'wagon-1',
            type: 'coupe',
            name: 'Купе',
            apiType: 'second',
            price: 3200,
            availableSeats: 15,
            topPrice: 3500
          },
          {
            id: 'wagon-2',
            type: 'platzkart',
            name: 'Плацкарт',
            apiType: 'third',
            price: 2100,
            availableSeats: 8,
            topPrice: 2400
          }
        ],
        hasWifi: true,
        hasConditioner: true,
        hasLinens: false
      },
      {
        id: 'train-044A-002',
        number: '044A',
        name: 'Москва → Санкт‑Петербург',
        fromCity: 'Москва',
        fromStation: 'Курский вокзал',
        toCity: 'Санкт‑Петербург',
        toStation: 'Ладожский вокзал',
        departureTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30, 0).toISOString(),
        arrivalTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 45, 0).toISOString(),
        duration: 375,
        minPrice: 1900,
        wagons: [
          {
            id: 'wagon-3',
            type: 'sitting',
            name: 'Сидячий',
            apiType: 'fourth',
            price: 1900,
            availableSeats: 25,
            topPrice: 2200
          },
          {
            id: 'wagon-4',
            type: 'platzkart',
            name: 'Плацкарт',
            apiType: 'third',
            price: 2300,
            availableSeats: 12,
            topPrice: 2600
          }
        ],
        hasWifi: false,
        hasConditioner: true,
        hasLinens: true
      },
      {
        id: 'train-720A-003',
        number: '720A',
        name: 'Москва → Казань',
        fromCity: 'Москва',
        fromStation: 'Казанский вокзал',
        toCity: 'Казань',
        toStation: 'Главный вокзал',
        departureTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 15, 0).toISOString(),
        arrivalTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 45, 0).toISOString(),
        duration: 690,
        minPrice: 4200,
        wagons: [
          {
            id: 'wagon-5',
            type: 'lux',
            name: 'Люкс',
            apiType: 'first',
            price: 8500,
            availableSeats: 3,
            topPrice: 9200
          },
          {
            id: 'wagon-6',
            type: 'coupe',
            name: 'Купе',
            apiType: 'second',
            price: 4800,
            availableSeats: 7,
            topPrice: 5200
          }
        ],
        hasWifi: true,
        hasConditioner: true,
        hasLinens: true
      }
    ];
  };

  return (
    <div className="search-page">
      <OrderSteps currentStep={1} />

      <div className="search-page__content">
        {/* Блок фильтров */}
        <div className="filters">
          <h3 className="filters__title">Фильтры</h3>

          {/* Тип вагона */}
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

          {/* Ценовой диапазон */}
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

          {/* Кнопка сброса фильтров */}
          <button
            onClick={handleResetFilters}
            className="filters__reset-btn"
            type="button"
          >
            Сбросить все фильтры
          </button>
        </div>

        {/* Результаты поиска */}
        <div className="search-results">
          <div className="results-header">
            <h3 className="results-title">
              Найдено поездов: {filteredTrains.length}
            </h3>

            <div className="sort-controls">
              <label htmlFor="sort-select" className="sort-label">
                Сортировка:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={handleSortChange}
                className="sort-select"
              >
                <option value="departureTime">По времени отправления</option>
                <option value="price-asc">По возрастанию цены</option>
                <option value="price-desc">По убыванию цены</option>
                <option value="duration">По длительности поездки</option>
              </select>
            </div>
          </div>

          {/* Отображение статуса загрузки */}
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Загружаем расписание поездов...</p>
            </div>
          )}

          {/* Отображение ошибки */}
          {error && !loading && (
            <div className="error-state">
              <p className="error-message">{error}</p>
              <button
                onClick={() => setError(null)}
                className="error-dismiss"
                type="button"
              >
                ×
              </button>
            </div>
          )}

          {/* Отображение поездов */}
          {!loading && !error && filteredTrains.length === 0 && (
            <div className="no-results">
              <p>По вашим фильтрам поездов не найдено</p>
              <button
                onClick={handleResetFilters}
                className="reset-filters-link"
                type="button"
              >
                Сбросить фильтры
              </button>
            </div>
          )}

          {/* Список поездов */}
          {!loading && !error && filteredTrains.length > 0 && (
            <div className="trains-list">
              {filteredTrains.map(train => (
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

      {/* Последние билеты */}
      <LastTickets onTicketClick={handleLastTicketClick} />
    </div>
  );
}

export default SearchPage;
