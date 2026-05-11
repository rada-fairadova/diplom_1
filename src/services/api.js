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
      
      if (cities && cities.items && Array.isArray(cities.items)) {
        cities = cities.items;
      } else if (!Array.isArray(cities)) {
        cities = [];
      }
      
      console.log(`✅ Найдено городов: ${cities.length}`);
      return cities;
    } catch (error) {
      console.error('❌ Ошибка поиска городов:', error);
      // Возвращаем моковые данные при ошибке
      return [
        { _id: '1', id: '1', name: 'Москва' },
        { _id: '2', id: '2', name: 'Санкт-Петербург' },
        { _id: '3', id: '3', name: 'Казань' },
        { _id: '4', id: '4', name: 'Сочи' },
        { _id: '5', id: '5', name: 'Екатеринбург' },
      ];
    }
  },

  // Поиск маршрутов (поездов)
  async searchRoutes(params = {}) {
    try {
      console.log('🔍 Поиск маршрутов с параметрами:', params);
      
      if (!params.from_city_id || !params.to_city_id) {
        console.warn('⚠️ Не указаны города отправления и прибытия');
        return this.getMockRoutesResponse();
      }
      
      const dateStart = params.date_start || new Date().toISOString().split('T')[0];
      const dateEnd = params.date_end || params.date_start || dateStart;
      
      const apiParams = {
        from_city_id: params.from_city_id,
        to_city_id: params.to_city_id,
        date_start: dateStart,
        date_end: dateEnd,
        limit: params.limit || 50,
        offset: params.offset || 0
      };
      
      if (params.have_first_class) apiParams.have_first_class = true;
      if (params.have_second_class) apiParams.have_second_class = true;
      if (params.have_third_class) apiParams.have_third_class = true;
      if (params.have_fourth_class) apiParams.have_fourth_class = true;
      if (params.have_wifi) apiParams.have_wifi = true;
      if (params.have_air_conditioning) apiParams.have_air_conditioning = true;
      if (params.have_express) apiParams.have_express = true;
      if (params.price_from) apiParams.price_from = params.price_from;
      if (params.price_to) apiParams.price_to = params.price_to;
      if (params.sort) apiParams.sort = params.sort;
      
      console.log('📋 Отправляемые параметры:', apiParams);
      
      const response = await api.get('/routes', { params: apiParams });
      
      console.log('✅ Ответ API получен, статус:', response.status);
      
      let routesData = response.data;
      
      if (routesData && routesData.items && Array.isArray(routesData.items)) {
        console.log(`📊 Найдено маршрутов: ${routesData.items.length}`);
        return routesData;
      } else if (Array.isArray(routesData)) {
        console.log(`📊 Найдено маршрутов: ${routesData.length}`);
        return {
          items: routesData,
          total_count: routesData.length,
          offset: 0,
          limit: routesData.length
        };
      } else {
        console.warn('⚠️ Неожиданный формат ответа API, возвращаем мок');
        return this.getMockRoutesResponse();
      }
    } catch (error) {
      console.error('❌ Ошибка поиска маршрутов:', error);
      return this.getMockRoutesResponse();
    }
  },

  // Вспомогательный метод для моковых маршрутов
  getMockRoutesResponse() {
    return {
      items: [
        {
          _id: 'route-mock-001',
          departure: {
            train: { number: '116C', name: 'Сапсан' },
            from: {
              city: { name: 'Москва' },
              railway_station_name: 'Ленинградский вокзал',
              datetime: new Date(2026, 4, 5, 8, 0).toISOString()
            },
            to: {
              city: { name: 'Санкт-Петербург' },
              railway_station_name: 'Московский вокзал',
              datetime: new Date(2026, 4, 5, 13, 30).toISOString()
            },
            duration: 330,
            have_first_class: false,
            have_second_class: true,
            have_third_class: true,
            have_fourth_class: false,
            have_wifi: true,
            have_air_conditioning: true,
            have_linens_included: false,
            price_info: {
              second: { bottom_price: 3200, top_price: 3500 },
              third: { bottom_price: 2100, top_price: 2400 }
            },
            available_seats_info: {
              second: 15,
              third: 8
            }
          }
        },
        {
          _id: 'route-mock-002',
          departure: {
            train: { number: '044A', name: 'Невский экспресс' },
            from: {
              city: { name: 'Москва' },
              railway_station_name: 'Курский вокзал',
              datetime: new Date(2026, 4, 5, 10, 30).toISOString()
            },
            to: {
              city: { name: 'Санкт-Петербург' },
              railway_station_name: 'Ладожский вокзал',
              datetime: new Date(2026, 4, 5, 16, 45).toISOString()
            },
            duration: 375,
            have_first_class: false,
            have_second_class: false,
            have_third_class: true,
            have_fourth_class: true,
            have_wifi: false,
            have_air_conditioning: true,
            have_linens_included: true,
            price_info: {
              third: { bottom_price: 2300, top_price: 2600 },
              fourth: { bottom_price: 1900, top_price: 2200 }
            },
            available_seats_info: {
              third: 12,
              fourth: 25
            }
          }
        },
        {
          _id: 'route-mock-003',
          departure: {
            train: { number: '720A', name: 'Татарстан' },
            from: {
              city: { name: 'Москва' },
              railway_station_name: 'Казанский вокзал',
              datetime: new Date(2026, 4, 5, 22, 15).toISOString()
            },
            to: {
              city: { name: 'Казань' },
              railway_station_name: 'Главный вокзал',
              datetime: new Date(2026, 4, 6, 9, 45).toISOString()
            },
            duration: 690,
            have_first_class: true,
            have_second_class: true,
            have_third_class: false,
            have_fourth_class: false,
            have_wifi: true,
            have_air_conditioning: true,
            have_linens_included: true,
            price_info: {
              first: { bottom_price: 8500, top_price: 9200 },
              second: { bottom_price: 4800, top_price: 5200 }
            },
            available_seats_info: {
              first: 3,
              second: 7
            }
          }
        }
      ],
      total_count: 3,
      offset: 0,
      limit: 3
    };
  },

  // Форматирование маршрута из API в формат UI
  formatRouteForUI(apiRoute) {
    try {
      const route = apiRoute.departure || apiRoute;
      
      if (!route) {
        console.error('Некорректная структура маршрута:', apiRoute);
        return null;
      }
      
      const train = route.train || {};
      const from = route.from || {};
      const to = route.to || {};
      const fromCity = from.city || {};
      const toCity = to.city || {};
      
      const priceInfo = route.price_info || {};
      const availableSeatsInfo = route.available_seats_info || {};
      
      const wagons = [];
      
      // Люкс (first class)
      if (route.have_first_class) {
        const price = priceInfo.first?.bottom_price || priceInfo.first?.price || 5000;
        wagons.push({
          id: `${apiRoute._id || Date.now()}-first-${Math.random().toString(36).substr(2, 5)}`,
          type: 'lux',
          name: 'Люкс',
          apiType: 'first',
          price: price,
          availableSeats: availableSeatsInfo.first || route.available_first_class || 10,
          topPrice: priceInfo.first?.top_price || price * 1.2
        });
      }
      
      // Купе (second class)
      if (route.have_second_class) {
        const price = priceInfo.second?.bottom_price || priceInfo.second?.price || 2500;
        wagons.push({
          id: `${apiRoute._id || Date.now()}-second-${Math.random().toString(36).substr(2, 5)}`,
          type: 'coupe',
          name: 'Купе',
          apiType: 'second',
          price: price,
          availableSeats: availableSeatsInfo.second || route.available_second_class || 20,
          topPrice: priceInfo.second?.top_price || price * 1.2
        });
      }
      
      // Плацкарт (third class)
      if (route.have_third_class) {
        const price = priceInfo.third?.bottom_price || priceInfo.third?.price || 1800;
        wagons.push({
          id: `${apiRoute._id || Date.now()}-third-${Math.random().toString(36).substr(2, 5)}`,
          type: 'platzkart',
          name: 'Плацкарт',
          apiType: 'third',
          price: price,
          availableSeats: availableSeatsInfo.third || route.available_third_class || 30,
          topPrice: priceInfo.third?.top_price || price * 1.2
        });
      }
      
      // Сидячий (fourth class)
      if (route.have_fourth_class) {
        const price = priceInfo.fourth?.bottom_price || priceInfo.fourth?.price || 1200;
        wagons.push({
          id: `${apiRoute._id || Date.now()}-fourth-${Math.random().toString(36).substr(2, 5)}`,
          type: 'sitting',
          name: 'Сидячий',
          apiType: 'fourth',
          price: price,
          availableSeats: availableSeatsInfo.fourth || route.available_fourth_class || 50,
          topPrice: priceInfo.fourth?.top_price || price * 1.2
        });
      }
      
      // Если нет вагонов, добавляем резервные
      if (wagons.length === 0) {
        if (route.have_first_class) {
          wagons.push({
            id: `${apiRoute._id || Date.now()}-first-${Math.random().toString(36).substr(2, 5)}`,
            type: 'lux', name: 'Люкс', apiType: 'first',
            price: 5000, availableSeats: 10, topPrice: 6000
          });
        }
        if (route.have_second_class) {
          wagons.push({
            id: `${apiRoute._id || Date.now()}-second-${Math.random().toString(36).substr(2, 5)}`,
            type: 'coupe', name: 'Купе', apiType: 'second',
            price: 2500, availableSeats: 20, topPrice: 3000
          });
        }
        if (route.have_third_class) {
          wagons.push({
            id: `${apiRoute._id || Date.now()}-third-${Math.random().toString(36).substr(2, 5)}`,
            type: 'platzkart', name: 'Плацкарт', apiType: 'third',
            price: 1800, availableSeats: 30, topPrice: 2200
          });
        }
        if (route.have_fourth_class) {
          wagons.push({
            id: `${apiRoute._id || Date.now()}-fourth-${Math.random().toString(36).substr(2, 5)}`,
            type: 'sitting', name: 'Сидячий', apiType: 'fourth',
            price: 1200, availableSeats: 50, topPrice: 1500
          });
        }
      }
      
      const minPrice = wagons.length > 0 
        ? Math.min(...wagons.map(w => w.price))
        : 0;
      
      const departureDateTime = from.datetime ? new Date(from.datetime) : new Date();
      const arrivalDateTime = to.datetime ? new Date(to.datetime) : new Date();
      
      let duration = route.duration;
      if (!duration && departureDateTime && arrivalDateTime) {
        duration = Math.floor((arrivalDateTime - departureDateTime) / (1000 * 60));
      }
      
      return {
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
        wagons: wagons,
        hasWifi: route.have_wifi || false,
        hasConditioner: route.have_air_conditioning || false,
        hasLinens: route.have_linens_included || false
      };
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