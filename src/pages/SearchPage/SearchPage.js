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

// Типы вагонов - ИСПРАВЛЕНО: apiTypes теперь соответствует тому, что приходит в wagons[N].apiType
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
  const getWagonApiType = (wagon) => {
    // Приоритет: apiType > type (если type это 'first'/'second'/'third'/'fourth')
    if (wagon.apiType && ['first', 'second', 'third', 'fourth'].includes(wagon.apiType)) {
      return wagon.apiType;
    }
    if (wagon.type && ['first', 'second', 'third', 'fourth'].includes(wagon.type)) {
      return wagon.type;
    }
    // Обратный маппинг: lux→first, coupe→second, platzkart→third, sitting→fourth
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
  };

  // Функция для получения минимальной цены поезда
  const getTrainMinPrice = useCallback((train, wagonTypeFilter) => {
    if (!train || !train.wagons || train.wagons.length === 0) {
      console.log('  ❌ getTrainMinPrice: нет вагонов у поезда');
      return Infinity;
    }

    let relevantWagons = train.wagons;

    // Если выбран конкретный тип вагона, фильтруем
    if (wagonTypeFilter && wagonTypeFilter !== 'all') {
      const selectedApiTypes = wagonTypes.find(t => t.id === wagonTypeFilter)?.apiTypes || [];
      console.log(`  🔍 Фильтр по типу "${wagonTypeFilter}", apiTypes:`, selectedApiTypes);
      
      relevantWagons = train.wagons.filter(wagon => {
        const apiType = getWagonApiType(wagon);
        const match = apiType && selectedApiTypes.includes(apiType);
        console.log(`    Вагон: type=${wagon.type}, apiType=${wagon.apiType} → apiType=${apiType}, match=${match}`);
        return match;
      });
      
      console.log(`  Найдено вагонов после фильтрации: ${relevantWagons.length}`);
    }

    if (!relevantWagons || relevantWagons.length === 0) {
      return Infinity;
    }

    const prices = relevantWagons
      .map(wagon => wagon.price)
      .filter(price => price != null && !isNaN(price) && price > 0);

    const minPrice = prices.length > 0 ? Math.min(...prices) : Infinity;
    return minPrice;
  }, []);

  // Применяем фильтры и сортировку
  useEffect(() => {
    console.log('🔄 ====== ПРИМЕНЕНИЕ ФИЛЬТРОВ ======');
    console.log('trains.length:', trains.length);
    console.log('Текущие фильтры:', filters);
    console.log('Сортировка:', sortBy);
    
    if (!trains.length) {
      console.log('❌ trains пуст, filteredTrains = []');
      setFilteredTrains([]);
      return;
    }

    let filtered = [...trains];

    // Фильтр по типу вагона
    if (filters.wagonType !== 'all') {
      console.log(`\n🔍 ФИЛЬТР ПО ТИПУ ВАГОНА: "${filters.wagonType}"`);
      const selectedApiTypes = wagonTypes.find(t => t.id === filters.wagonType)?.apiTypes || [];
      console.log('Ищем вагоны с apiType из:', selectedApiTypes);
      
      filtered = filtered.filter(train => {
        if (!train.wagons || train.wagons.length === 0) {
          console.log(`  Поезд ${train.number}: нет вагонов`);
          return false;
        }
        
        const hasMatchingWagon = train.wagons.some(wagon => {
          const apiType = getWagonApiType(wagon);
          const match = apiType && selectedApiTypes.includes(apiType);
          return match;
        });
        
        console.log(`  Поезд ${train.number}: hasMatchingWagon=${hasMatchingWagon}`);
        return hasMatchingWagon;
      });
      
      console.log(`✅ После фильтра по типу вагона осталось: ${filtered.length} поездов`);
    }

    // Фильтр по ценовому диапазону
    const priceRange = priceRanges.find(range => range.id === filters.priceRange);
    if (priceRange && priceRange.id !== 'all') {
      console.log(`\n💰 ФИЛЬТР ПО ЦЕНЕ: "${filters.priceRange}" (${priceRange.min}-${priceRange.max})`);
      filtered = filtered.filter(train => {
        const minPrice = getTrainMinPrice(train, filters.wagonType);
        const passed = isFinite(minPrice) && minPrice >= priceRange.min && minPrice <= priceRange.max;
        console.log(`  Поезд ${train.number}: minPrice=${minPrice}, passed=${passed}`);
        return passed;
      });
      console.log(`✅ После фильтра по цене осталось: ${filtered.length} поездов`);
    }

    // Фильтр по времени отправления
    if (filters.departureTime !== 'any') {
      console.log(`\n🕐 ФИЛЬТР ПО ВРЕМЕНИ: "${filters.departureTime}"`);
      filtered = filtered.filter(train => {
        try {
          if (!train.departureTime) return false;
          const hour = new Date(train.departureTime).getHours();
          if (isNaN(hour)) return false;
          let passed = false;
          switch (filters.departureTime) {
            case 'morning': passed = hour >= 5 && hour < 12; break;
            case 'day': passed = hour >= 12 && hour < 18; break;
            case 'evening': passed = hour >= 18 && hour < 23; break;
            case 'night': passed = hour >= 23 || hour < 5; break;
            default: passed = true;
          }
          console.log(`  Поезд ${train.number}: hour=${hour}, passed=${passed}`);
          return passed;
        } catch {
          return false;
        }
      });
      console.log(`✅ После фильтра по времени осталось: ${filtered.length} поездов`);
    }

    // Фильтр по услугам
    if (filters.hasWifi) {
      console.log('\n📶 ФИЛЬТР WiFi');
      filtered = filtered.filter(train => train.hasWifi === true);
      console.log(`✅ После фильтра WiFi осталось: ${filtered.length} поездов`);
    }
    if (filters.hasConditioner) {
      console.log('\n❄️ ФИЛЬТР Кондиционер');
      filtered = filtered.filter(train => train.hasConditioner === true);
      console.log(`✅ После фильтра кондиционер осталось: ${filtered.length} поездов`);
    }
    if (filters.hasLinens) {
      console.log('\n🛏️ ФИЛЬТР Белье');
      filtered = filtered.filter(train => train.hasLinens === true);
      console.log(`✅ После фильтра белье осталось: ${filtered.length} поездов`);
    }

    // Сортировка
    console.log(`\n📊 СОРТИРОВКА: "${sortBy}"`);
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

    console.log(`\n✅ ИТОГО: ${filtered.length} поездов после всех фильтров`);
    console.log('Поезда:', filtered.map(t => `${t.number} (вагоны: ${t.wagons?.map(w => `${w.type}/${w.apiType}`).join(', ')})`));
    setFilteredTrains(filtered);
  }, [trains, filters, sortBy, getTrainMinPrice]);

  // Загрузка поездов
  useEffect(() => {
    const fetchTrains = async () => {
      console.log('🔍 ====== НАЧАЛО ЗАГРУЗКИ ПОЕЗДОВ ======');
      console.log('searchParams:', searchParams);

      try {
        setLoading(true);
        setError(null);

        let fromCityId = null;
        let toCityId = null;

        if (searchParams?.from) {
          console.log('🔍 Ищем город отправления:', searchParams.from);
          try {
            const fromCities = await trainApi.searchCities(searchParams.from);
            if (fromCities && fromCities.length > 0) {
              fromCityId = fromCities[0]._id || fromCities[0].id;
              console.log('✅ fromCityId:', fromCityId);
            }
          } catch (e) {
            console.error('Ошибка поиска города отправления:', e);
          }
        }

        if (searchParams?.to) {
          console.log('🔍 Ищем город прибытия:', searchParams.to);
          try {
            const toCities = await trainApi.searchCities(searchParams.to);
            if (toCities && toCities.length > 0) {
              toCityId = toCities[0]._id || toCities[0].id;
              console.log('✅ toCityId:', toCityId);
            }
          } catch (e) {
            console.error('Ошибка поиска города прибытия:', e);
          }
        }

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

        console.log('📋 Параметры для API:', apiParams);

        const response = await trainApi.searchRoutes(apiParams);
        console.log('📦 Ответ API (первые 500 символов):', JSON.stringify(response).substring(0, 500));

        let formattedTrains = [];

        if (response && response.items && Array.isArray(response.items)) {
          console.log(`✅ Получено ${response.items.length} маршрутов`);
          
          formattedTrains = response.items
            .map((item, index) => {
              try {
                const formatted = trainApi.formatRouteForUI(item);
                
                if (!formatted) {
                  console.warn(`❌ Маршрут ${index + 1} не отформатировался`);
                  return null;
                }

                // Маппим типы вагонов
                if (formatted.wagons && formatted.wagons.length > 0) {
                  formatted.wagons = formatted.wagons.map(wagon => {
                    const apiType = wagon.apiType || wagon.type;
                    let type = apiType;
                    let name = wagon.name || '';
                    
                    if (apiType === 'first') {
                      type = 'lux';
                      name = 'Люкс';
                    } else if (apiType === 'second') {
                      type = 'coupe';
                      name = 'Купе';
                    } else if (apiType === 'third') {
                      type = 'platzkart';
                      name = 'Плацкарт';
                    } else if (apiType === 'fourth') {
                      type = 'sitting';
                      name = 'Сидячий';
                    }
                    
                    return {
                      ...wagon,
                      type,
                      name: name || wagon.name,
                      apiType // сохраняем оригинальный API-тип
                    };
                  });
                }

                console.log(`✅ Поезд ${formatted.number}:`, {
                  wagons: formatted.wagons?.map(w => `${w.type}/${w.apiType}`)
                });

                return formatted;
              } catch (e) {
                console.error(`❌ Ошибка форматирования маршрута ${index + 1}:`, e);
                return null;
              }
            })
            .filter(train => train !== null);
        }

        // Резервные данные, если ничего не загрузилось
        if (formattedTrains.length === 0) {
          console.warn('⚠️ Использую резервные данные');
          formattedTrains = [
            {
              id: 'reserve-1',
              number: '116C',
              name: 'Москва → Санкт-Петербург',
              fromCity: 'Москва',
              fromStation: 'Ленинградский вокзал',
              toCity: 'Санкт-Петербург',
              toStation: 'Московский вокзал',
              departureTime: new Date(2026, 4, 5, 8, 0).toISOString(),
              arrivalTime: new Date(2026, 4, 5, 13, 30).toISOString(),
              departureDate: '05.05.2026',
              arrivalDate: '05.05.2026',
              duration: 330,
              minPrice: 2100,
              wagons: [
                { id: 'w1', type: 'coupe', name: 'Купе', apiType: 'second', price: 3200, availableSeats: 15, topPrice: 3500 },
                { id: 'w2', type: 'platzkart', name: 'Плацкарт', apiType: 'third', price: 2100, availableSeats: 8, topPrice: 2400 }
              ],
              hasWifi: true,
              hasConditioner: true,
              hasLinens: false
            },
            {
              id: 'reserve-2',
              number: '044A',
              name: 'Москва → Санкт-Петербург',
              fromCity: 'Москва',
              fromStation: 'Курский вокзал',
              toCity: 'Санкт-Петербург',
              toStation: 'Ладожский вокзал',
              departureTime: new Date(2026, 4, 5, 10, 30).toISOString(),
              arrivalTime: new Date(2026, 4, 5, 16, 45).toISOString(),
              departureDate: '05.05.2026',
              arrivalDate: '05.05.2026',
              duration: 375,
              minPrice: 1900,
              wagons: [
                { id: 'w3', type: 'sitting', name: 'Сидячий', apiType: 'fourth', price: 1900, availableSeats: 25, topPrice: 2200 },
                { id: 'w4', type: 'platzkart', name: 'Плацкарт', apiType: 'third', price: 2300, availableSeats: 12, topPrice: 2600 }
              ],
              hasWifi: false,
              hasConditioner: true,
              hasLinens: true
            },
            {
              id: 'reserve-3',
              number: '720A',
              name: 'Москва → Казань',
              fromCity: 'Москва',
              fromStation: 'Казанский вокзал',
              toCity: 'Казань',
              toStation: 'Главный вокзал',
              departureTime: new Date(2026, 4, 5, 22, 15).toISOString(),
              arrivalTime: new Date(2026, 4, 6, 9, 45).toISOString(),
              departureDate: '05.05.2026',
              arrivalDate: '06.05.2026',
              duration: 690,
              minPrice: 4800,
              wagons: [
                { id: 'w5', type: 'lux', name: 'Люкс', apiType: 'first', price: 8500, availableSeats: 3, topPrice: 9200 },
                { id: 'w6', type: 'coupe', name: 'Купе', apiType: 'second', price: 4800, availableSeats: 7, topPrice: 5200 }
              ],
              hasWifi: true,
              hasConditioner: true,
              hasLinens: true
            }
          ];
        }

        console.log('🚂 ИТОГО ПОЕЗДОВ:', formattedTrains.length);
        formattedTrains.forEach(t => {
          console.log(`  ${t.number}: вагоны [${t.wagons?.map(w => `${w.type}/${w.apiType}`).join(', ')}]`);
        });
        
        setTrains(formattedTrains);

      } catch (err) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', err);
        setError('Произошла ошибка при загрузке');
        
        // Резервные данные
        setTrains([
          {
            id: 'error-1',
            number: '116C',
            name: 'Москва → Санкт-Петербург',
            fromCity: 'Москва',
            fromStation: 'Ленинградский вокзал',
            toCity: 'Санкт-Петербург',
            toStation: 'Московский вокзал',
            departureTime: new Date(2026, 4, 5, 8, 0).toISOString(),
            arrivalTime: new Date(2026, 4, 5, 13, 30).toISOString(),
            departureDate: '05.05.2026',
            arrivalDate: '05.05.2026',
            duration: 330,
            minPrice: 2100,
            wagons: [
              { id: 'w1', type: 'coupe', name: 'Купе', apiType: 'second', price: 3200, availableSeats: 15, topPrice: 3500 },
              { id: 'w2', type: 'platzkart', name: 'Плацкарт', apiType: 'third', price: 2100, availableSeats: 8, topPrice: 2400 }
            ],
            hasWifi: true,
            hasConditioner: true,
            hasLinens: false
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrains();
  }, [searchParams]);

  const handleFilterChange = (filterName, value) => {
    console.log(`🔄 Изменение фильтра ${filterName}:`, value);
    setFilters(prev => ({ ...prev, [filterName]: value }));
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

  const handleTrainSelect = (train) => {
    setSelectedTrain({ ...train, originalData: train });
    navigate('/seats');
  };

  const handleLastTicketClick = (ticketData) => {
    let wagonType = 'coupe';
    let wagonName = 'Купе';
    let apiType = 'second';

    if (ticketData.wagonType === 'first') { wagonType = 'lux'; wagonName = 'Люкс'; apiType = 'first'; }
    else if (ticketData.wagonType === 'third') { wagonType = 'platzkart'; wagonName = 'Плацкарт'; apiType = 'third'; }
    else if (ticketData.wagonType === 'fourth') { wagonType = 'sitting'; wagonName = 'Сидячий'; apiType = 'fourth'; }

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
      departureDate: ticketData.departureDate || new Date().toLocaleDateString('ru-RU'),
      arrivalDate: ticketData.arrivalDate || new Date(Date.now() + 5 * 60 * 60 * 1000).toLocaleDateString('ru-RU'),
      duration: ticketData.duration || 300,
      minPrice: ticketData.price || 2000,
      wagons: [{
        id: `w-${Date.now()}`,
        type: wagonType,
        name: wagonName,
        apiType: apiType,
        price: ticketData.price || 2000,
        availableSeats: Math.floor(Math.random() * 15) + 5,
        topPrice: (ticketData.price || 2000) * 1.2
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
        {/* Блок фильтров */}
        <div className="filters">
          <h3 className="filters__title">Фильтры</h3>

          <div className="filters__section">
            <h4 className="filters__section-title">Тип вагона</h4>
            <div className="wagon-types">
              {wagonTypes.map(wagon => (
                <label key={wagon.id} className={`wagon-types__option ${filters.wagonType === wagon.id ? 'wagon-types__option--active' : ''}`}>
                  <input type="radio" name="wagonType" value={wagon.id} checked={filters.wagonType === wagon.id}
                    onChange={(e) => handleFilterChange('wagonType', e.target.value)} className="wagon-types__radio" />
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
                  <input type="radio" name="priceRange" value={range.id} checked={filters.priceRange === range.id}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)} className="filters__radio" />
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
                  <input type="radio" name="departureTime" value={range.value} checked={filters.departureTime === range.value}
                    onChange={(e) => handleFilterChange('departureTime', e.target.value)} className="filters__radio" />
                  <span className="filters__option-label">{range.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filters__section">
            <h4 className="filters__section-title">Услуги в поезде</h4>
            <div className="filters__checkboxes">
              <label className="filters__checkbox-label">
                <input type="checkbox" checked={filters.hasWifi} onChange={(e) => handleFilterChange('hasWifi', e.target.checked)} className="filters__checkbox" />
                <span className="filters__checkbox-text">Wi‑Fi</span>
              </label>
              <label className="filters__checkbox-label">
                <input type="checkbox" checked={filters.hasConditioner} onChange={(e) => handleFilterChange('hasConditioner', e.target.checked)} className="filters__checkbox" />
                <span className="filters__checkbox-text">Кондиционер</span>
              </label>
              <label className="filters__checkbox-label">
                <input type="checkbox" checked={filters.hasLinens} onChange={(e) => handleFilterChange('hasLinens', e.target.checked)} className="filters__checkbox" />
                <span className="filters__checkbox-text">Постельное бельё</span>
              </label>
            </div>
          </div>

          <button onClick={handleResetFilters} className="filters__reset-btn" type="button">
            Сбросить все фильтры
          </button>
        </div>

        {/* Результаты поиска */}
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
              <p style={{fontSize: '14px', color: '#666'}}>Всего поездов: {trains.length}, но все отфильтрованы</p>
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
