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
      return cities;
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
      
      const response = await api.get('/routes', { params: apiParams });
      
      console.log('✅ Ответ API получен, статус:', response.status);
      console.log('📦 Тело ответа (полностью):', JSON.stringify(response.data, null, 2));
      
      let routesData = response.data;
      
      if (routesData && Array.isArray(routesData.items)) {
        console.log(`📊 Формат: items массив, найдено: ${routesData.items.length}`);
        return routesData;
      } else if (routesData && Array.isArray(routesData.data)) {
        console.log(`📊 Формат: data массив, найдено: ${routesData.data.length}`);
        return {
          items: routesData.data,
          total_count: routesData.total_count || routesData.data.length
        };
      } else if (routesData && Array.isArray(routesData.results)) {
        console.log(`📊 Формат: results массив, найдено: ${routesData.results.length}`);
        return {
          items: routesData.results,
          total_count: routesData.total_count || routesData.results.length
        };
      } else if (Array.isArray(routesData)) {
        console.log(`📊 Формат: прямой массив, найдено: ${routesData.length}`);
        return {
          items: routesData,
          total_count: routesData.length
        };
      } else {
        console.warn('⚠️ Неизвестный формат ответа API:', typeof routesData, routesData);
        return { items: [], total_count: 0 };
      }
    } catch (error) {
      console.error('❌ Ошибка поиска маршрутов:', error);
      throw error;
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
      
      // Генерируем уникальную основу для ID
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
      
      const result = {
        id: baseId,
        number: train.number || train.name || apiRoute.train_number || 'Unknown',
        name: `${fromCity.name || 'Unknown'} → ${toCity.name || 'Unknown'}`,
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
      return Array.isArray(cities) ? cities : [];
    } catch (error) {
      console.error('❌ Ошибка получения городов:', error);
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