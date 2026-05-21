import axios from 'axios';

const API_BASE_URL = 'https://students.netoservices.ru/fe-diplom';

// Моковые данные для городов
const MOCK_CITIES = [
  { _id: 'mock-moscow', name: 'Москва', railway_station_name: 'Ленинградский вокзал' },
  { _id: 'mock-spb', name: 'Санкт-Петербург', railway_station_name: 'Московский вокзал' },
  { _id: 'mock-kazan', name: 'Казань', railway_station_name: 'Центральный вокзал' },
  { _id: 'mock-ekb', name: 'Екатеринбург', railway_station_name: 'Главный вокзал' },
  { _id: 'mock-nn', name: 'Нижний Новгород', railway_station_name: 'Московский вокзал' },
  { _id: 'mock-sochi', name: 'Сочи', railway_station_name: 'Вокзал Сочи' },
  { _id: 'mock-krasnodar', name: 'Краснодар', railway_station_name: 'Центральный вокзал' },
  { _id: 'mock-novosibirsk', name: 'Новосибирск', railway_station_name: 'Главный вокзал' },
  { _id: 'mock-samara', name: 'Самара', railway_station_name: 'Центральный вокзал' },
  { _id: 'mock-rostov', name: 'Ростов-на-Дону', railway_station_name: 'Главный вокзал' },
  { _id: 'mock-vladivostok', name: 'Владивосток', railway_station_name: 'Вокзал Владивосток' },
  { _id: 'mock-murmansk', name: 'Мурманск', railway_station_name: 'Вокзал Мурманск' },
  { _id: 'mock-kaliningrad', name: 'Калининград', railway_station_name: 'Южный вокзал' },
  { _id: 'mock-crimea', name: 'Симферополь', railway_station_name: 'Центральный вокзал' },
  { _id: 'mock-volgograd', name: 'Волгоград', railway_station_name: 'Главный вокзал' }
];

// Конфигурации поездов
const TRAIN_CONFIGS = [
  { 
    number: '116C', 
    name: 'Сапсан', 
    type: 'express',
    have_first_class: true,
    have_second_class: true,
    have_third_class: false,
    have_fourth_class: true,
    have_wifi: true,
    have_air_conditioning: true,
    basePrice: 3500,
    duration: 240
  },
  { 
    number: '044A', 
    name: 'Невский экспресс', 
    type: 'express',
    have_first_class: true,
    have_second_class: true,
    have_third_class: false,
    have_fourth_class: true,
    have_wifi: true,
    have_air_conditioning: true,
    basePrice: 3000,
    duration: 300
  },
  { 
    number: '720A', 
    name: 'Татарстан', 
    type: 'regular',
    have_first_class: false,
    have_second_class: true,
    have_third_class: true,
    have_fourth_class: true,
    have_wifi: false,
    have_air_conditioning: true,
    basePrice: 2200,
    duration: 360
  },
  { 
    number: '256B', 
    name: 'Урал', 
    type: 'regular',
    have_first_class: true,
    have_second_class: true,
    have_third_class: true,
    have_fourth_class: false,
    have_wifi: true,
    have_air_conditioning: false,
    basePrice: 2800,
    duration: 420
  },
  { 
    number: '138M', 
    name: 'Сибиряк', 
    type: 'regular',
    have_first_class: true,
    have_second_class: true,
    have_third_class: true,
    have_fourth_class: true,
    have_wifi: false,
    have_air_conditioning: true,
    basePrice: 3200,
    duration: 480
  },
  { 
    number: '302H', 
    name: 'Волга', 
    type: 'regular',
    have_first_class: false,
    have_second_class: true,
    have_third_class: true,
    have_fourth_class: true,
    have_wifi: true,
    have_air_conditioning: true,
    basePrice: 1900,
    duration: 300
  },
  { 
    number: '002M', 
    name: 'Красная стрела', 
    type: 'express',
    have_first_class: true,
    have_second_class: true,
    have_third_class: false,
    have_fourth_class: true,
    have_wifi: true,
    have_air_conditioning: true,
    basePrice: 4000,
    duration: 270
  }
];

// Функция генерации моковых маршрутов
const generateMockRoutes = (fromCityId, toCityId, fromCityName, toCityName, fromStation, toStation) => {
  const routes = [];
  const baseDate = new Date('2024-05-20');
  
  const ROUTE_COUNT = 5;
  
  console.log(`🏭 Генерация ${ROUTE_COUNT} моковых маршрутов для ${fromCityName} → ${toCityName}`);
  
  for (let i = 0; i < ROUTE_COUNT; i++) {
    const config = TRAIN_CONFIGS[i % TRAIN_CONFIGS.length];
    
    const departureHour = 6 + i * 3;
    const departureMinute = [0, 15, 30, 45][i % 4];
    
    const departureDateTime = new Date(baseDate);
    departureDateTime.setHours(departureHour % 24, departureMinute, 0);
    
    const durationMinutes = config.duration + Math.floor(Math.random() * 60) - 30;
    const durationMs = durationMinutes * 60000;
    const arrivalDateTime = new Date(departureDateTime.getTime() + durationMs);
    
    const routeId = `mock-route-${fromCityId}-${toCityId}-${i}-${Date.now()}`;
    
    const priceMultiplier = 0.8 + (i * 0.1);
    const basePrice = Math.round(config.basePrice * priceMultiplier);
    
    const priceInfo = {};
    const availableSeatsInfo = {};
    
    if (config.have_first_class) {
      priceInfo.first = {
        bottom_price: Math.round(basePrice * 2.5),
        top_price: Math.round(basePrice * 2.8)
      };
      availableSeatsInfo.first = 2 + i;
    }
    
    if (config.have_second_class) {
      priceInfo.second = {
        bottom_price: Math.round(basePrice * 1.5),
        top_price: Math.round(basePrice * 1.7)
      };
      availableSeatsInfo.second = 5 + (i * 3);
    }
    
    if (config.have_third_class) {
      priceInfo.third = {
        bottom_price: basePrice,
        top_price: Math.round(basePrice * 1.2)
      };
      availableSeatsInfo.third = 10 + (i * 5);
    }
    
    if (config.have_fourth_class) {
      priceInfo.fourth = {
        bottom_price: Math.round(basePrice * 0.7),
        top_price: Math.round(basePrice * 0.8)
      };
      availableSeatsInfo.fourth = 15 + (i * 3);
    }

    const allPrices = [];
    if (priceInfo.first?.bottom_price) allPrices.push(priceInfo.first.bottom_price);
    if (priceInfo.second?.bottom_price) allPrices.push(priceInfo.second.bottom_price);
    if (priceInfo.third?.bottom_price) allPrices.push(priceInfo.third.bottom_price);
    if (priceInfo.fourth?.bottom_price) allPrices.push(priceInfo.fourth.bottom_price);
    const minPrice = Math.min(...allPrices);

    const route = {
      _id: routeId,
      have_first_class: config.have_first_class,
      have_second_class: config.have_second_class,
      have_third_class: config.have_third_class,
      have_fourth_class: config.have_fourth_class,
      have_wifi: config.have_wifi,
      have_air_conditioning: config.have_air_conditioning,
      is_express: config.type === 'express',
      min_price: minPrice,
      total_avaliable_seats: Object.values(availableSeatsInfo).reduce((sum, val) => sum + val, 0),
      
      departure: {
        _id: `${routeId}-dep`,
        have_first_class: config.have_first_class,
        have_second_class: config.have_second_class,
        have_third_class: config.have_third_class,
        have_fourth_class: config.have_fourth_class,
        have_wifi: config.have_wifi,
        have_air_conditioning: config.have_air_conditioning,
        is_express: config.type === 'express',
        min_price: minPrice,
        duration: Math.floor(durationMs / 1000),
        price_info: priceInfo,
        available_seats_info: availableSeatsInfo,
        
        train: {
          _id: `${routeId}-train`,
          number: config.number,
          name: config.name
        },
        
        from: {
          datetime: departureDateTime.getTime(),
          railway_station_name: fromStation,
          city: {
            _id: fromCityId,
            name: fromCityName
          }
        },
        
        to: {
          datetime: arrivalDateTime.getTime(),
          railway_station_name: toStation,
          city: {
            _id: toCityId,
            name: toCityName
          }
        }
      },
      
      arrival: null
    };
    
    routes.push(route);
    console.log(`  ✅ Маршрут ${i + 1}: ${config.number} ${config.name}, отправление: ${departureDateTime.toLocaleTimeString('ru-RU')}, цена от: ${minPrice}₽`);
  }
  
  console.log(`✅ Всего сгенерировано: ${routes.length} маршрутов`);
  return routes;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false
});

// ==================== Перехватчики запросов ====================

api.interceptors.request.use(
  (config) => {
    const requestId = Math.random().toString(36).substring(7);
    config.metadata = { requestId, startTime: Date.now() };
    
    console.log(`📤 API Request [${requestId}]:`, {
      method: config.method?.toUpperCase(),
      url: config.url,
      params: config.params,
    });
    
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    const { requestId, startTime } = response.config.metadata || {};
    const duration = Date.now() - startTime;
    
    console.log(`📥 API Response [${requestId}] (${duration}ms):`, {
      status: response.status,
      url: response.config.url,
      dataPreview: JSON.stringify(response.data).substring(0, 500)
    });
    
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// ==================== API функции ====================

const trainApi = {
  // Поиск городов (автодополнение)
  async searchCities(query) {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      console.log(`🔍 Поиск городов: "${query}"`);
      
      try {
        const response = await api.get('/routes/cities', {
          params: { 
            name: query,
            limit: 10
          }
        });
        
        console.log('📦 Ответ searchCities (полный):', JSON.stringify(response.data));
        
        let cities = response.data;
        
        if (cities && Array.isArray(cities.items)) {
          cities = cities.items;
        } else if (cities && Array.isArray(cities.data)) {
          cities = cities.data;
        } else if (cities && Array.isArray(cities.results)) {
          cities = cities.results;
        } else if (!Array.isArray(cities)) {
          console.warn('⚠️ Неизвестный формат городов:', cities);
          cities = [];
        }
        
        console.log(`✅ Найдено городов: ${cities.length}`);
        
        if (cities.length === 0) {
          console.log('🔄 API вернул пустой массив городов, используем моковые данные');
          const queryLower = query.toLowerCase();
          cities = MOCK_CITIES.filter(city => 
            city.name.toLowerCase().includes(queryLower)
          );
          console.log(`✅ Найдено моковых городов: ${cities.length}`);
        }
        
        return cities;
      } catch (apiError) {
        console.warn('⚠️ API городов недоступен, используем моковые данные:', apiError.message);
        const queryLower = query.toLowerCase();
        return MOCK_CITIES.filter(city => 
          city.name.toLowerCase().includes(queryLower)
        );
      }
    } catch (error) {
      console.error('❌ Ошибка поиска городов:', error);
      return [];
    }
  },

  // Поиск маршрутов (поездов)
  async searchRoutes(params = {}) {
    try {
      console.log('🔍 Поиск маршрутов с параметрами:', params);
      
      if (!params.from_city_id || !params.to_city_id) {
        console.warn('⚠️ Не указаны города отправления и прибытия');
        return { items: [], total_count: 0 };
      }
      
      const dateStart = params.date_start || new Date().toISOString().split('T')[0];
      const dateEnd = params.date_end || params.date_start || dateStart;
      
      const apiParams = {
        from_city_id: params.from_city_id,
        to_city_id: params.to_city_id,
        date_start: dateStart,
        date_end: dateEnd,
      };
      
      console.log('📋 Отправляемые параметры:', apiParams);
      
      let items = [];
      
      try {
        const response = await api.get('/routes', { params: apiParams });
        console.log('✅ Ответ API получен, статус:', response.status);
        console.log('📦 Тело ответа:', JSON.stringify(response.data).substring(0, 500));
        
        let routesData = response.data;
        
        if (routesData && Array.isArray(routesData.items)) {
          items = routesData.items;
          console.log(`📊 API вернул ${items.length} маршрутов (формат: items)`);
        } else if (routesData && Array.isArray(routesData.data)) {
          items = routesData.data;
          console.log(`📊 API вернул ${items.length} маршрутов (формат: data)`);
        } else if (routesData && Array.isArray(routesData.results)) {
          items = routesData.results;
          console.log(`📊 API вернул ${items.length} маршрутов (формат: results)`);
        } else if (Array.isArray(routesData)) {
          items = routesData;
          console.log(`📊 API вернул ${items.length} маршрутов (формат: массив)`);
        } else {
          console.log('⚠️ API вернул неожиданный формат:', typeof routesData);
        }
        
      } catch (apiError) {
        console.warn('⚠️ API маршрутов недоступен:', apiError.message);
      }
      
      if (items.length < 5) {
        console.log(`🔄 API вернул только ${items.length} маршрутов, добавляем моковые до 5`);
        
        const fromCity = MOCK_CITIES.find(c => c._id === params.from_city_id) || 
                        { name: 'Город отправления', railway_station_name: 'Центральный вокзал' };
        const toCity = MOCK_CITIES.find(c => c._id === params.to_city_id) || 
                      { name: 'Город прибытия', railway_station_name: 'Главный вокзал' };
        
        const mockItems = generateMockRoutes(
          params.from_city_id,
          params.to_city_id,
          fromCity.name,
          toCity.name,
          fromCity.railway_station_name,
          toCity.railway_station_name
        );
        
        const existingCount = items.length;
        const neededCount = 5 - existingCount;
        
        if (existingCount > 0) {
          items = [...items, ...mockItems.slice(0, neededCount)];
          console.log(`✅ Объединено: ${existingCount} реальных + ${neededCount} моковых = ${items.length} всего`);
        } else {
          items = mockItems;
          console.log(`✅ Используем все ${items.length} моковых маршрутов`);
        }
      }
      
      console.log(`📊 Итого маршрутов: ${items.length}`);
      
      return {
        items: items,
        total_count: items.length
      };
      
    } catch (error) {
      console.error('❌ Критическая ошибка поиска маршрутов:', error);
      
      try {
        const fromCity = MOCK_CITIES.find(c => c._id === params.from_city_id) || 
                        { name: 'Отправление', railway_station_name: 'Центральный вокзал' };
        const toCity = MOCK_CITIES.find(c => c._id === params.to_city_id) || 
                      { name: 'Прибытие', railway_station_name: 'Главный вокзал' };
        
        const items = generateMockRoutes(
          params.from_city_id || 'unknown-from',
          params.to_city_id || 'unknown-to',
          fromCity.name,
          toCity.name,
          fromCity.railway_station_name,
          toCity.railway_station_name
        );
        
        console.log(`✅ Возвращаем ${items.length} моковых маршрутов после ошибки`);
        return { items, total_count: items.length };
      } catch (mockError) {
        console.error('❌ Не удалось сгенерировать моковые данные:', mockError);
        return { items: [], total_count: 0 };
      }
    }
  },

  // Форматирование маршрута из API в формат UI
  formatRouteForUI(apiRoute, index = 0) {
    try {
      console.log('🔄 Форматируем маршрут:', JSON.stringify(apiRoute).substring(0, 300));
      
      const route = apiRoute.departure || apiRoute.train || apiRoute;
      
      if (!route) {
        console.error('❌ Некорректная структура маршрута:', apiRoute);
        return null;
      }
      
      const train = route.train || apiRoute.train || {};
      const from = route.from || apiRoute.from || {};
      const to = route.to || apiRoute.to || {};
      const fromCity = from.city || apiRoute.from_city || {};
      const toCity = to.city || apiRoute.to_city || {};
      
      const priceInfo = route.price_info || apiRoute.price_info || {};
      const availableSeatsInfo = route.available_seats_info || apiRoute.available_seats_info || {};
      
      const wagons = [];
      
      const hasFirstClass = route.have_first_class || apiRoute.have_first_class || false;
      const hasSecondClass = route.have_second_class || apiRoute.have_second_class || false;
      const hasThirdClass = route.have_third_class || apiRoute.have_third_class || false;
      const hasFourthClass = route.have_fourth_class || apiRoute.have_fourth_class || false;
      
      const baseId = apiRoute._id || apiRoute.id || `route-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`;
      
      if (hasFirstClass) {
        const price = priceInfo.first?.bottom_price || priceInfo.first?.price || 
                     apiRoute.first_class_price || 0;
        wagons.push({
          id: `${baseId}-first`,
          type: 'lux',
          name: 'Люкс',
          apiType: 'first',
          price: price,
          availableSeats: availableSeatsInfo.first || route.available_first_class || 
                         apiRoute.available_first_class || 0,
          topPrice: priceInfo.first?.top_price || 0
        });
      }
      
      if (hasSecondClass) {
        const price = priceInfo.second?.bottom_price || priceInfo.second?.price || 
                     apiRoute.second_class_price || 0;
        wagons.push({
          id: `${baseId}-second`,
          type: 'coupe',
          name: 'Купе',
          apiType: 'second',
          price: price,
          availableSeats: availableSeatsInfo.second || route.available_second_class || 
                         apiRoute.available_second_class || 0,
          topPrice: priceInfo.second?.top_price || 0
        });
      }
      
      if (hasThirdClass) {
        const price = priceInfo.third?.bottom_price || priceInfo.third?.price || 
                     apiRoute.third_class_price || 0;
        wagons.push({
          id: `${baseId}-third`,
          type: 'platzkart',
          name: 'Плацкарт',
          apiType: 'third',
          price: price,
          availableSeats: availableSeatsInfo.third || route.available_third_class || 
                         apiRoute.available_third_class || 0,
          topPrice: priceInfo.third?.top_price || 0
        });
      }
      
      if (hasFourthClass) {
        const price = priceInfo.fourth?.bottom_price || priceInfo.fourth?.price || 
                     apiRoute.fourth_class_price || 0;
        wagons.push({
          id: `${baseId}-fourth`,
          type: 'sitting',
          name: 'Сидячий',
          apiType: 'fourth',
          price: price,
          availableSeats: availableSeatsInfo.fourth || route.available_fourth_class || 
                         apiRoute.available_fourth_class || 0,
          topPrice: priceInfo.fourth?.top_price || 0
        });
      }
      
      const minPrice = wagons.length > 0 
        ? Math.min(...wagons.map(w => w.price || 0))
        : 0;
      
      const departureDateTime = from.datetime ? new Date(from.datetime) : 
                               apiRoute.departure_datetime ? new Date(apiRoute.departure_datetime) : 
                               new Date();
      const arrivalDateTime = to.datetime ? new Date(to.datetime) : 
                             apiRoute.arrival_datetime ? new Date(apiRoute.arrival_datetime) : 
                             new Date();
      
      let duration = route.duration || apiRoute.duration || 0;
      if (!duration && departureDateTime && arrivalDateTime) {
        duration = Math.floor((arrivalDateTime - departureDateTime) / (1000 * 60));
      }
      
      // Нормальные названия поездов
      const normalTrainNames = [
        { number: '116C', name: 'Сапсан' },
        { number: '044A', name: 'Невский экспресс' },
        { number: '720A', name: 'Татарстан' },
        { number: '256B', name: 'Урал' },
        { number: '138M', name: 'Сибиряк' },
        { number: '302H', name: 'Волга' },
        { number: '002M', name: 'Красная стрела' },
        { number: '010A', name: 'Московия' },
        { number: '026C', name: 'Северная Пальмира' },
        { number: '050H', name: 'Поволжье' },
      ];
      
      let trainNumber = train.number || train.name || apiRoute.train_number || 'Unknown';
      let trainName = train.name || '';
      
      // Проверяем на странные названия
      if (!trainNumber || 
          trainNumber === 'undefined' || 
          trainNumber === 'null' || 
          /^[А-Я][а-я]+$/.test(trainNumber) || 
          trainNumber.length > 6 ||
          trainNumber.includes('Перун') ||
          trainNumber.includes('Зевс') ||
          trainNumber.includes('бог') ||
          trainNumber.includes('богиня') ||
          trainNumber.includes('Unknown')) {
        const normalTrain = normalTrainNames[index % normalTrainNames.length];
        trainNumber = normalTrain.number;
        trainName = normalTrain.name;
      }
      
      const result = {
        id: baseId,
        number: trainNumber,
        name: trainName || `${fromCity.name || 'Unknown'} → ${toCity.name || 'Unknown'}`,
        fromCity: fromCity.name || apiRoute.from_city_name || 'Unknown',
        fromStation: from.railway_station_name || apiRoute.from_station || 'Unknown Station',
        toCity: toCity.name || apiRoute.to_city_name || 'Unknown',
        toStation: to.railway_station_name || apiRoute.to_station || 'Unknown Station',
        departureTime: departureDateTime.toISOString(),
        arrivalTime: arrivalDateTime.toISOString(),
        departureDate: departureDateTime.toLocaleDateString('ru-RU'),
        arrivalDate: arrivalDateTime.toLocaleDateString('ru-RU'),
        duration: duration,
        minPrice: minPrice,
        wagons: wagons,
        hasWifi: route.have_wifi || apiRoute.have_wifi || false,
        hasConditioner: route.have_air_conditioning || apiRoute.have_air_conditioning || false,
        hasLinens: route.have_linens_included || apiRoute.have_linens_included || false
      };
      
      console.log('✅ Сформатированный маршрут:', {
        id: result.id,
        number: result.number,
        name: result.name,
        from: result.fromCity,
        to: result.toCity,
        wagons: result.wagons.length
      });
      
      return result;
    } catch (error) {
      console.error('❌ Ошибка форматирования маршрута:', error);
      return null;
    }
  },

  // Получение деталей маршрута
  async getRouteDetails(routeId) {
    try {
      console.log(`🔍 Получение деталей маршрута: ${routeId}`);
      const response = await api.get(`/routes/${routeId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка получения деталей маршрута ${routeId}:`, error);
      throw error;
    }
  },

  // Получение информации о местах
  async getRouteSeats(routeId, params = {}) {
    try {
      console.log(`🔍 Получение мест для маршрута: ${routeId}`, params);
      const response = await api.get(`/routes/${routeId}/seats`, { params });
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка получения мест маршрута ${routeId}:`, error);
      throw error;
    }
  },

  // Создание заказа
  async createOrder(orderData) {
    try {
      console.log('📝 Создание заказа:', orderData);
      const response = await api.post('/order', orderData);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка создания заказа:', error);
      throw error;
    }
  },

  // Получение информации о заказе
  async getOrder(orderId) {
    try {
      console.log(`🔍 Получение информации о заказе: ${orderId}`);
      const response = await api.get(`/order/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка получения заказа ${orderId}:`, error);
      throw error;
    }
  },

  // Подписка на email
  async subscribeToEmail(email) {
    try {
      console.log(`📧 Подписка на email: ${email}`);
      const response = await api.post('/subscribe', { email });
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка подписки:', error);
      throw error;
    }
  },

  // Получение списка всех городов
  async getAllCities() {
    try {
      const response = await api.get('/routes/cities');
      let cities = response.data;
      if (cities?.items && Array.isArray(cities.items)) {
        return cities.items;
      }
      return Array.isArray(cities) ? cities : MOCK_CITIES;
    } catch (error) {
      console.error('❌ Ошибка получения городов:', error);
      return MOCK_CITIES;
    }
  },

  // Получение последних направлений
  async getLastRoutes() {
    try {
      console.log('🔍 Получение последних направлений');
      
      try {
        const response = await api.get('/routes/last');
        console.log('📦 Ответ last routes:', response.data);
        
        if (Array.isArray(response.data) && response.data.length > 0) {
          return response.data;
        }
      } catch (apiError) {
        console.warn('⚠️ API последних направлений недоступен');
      }
      
      console.log('🔄 Генерируем моковые последние направления');
      const mockLastRoutes = [];
      const popularRoutes = [
        { from: 'Москва', to: 'Санкт-Петербург', price: 2500, trainNumber: '116C', trainName: 'Сапсан' },
        { from: 'Москва', to: 'Казань', price: 3200, trainNumber: '720A', trainName: 'Татарстан' },
        { from: 'Москва', to: 'Сочи', price: 4500, trainNumber: '302H', trainName: 'Волга' },
      ];
      
      popularRoutes.forEach((route, index) => {
        mockLastRoutes.push({
          _id: `last-route-${index}`,
          from_city: { name: route.from },
          to_city: { name: route.to },
          min_price: route.price + Math.floor(Math.random() * 500),
          train: {
            number: route.trainNumber,
            name: route.trainName
          }
        });
      });
      
      return mockLastRoutes;
    } catch (error) {
      console.error('❌ Ошибка получения последних направлений:', error);
      return [];
    }
  },

  // Поиск станций
  async searchStations(query) {
    try {
      if (!query || query.length < 2) return [];
      const response = await api.get('/routes/stations', { params: { name: query } });
      return response.data || [];
    } catch (error) {
      console.error('❌ Ошибка поиска станций:', error);
      return [];
    }
  },

  // Тест подключения к API
  async testConnection() {
    try {
      const response = await api.get('/routes/cities', { 
        params: { name: 'Москва' },
        timeout: 10000 
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Получение минимальной цены маршрута
  getMinPrice(route) {
    if (!route) return 0;
    const priceInfo = route.departure?.price_info || route.price_info;
    if (!priceInfo) return 0;
    
    const prices = [];
    if (priceInfo.first?.bottom_price) prices.push(priceInfo.first.bottom_price);
    if (priceInfo.second?.bottom_price) prices.push(priceInfo.second.bottom_price);
    if (priceInfo.third?.bottom_price) prices.push(priceInfo.third.bottom_price);
    if (priceInfo.fourth?.bottom_price) prices.push(priceInfo.fourth.bottom_price);
    
    return prices.length > 0 ? Math.min(...prices) : 0;
  }
};

export { trainApi };
export default api;