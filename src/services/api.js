import axios from 'axios';

const API_BASE_URL = 'https://students.netoservices.ru/fe-diplom';

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
      data: config.data,
      timestamp: new Date().toISOString()
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
      dataLength: JSON.stringify(response.data).length
    });
    
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ==================== API функции ====================

const trainApi = {
  // Флаг для принудительного использования моков (ВЫКЛЮЧЕН)
  useMockData: false,

  // Поиск городов (автодополнение)
  async searchCities(query) {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      console.log(`🔍 Поиск городов: "${query}"`);
      
      const response = await api.get('/routes/cities', {
        params: { 
          name: query,
          limit: 10
        }
      });
      
      let cities = response.data;
      
      // API может возвращать массив или объект
      if (cities && cities.items && Array.isArray(cities.items)) {
        cities = cities.items;
      } else if (!Array.isArray(cities)) {
        cities = [];
      }
      
      console.log(`✅ Найдено городов: ${cities.length}`);
      return cities;
    } catch (error) {
      console.error('❌ Ошибка поиска городов:', error);
      throw error;
    }
  },

  // Поиск маршрутов (поездов)
  async searchRoutes(params = {}) {
    try {
      console.log('🔍 Поиск маршрутов с параметрами:', params);
      
      // Проверяем обязательные параметры
      if (!params.from_city_id || !params.to_city_id) {
        throw new Error('Не указаны города отправления и прибытия');
      }
      
      // Форматируем даты
      const dateStart = params.date_start || new Date().toISOString().split('T')[0];
      const dateEnd = params.date_end || params.date_start || dateStart;
      
      // Подготавливаем параметры для API согласно документации
      const apiParams = {
        from_city_id: params.from_city_id,
        to_city_id: params.to_city_id,
        date_start: dateStart,
        date_end: dateEnd,
        limit: params.limit || 50,
        offset: params.offset || 0
      };
      
      // Добавляем фильтры по классам вагонов
      if (params.have_first_class) apiParams.have_first_class = true;
      if (params.have_second_class) apiParams.have_second_class = true;
      if (params.have_third_class) apiParams.have_third_class = true;
      if (params.have_fourth_class) apiParams.have_fourth_class = true;
      
      // Добавляем фильтры по услугам
      if (params.have_wifi) apiParams.have_wifi = true;
      if (params.have_air_conditioning) apiParams.have_air_conditioning = true;
      if (params.have_express) apiParams.have_express = true;
      
      // Добавляем ценовой диапазон
      if (params.price_from) apiParams.price_from = params.price_from;
      if (params.price_to) apiParams.price_to = params.price_to;
      
      // Добавляем сортировку
      if (params.sort) apiParams.sort = params.sort;
      
      console.log('📋 Отправляемые параметры:', apiParams);
      
      const response = await api.get('/routes', { params: apiParams });
      
      console.log('✅ Ответ API получен, статус:', response.status);
      
      // Проверяем структуру ответа
      let routesData = response.data;
      
      // API возвращает объект с полями total_count, offset, limit, items
      if (routesData && routesData.items && Array.isArray(routesData.items)) {
        console.log(`📊 Найдено маршрутов: ${routesData.items.length}, всего: ${routesData.total_count || routesData.items.length}`);
        return routesData;
      } 
      // Если API вернул массив
      else if (Array.isArray(routesData)) {
        console.log(`📊 Найдено маршрутов: ${routesData.length}`);
        return {
          items: routesData,
          total_count: routesData.length,
          offset: 0,
          limit: routesData.length
        };
      } 
      // Неизвестный формат
      else {
        console.warn('⚠️ Неожиданный формат ответа API:', routesData);
        return {
          items: [],
          total_count: 0,
          offset: 0,
          limit: 0
        };
      }
    } catch (error) {
      console.error('❌ Ошибка поиска маршрутов:', error);
      throw error;
    }
  },

  // Функция для форматирования маршрута из API в формат UI
  formatRouteForUI(apiRoute) {
    try {
      // Проверяем структуру - API может возвращать route в поле departure
      const route = apiRoute.departure || apiRoute;
      
      if (!route) {
        console.error('Некорректная структура маршрута:', apiRoute);
        return null;
      }
      
      // Получаем информацию о поезде
      const train = route.train || {};
      const from = route.from || {};
      const to = route.to || {};
      const fromCity = from.city || {};
      const toCity = to.city || {};
      
      // Получаем информацию о ценах и местах
      const priceInfo = route.price_info || {};
      const availableSeatsInfo = route.available_seats_info || {};
      
      // Формируем список вагонов
      const wagons = [];
      
      // Люкс (first class)
      if (route.have_first_class && priceInfo.first) {
        wagons.push({
          id: `wagon-${apiRoute._id || Date.now()}-first`,
          type: 'first',
          name: 'Люкс',
          apiType: 'first',
          price: priceInfo.first.bottom_price || priceInfo.first.price || 0,
          availableSeats: availableSeatsInfo.first || route.available_first_class || 0,
          topPrice: priceInfo.first.top_price || priceInfo.first.price * 1.2 || 0
        });
      }
      
      // Купе (second class)
      if (route.have_second_class && priceInfo.second) {
        wagons.push({
          id: `wagon-${apiRoute._id || Date.now()}-second`,
          type: 'second',
          name: 'Купе',
          apiType: 'second',
          price: priceInfo.second.bottom_price || priceInfo.second.price || 0,
          availableSeats: availableSeatsInfo.second || route.available_second_class || 0,
          topPrice: priceInfo.second.top_price || priceInfo.second.price * 1.2 || 0
        });
      }
      
      // Плацкарт (third class)
      if (route.have_third_class && priceInfo.third) {
        wagons.push({
          id: `wagon-${apiRoute._id || Date.now()}-third`,
          type: 'third',
          name: 'Плацкарт',
          apiType: 'third',
          price: priceInfo.third.bottom_price || priceInfo.third.price || 0,
          availableSeats: availableSeatsInfo.third || route.available_third_class || 0,
          topPrice: priceInfo.third.top_price || priceInfo.third.price * 1.2 || 0
        });
      }
      
      // Сидячий (fourth class)
      if (route.have_fourth_class && priceInfo.fourth) {
        wagons.push({
          id: `wagon-${apiRoute._id || Date.now()}-fourth`,
          type: 'fourth',
          name: 'Сидячий',
          apiType: 'fourth',
          price: priceInfo.fourth.bottom_price || priceInfo.fourth.price || 0,
          availableSeats: availableSeatsInfo.fourth || route.available_fourth_class || 0,
          topPrice: priceInfo.fourth.top_price || priceInfo.fourth.price * 1.2 || 0
        });
      }
      
      // Фильтруем вагоны с ценой > 0
      const validWagons = wagons.filter(w => w.price > 0);
      
      // Если нет вагонов с ценой, но есть информация о классах, создаем базовые вагоны
      if (validWagons.length === 0) {
        if (route.have_first_class) {
          validWagons.push({
            id: `wagon-${apiRoute._id || Date.now()}-first`,
            type: 'first',
            name: 'Люкс',
            apiType: 'first',
            price: 5000,
            availableSeats: 10,
            topPrice: 6000
          });
        }
        if (route.have_second_class) {
          validWagons.push({
            id: `wagon-${apiRoute._id || Date.now()}-second`,
            type: 'second',
            name: 'Купе',
            apiType: 'second',
            price: 2500,
            availableSeats: 20,
            topPrice: 3000
          });
        }
        if (route.have_third_class) {
          validWagons.push({
            id: `wagon-${apiRoute._id || Date.now()}-third`,
            type: 'third',
            name: 'Плацкарт',
            apiType: 'third',
            price: 1800,
            availableSeats: 30,
            topPrice: 2200
          });
        }
        if (route.have_fourth_class) {
          validWagons.push({
            id: `wagon-${apiRoute._id || Date.now()}-fourth`,
            type: 'fourth',
            name: 'Сидячий',
            apiType: 'fourth',
            price: 1200,
            availableSeats: 50,
            topPrice: 1500
          });
        }
      }
      
      // Вычисляем минимальную цену
      const minPrice = validWagons.length > 0 
        ? Math.min(...validWagons.map(w => w.price))
        : 0;
      
      // Парсим даты
      const departureDateTime = from.datetime ? new Date(from.datetime) : new Date();
      const arrivalDateTime = to.datetime ? new Date(to.datetime) : new Date();
      
      // Вычисляем длительность если ее нет
      let duration = route.duration;
      if (!duration && departureDateTime && arrivalDateTime) {
        duration = Math.floor((arrivalDateTime - departureDateTime) / (1000 * 60));
      }
      
      // Форматируем результат
      const formatted = {
        id: apiRoute._id || `route-${Date.now()}`,
        number: train.number || train.name || 'Unknown',
        name: `${fromCity.name || 'Unknown'} → ${toCity.name || 'Unknown'}`,
        fromCity: fromCity.name || 'Unknown',
        fromStation: from.railway_station_name || 'Unknown Station',
        toCity: toCity.name || 'Unknown',
        toStation: to.railway_station_name || 'Unknown Station',
        departureTime: departureDateTime.toISOString(),
        arrivalTime: arrivalDateTime.toISOString(),
        departureDate: departureDateTime.toLocaleDateString('ru-RU'),
        arrivalDate: arrivalDateTime.toLocaleDateString('ru-RU'),
        duration: duration || 0,
        minPrice: minPrice,
        wagons: validWagons,
        hasWifi: route.have_wifi || false,
        hasConditioner: route.have_air_conditioning || false,
        hasLinens: route.have_linens_included || false
      };
      
      return formatted;
    } catch (error) {
      console.error('❌ Ошибка форматирования маршрута:', error, apiRoute);
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
      
      const apiParams = {};
      
      if (params.have_first_class) apiParams.have_first_class = true;
      if (params.have_second_class) apiParams.have_second_class = true;
      if (params.have_third_class) apiParams.have_third_class = true;
      if (params.have_fourth_class) apiParams.have_fourth_class = true;
      if (params.have_wifi) apiParams.have_wifi = true;
      if (params.have_air_conditioning) apiParams.have_air_conditioning = true;
      if (params.have_express) apiParams.have_express = true;
      
      const response = await api.get(`/routes/${routeId}/seats`, { params: apiParams });
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
      console.log('🔍 Получение списка всех городов');
      const response = await api.get('/routes/cities');
      
      let cities = response.data;
      if (cities && cities.items && Array.isArray(cities.items)) {
        cities = cities.items;
      } else if (!Array.isArray(cities)) {
        cities = [];
      }
      
      return cities;
    } catch (error) {
      console.error('❌ Ошибка получения городов:', error);
      throw error;
    }
  },

  // Поиск станций
  async searchStations(query) {
    try {
      if (!query || query.length < 2) {
        return [];
      }
      
      console.log(`🔍 Поиск станций: "${query}"`);
      const response = await api.get('/routes/stations', {
        params: { name: query }
      });
      
      return response.data || [];
    } catch (error) {
      console.error('❌ Ошибка поиска станций:', error);
      return [];
    }
  },

  // Тест подключения к API
  async testConnection() {
    try {
      console.log('🔗 Тестирование подключения к API...');
      const response = await api.get('/routes/cities', { 
        params: { name: 'Москва' },
        timeout: 10000 
      });
      console.log('✅ API работает, статус:', response.status);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ API не работает:', error.message);
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