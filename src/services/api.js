import axios from 'axios';

const API_BASE_URL = 'https://students.netoservices.ru/fe-diplom';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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
      data: config.data ? JSON.parse(JSON.stringify(config.data)) : null,
      timestamp: new Date().toISOString()
    });
    
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', {
      message: error.message,
      config: error.config,
      timestamp: new Date().toISOString()
    });
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    const { requestId, startTime } = response.config.metadata || {};
    const duration = Date.now() - startTime;
    
    console.log(`📥 API Response [${requestId}]:`, {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      duration: `${duration}ms`,
      data: response.data ? JSON.parse(JSON.stringify(response.data)) : null,
      timestamp: new Date().toISOString()
    });
    
    return response;
  },
  (error) => {
    const { requestId, startTime } = error.config?.metadata || {};
    const duration = startTime ? Date.now() - startTime : 0;
    
    console.error(`❌ API Response Error [${requestId}]:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      duration: `${duration}ms`,
      message: error.message,
      data: error.response?.data,
      config: {
        method: error.config?.method,
        params: error.config?.params,
        data: error.config?.data
      },
      timestamp: new Date().toISOString()
    });
    
    // Детализация ошибок по типам
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️  Timeout Error: Превышено время ожидания ответа от сервера');
    } else if (!error.response) {
      console.error('🌐 Network Error: Проверьте подключение к интернету');
    } else {
      switch (error.response?.status) {
        case 400:
          console.error('🔴 Bad Request: Неверные параметры запроса');
          break;
        case 401:
          console.error('🔐 Unauthorized: Требуется авторизация');
          break;
        case 403:
          console.error('🚫 Forbidden: Доступ запрещен');
          break;
        case 404:
          console.error('🔍 Not Found: Ресурс не найден');
          break;
        case 500:
          console.error('💥 Server Error: Внутренняя ошибка сервера');
          break;
        case 502:
          console.error('🔄 Bad Gateway: Проблемы с прокси-сервером');
          break;
        case 503:
          console.error('🚧 Service Unavailable: Сервис временно недоступен');
          break;
      }
    }
    
    return Promise.reject(error);
  }
);

// ==================== Моковые данные ====================

const MOCK_ROUTES = {
  total_count: 6,
  offset: 0,
  limit: 6,
  items: [
    {
      _id: 'route-001',
      departure: {
        _id: 'dep-001',
        train: {
          _id: 'train-001',
          name: '123А',
          number: '123'
        },
        from: {
          city: {
            _id: 'city-1',
            name: 'Москва'
          },
          railway_station_name: 'Курский вокзал',
          datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        to: {
          city: {
            _id: 'city-2',
            name: 'Санкт-Петербург'
          },
          railway_station_name: 'Московский вокзал',
          datetime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString()
        },
        duration: 480,
        have_second_class: true,
        have_wifi: true,
        have_air_conditioning: true,
        price_info: {
          second: {
            bottom_price: 2500,
            top_price: 3500
          }
        },
        available_seats_info: {
          second: 15
        }
      }
    },
    {
      _id: 'route-002',
      departure: {
        _id: 'dep-002',
        train: {
          _id: 'train-002',
          name: '456Б',
          number: '456'
        },
        from: {
          city: {
            _id: 'city-2',
            name: 'Санкт-Петербург'
          },
          railway_station_name: 'Московский вокзал',
          datetime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
        },
        to: {
          city: {
            _id: 'city-1',
            name: 'Москва'
          },
          railway_station_name: 'Курский вокзал',
          datetime: new Date(Date.now() + 48 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString()
        },
        duration: 485,
        have_third_class: true,
        price_info: {
          third: {
            bottom_price: 1800,
            top_price: 2500
          }
        },
        available_seats_info: {
          third: 25
        }
      }
    },
    {
      _id: 'route-003',
      departure: {
        _id: 'dep-003',
        train: {
          _id: 'train-003',
          name: '789В',
          number: '789'
        },
        from: {
          city: {
            _id: 'city-3',
            name: 'Казань'
          },
          railway_station_name: 'Казанский вокзал',
          datetime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
        },
        to: {
          city: {
            _id: 'city-4',
            name: 'Екатеринбург'
          },
          railway_station_name: 'Екатеринбург-Пассажирский',
          datetime: new Date(Date.now() + 72 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString()
        },
        duration: 840,
        have_second_class: true,
        price_info: {
          second: {
            bottom_price: 3500,
            top_price: 4500
          }
        },
        available_seats_info: {
          second: 8
        }
      }
    },
    {
      _id: 'route-004',
      departure: {
        _id: 'dep-004',
        train: {
          _id: 'train-004',
          name: '012Г',
          number: '012'
        },
        from: {
          city: {
            _id: 'city-5',
            name: 'Новосибирск'
          },
          railway_station_name: 'Новосибирск-Главный',
          datetime: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString()
        },
        to: {
          city: {
            _id: 'city-6',
            name: 'Красноярск'
          },
          railway_station_name: 'Красноярск-Пассажирский',
          datetime: new Date(Date.now() + 96 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString()
        },
        duration: 360,
        have_first_class: true,
        have_wifi: true,
        price_info: {
          first: {
            bottom_price: 5500,
            top_price: 7500
          }
        },
        available_seats_info: {
          first: 4
        }
      }
    },
    {
      _id: 'route-005',
      departure: {
        _id: 'dep-005',
        train: {
          _id: 'train-005',
          name: '345Д',
          number: '345'
        },
        from: {
          city: {
            _id: 'city-7',
            name: 'Сочи'
          },
          railway_station_name: 'Сочи',
          datetime: new Date(Date.now() + 120 * 60 * 60 * 1000).toISOString()
        },
        to: {
          city: {
            _id: 'city-1',
            name: 'Москва'
          },
          railway_station_name: 'Курский вокзал',
          datetime: new Date(Date.now() + 120 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000).toISOString()
        },
        duration: 1440,
        have_second_class: true,
        have_third_class: true,
        have_air_conditioning: true,
        price_info: {
          second: {
            bottom_price: 4200,
            top_price: 5200
          },
          third: {
            bottom_price: 2800,
            top_price: 3800
          }
        },
        available_seats_info: {
          second: 12,
          third: 30
        }
      }
    },
    {
      _id: 'route-006',
      departure: {
        _id: 'dep-006',
        train: {
          _id: 'train-006',
          name: '678Е',
          number: '678'
        },
        from: {
          city: {
            _id: 'city-8',
            name: 'Владивосток'
          },
          railway_station_name: 'Владивосток',
          datetime: new Date(Date.now() + 144 * 60 * 60 * 1000).toISOString()
        },
        to: {
          city: {
            _id: 'city-9',
            name: 'Хабаровск'
          },
          railway_station_name: 'Хабаровск-1',
          datetime: new Date(Date.now() + 144 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000).toISOString()
        },
        duration: 720,
        have_fourth_class: true,
        price_info: {
          fourth: {
            bottom_price: 1200,
            top_price: 1800
          }
        },
        available_seats_info: {
          fourth: 45
        }
      }
    }
  ]
};

const MOCK_CITIES = [
  { _id: 'city-1', name: 'Москва' },
  { _id: 'city-2', name: 'Санкт-Петербург' },
  { _id: 'city-3', name: 'Казань' },
  { _id: 'city-4', name: 'Екатеринбург' },
  { _id: 'city-5', name: 'Новосибирск' },
  { _id: 'city-6', name: 'Красноярск' },
  { _id: 'city-7', name: 'Сочи' },
  { _id: 'city-8', name: 'Владивосток' },
  { _id: 'city-9', name: 'Хабаровск' },
  { _id: 'city-10', name: 'Нижний Новгород' },
  { _id: 'city-11', name: 'Самара' },
  { _id: 'city-12', name: 'Омск' },
  { _id: 'city-13', name: 'Ростов-на-Дону' },
  { _id: 'city-14', name: 'Уфа' },
  { _id: 'city-15', name: 'Волгоград' }
];

const MOCK_ORDER_RESPONSE = {
  result: 'success',
  order: {
    order_id: 'ORDER-' + Date.now(),
    status: 'confirmed',
    total: 2500,
    created_at: new Date().toISOString(),
    tickets: [
      {
        ticket_id: 'TICKET-001',
        seat_number: '12',
        coach_number: '5',
        train_number: '123А',
        departure_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        arrival_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
        passenger_name: 'Иванов Иван Иванович'
      }
    ]
  }
};

// ==================== Утилиты ====================

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getMinPrice = (route) => {
  const priceInfo = route.departure?.price_info || route.price_info;
  if (!priceInfo) return 0;

  const prices = [];
  
  if (priceInfo.first?.bottom_price) prices.push(priceInfo.first.bottom_price);
  if (priceInfo.second?.bottom_price) prices.push(priceInfo.second.bottom_price);
  if (priceInfo.third?.bottom_price) prices.push(priceInfo.third.bottom_price);
  if (priceInfo.fourth?.bottom_price) prices.push(priceInfo.fourth.bottom_price);
  
  if (prices.length === 0) return 0;
  
  return Math.min(...prices);
};

const formatRouteForUI = (apiRoute) => {
  const departure = apiRoute.departure || apiRoute;
  
  return {
    id: apiRoute._id || apiRoute.id,
    number: departure.train?.number || departure.train?.name || 'Unknown',
    name: `${departure.from?.city?.name || 'Unknown'} → ${departure.to?.city?.name || 'Unknown'}`,
    fromCity: departure.from?.city?.name || 'Unknown',
    fromStation: departure.from?.railway_station_name || 'Unknown',
    toCity: departure.to?.city?.name || 'Unknown',
    toStation: departure.to?.railway_station_name || 'Unknown',
    departureTime: departure.from?.datetime || new Date().toISOString(),
    arrivalTime: departure.to?.datetime || new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    departureDate: departure.from?.datetime ? 
      new Date(departure.from.datetime).toLocaleDateString('ru-RU') : 
      new Date().toLocaleDateString('ru-RU'),
    arrivalDate: departure.to?.datetime ? 
      new Date(departure.to.datetime).toLocaleDateString('ru-RU') : 
      new Date(Date.now() + 8 * 60 * 60 * 1000).toLocaleDateString('ru-RU'),
    duration: departure.duration || 0,
    minPrice: getMinPrice(apiRoute),
    priceInfo: departure.price_info,
    availableSeatsInfo: departure.available_seats_info,
    hasWifi: departure.have_wifi || false,
    hasConditioner: departure.have_air_conditioning || false,
    hasLinens: departure.have_linens_included || false,
    // Собираем информацию о вагонах
    wagons: [
      ...(departure.have_first_class ? [{
        id: `wagon-${apiRoute._id}-first`,
        type: 'first',
        name: 'Люкс',
        price: departure.price_info?.first?.bottom_price || 0,
        availableSeats: departure.available_seats_info?.first || 0,
        topPrice: departure.price_info?.first?.top_price || 0,
        number: '1'
      }] : []),
      ...(departure.have_second_class ? [{
        id: `wagon-${apiRoute._id}-second`,
        type: 'second',
        name: 'Купе',
        price: departure.price_info?.second?.bottom_price || 0,
        availableSeats: departure.available_seats_info?.second || 0,
        topPrice: departure.price_info?.second?.top_price || 0,
        number: '2'
      }] : []),
      ...(departure.have_third_class ? [{
        id: `wagon-${apiRoute._id}-third`,
        type: 'third',
        name: 'Плацкарт',
        price: departure.price_info?.third?.bottom_price || 0,
        availableSeats: departure.available_seats_info?.third || 0,
        topPrice: departure.price_info?.third?.top_price || 0,
        number: '3'
      }] : []),
      ...(departure.have_fourth_class ? [{
        id: `wagon-${apiRoute._id}-fourth`,
        type: 'fourth',
        name: 'Сидячий',
        price: departure.price_info?.fourth?.bottom_price || 0,
        availableSeats: departure.available_seats_info?.fourth || 0,
        topPrice: departure.price_info?.fourth?.top_price || 0,
        number: '4'
      }] : [])
    ].filter(wagon => wagon.price > 0)
  };
};

// ==================== API функции ====================

const trainApi = {
  // Флаг для использования моковых данных
  useMockData: process.env.NODE_ENV === 'development' || false,

  // Поиск городов (автодополнение)
  async searchCities(query) {
    try {
      console.log(`🔍 Поиск городов: "${query}"`);
      
      if (this.useMockData) {
        await delay(300); // Имитация задержки сети
        const filteredCities = MOCK_CITIES.filter(city => 
          city.name.toLowerCase().includes(query.toLowerCase())
        );
        return filteredCities;
      }

      const response = await api.get('/routes/cities', {
        params: { name: query }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка поиска городов:', error);
      
      // Возвращаем моковые данные при ошибке
      const filteredCities = MOCK_CITIES.filter(city => 
        city.name.toLowerCase().includes(query.toLowerCase())
      );
      return filteredCities;
    }
  },

  // Поиск маршрутов (поездов)
  async searchRoutes(params = {}) {
    try {
      console.log('🔍 Поиск маршрутов с параметрами:', params);
      
      if (this.useMockData) {
        await delay(500); // Имитация задержки сети
        
        // Фильтрация моковых данных по параметрам
        let filteredRoutes = [...MOCK_ROUTES.items];
        
        // Фильтрация по городам (если указаны)
        if (params.from_city_id) {
          filteredRoutes = filteredRoutes.filter(route => 
            route.departure.from.city._id === params.from_city_id
          );
        }
        
        if (params.to_city_id) {
          filteredRoutes = filteredRoutes.filter(route => 
            route.departure.to.city._id === params.to_city_id
          );
        }
        
        // Фильтрация по классам вагонов
        if (params.have_first_class) {
          filteredRoutes = filteredRoutes.filter(route => 
            route.departure.have_first_class
          );
        }
        
        if (params.have_second_class) {
          filteredRoutes = filteredRoutes.filter(route => 
            route.departure.have_second_class
          );
        }
        
        if (params.have_third_class) {
          filteredRoutes = filteredRoutes.filter(route => 
            route.departure.have_third_class
          );
        }
        
        if (params.have_fourth_class) {
          filteredRoutes = filteredRoutes.filter(route => 
            route.departure.have_fourth_class
          );
        }
        
        // Применяем лимит и оффсет
        const limit = params.limit || 6;
        const offset = params.offset || 0;
        const paginatedRoutes = filteredRoutes.slice(offset, offset + limit);
        
        return {
          ...MOCK_ROUTES,
          items: paginatedRoutes,
          total_count: filteredRoutes.length
        };
      }

      // Форматируем параметры для реального API
      const apiParams = {
        from_city_id: params.from_city_id,
        to_city_id: params.to_city_id,
        date_start: params.date_start || new Date().toISOString().split('T')[0],
        date_end: params.date_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        have_first_class: params.have_first_class || false,
        have_second_class: params.have_second_class || false,
        have_third_class: params.have_third_class || false,
        have_fourth_class: params.have_fourth_class || false,
        have_wifi: params.have_wifi || false,
        have_air_conditioning: params.have_air_conditioning || false,
        have_express: params.have_express || false,
        price_from: params.price_from || 0,
        price_to: params.price_to || 100000,
        limit: params.limit || 20,
        offset: params.offset || 0,
        sort: params.sort || 'date'
      };

      console.log('📋 Отправляемые параметры:', apiParams);
      
      const response = await api.get('/routes', { 
        params: apiParams,
        timeout: 10000
      });
      
      console.log('✅ Успешный ответ от API');
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка поиска маршрутов:', error);
      
      // При ошибке возвращаем моковые данные
      if (this.useMockData || process.env.NODE_ENV === 'development') {
        console.log('🔄 Используем моковые данные из-за ошибки');
        return {
          ...MOCK_ROUTES,
          items: MOCK_ROUTES.items.slice(0, params.limit || 6)
        };
      }
      
      throw error;
    }
  },

  // Получение деталей маршрута
  async getRouteDetails(routeId) {
    try {
      console.log(`🔍 Получение деталей маршрута: ${routeId}`);
      
      if (this.useMockData) {
        await delay(300);
        const route = MOCK_ROUTES.items.find(item => item._id === routeId);
        if (!route) {
          throw new Error(`Маршрут ${routeId} не найден`);
        }
        return route;
      }

      const response = await api.get(`/routes/${routeId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка получения деталей маршрута ${routeId}:`, error);
      
      // Возвращаем моковый маршрут при ошибке
      const route = MOCK_ROUTES.items.find(item => item._id === routeId);
      if (route) {
        console.log('🔄 Используем моковые данные маршрута');
        return route;
      }
      
      throw error;
    }
  },

  // Получение информации о местах в поезде
  async getRouteSeats(routeId, params = {}) {
    try {
      console.log(`🔍 Получение мест для маршрута: ${routeId}`, params);
      
      if (this.useMockData) {
        await delay(400);
        
        // Генерируем моковые места
        const seats = [];
        const wagonTypes = [];
        
        if (params.have_first_class) wagonTypes.push('first');
        if (params.have_second_class) wagonTypes.push('second');
        if (params.have_third_class) wagonTypes.push('third');
        if (params.have_fourth_class) wagonTypes.push('fourth');
        
        if (wagonTypes.length === 0) {
          wagonTypes.push('second'); // По умолчанию
        }
        
        wagonTypes.forEach((type, wagonIndex) => {
          const wagonNumber = wagonIndex + 1;
          const seatsInWagon = type === 'fourth' ? 60 : 36;
          
          for (let i = 1; i <= seatsInWagon; i++) {
            seats.push({
              coach_id: `wagon-${routeId}-${type}`,
              seat_number: i.toString(),
              is_available: Math.random() > 0.3, // 70% свободных мест
              price: type === 'first' ? 5500 : 
                     type === 'second' ? 2500 : 
                     type === 'third' ? 1800 : 1200
            });
          }
        });
        
        return {
          route_id: routeId,
          total_seats: seats.length,
          available_seats: seats.filter(s => s.is_available).length,
          seats: seats
        };
      }

      const apiParams = {
        have_first_class: params.have_first_class || false,
        have_second_class: params.have_second_class || false,
        have_third_class: params.have_third_class || false,
        have_fourth_class: params.have_fourth_class || false,
        have_wifi: params.have_wifi || false,
        have_air_conditioning: params.have_air_conditioning || false,
        have_express: params.have_express || false
      };

      const response = await api.get(`/routes/${routeId}/seats`, { params: apiParams });
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка получения мест маршрута ${routeId}:`, error);
      throw error;
    }
  },

  // Создание заказа (бронирование)
  async createOrder(orderData) {
    try {
      console.log('📝 Создание заказа:', orderData);
      
      if (this.useMockData) {
        await delay(800); // Имитация обработки заказа
        
        // Валидация данных
        if (!orderData.user || !orderData.departure || !orderData.departure.seats) {
          throw new Error('Недостаточно данных для создания заказа');
        }
        
        // Создаем уникальный ID заказа
        const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        return {
          ...MOCK_ORDER_RESPONSE,
          order: {
            ...MOCK_ORDER_RESPONSE.order,
            order_id: orderId,
            total: orderData.departure.seats.reduce((sum, seat) => sum + (seat.price || 2500), 0),
            created_at: new Date().toISOString()
          }
        };
      }

      const response = await api.post('/order', orderData);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка создания заказа:', error);
      
      // При ошибке возвращаем моковый ответ для продолжения тестирования
      if (this.useMockData || process.env.NODE_ENV === 'development') {
        console.log('🔄 Используем моковый ответ заказа');
        return {
          ...MOCK_ORDER_RESPONSE,
          order: {
            ...MOCK_ORDER_RESPONSE.order,
            order_id: `MOCK-ORDER-${Date.now()}`,
            total: orderData?.departure?.seats?.reduce((sum, seat) => sum + (seat.price || 2500), 0) || 2500
          }
        };
      }
      
      throw error;
    }
  },

  // Получение информации о заказе
  async getOrder(orderId) {
    try {
      console.log(`🔍 Получение информации о заказе: ${orderId}`);
      
      if (this.useMockData) {
        await delay(300);
        return {
          ...MOCK_ORDER_RESPONSE,
          order: {
            ...MOCK_ORDER_RESPONSE.order,
            order_id: orderId,
            status: 'confirmed',
            payment_status: 'paid'
          }
        };
      }

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
      
      if (this.useMockData) {
        await delay(300);
        return {
          result: 'success',
          message: 'Вы успешно подписались на рассылку'
        };
      }

      const response = await api.post('/subscribe', { email });
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка подписки:', error);
      throw error;
    }
  },

  // Вспомогательные функции для работы с данными
  formatRouteForUI,
  getMinPrice,

  // Тестовая функция для проверки подключения
  async testConnection() {
    try {
      console.log('🔗 Тестирование подключения к API...');
      
      const response = await api.get('/', { timeout: 5000 });
      console.log('✅ Подключение успешно:', response.status);
      return { success: true, status: response.status, data: response.data };
    } catch (error) {
      console.error('❌ Ошибка подключения:', error.message);
      return { 
        success: false, 
        error: error.message,
        status: error.response?.status,
        data: error.response?.data 
      };
    }
  },

  // Функция для получения списка всех городов
  async getAllCities() {
    try {
      if (this.useMockData) {
        await delay(200);
        return MOCK_CITIES;
      }

      const response = await api.get('/routes/cities/all');
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка получения списка городов:', error);
      return MOCK_CITIES; // Возвращаем моковые данные
    }
  }
};

export { trainApi };
export default api;