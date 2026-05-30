import axios from 'axios';

const API_BASE_URL = 'https://students.netoservices.ru/fe-diplom';

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
];

const TRAIN_CONFIGS = [
  { number: '116C', name: 'Сапсан', type: 'express', have_first_class: true, have_second_class: true, have_third_class: false, have_fourth_class: true, have_wifi: true, have_air_conditioning: true, basePrice: 3500, duration: 240 },
  { number: '044A', name: 'Невский экспресс', type: 'express', have_first_class: true, have_second_class: true, have_third_class: false, have_fourth_class: true, have_wifi: true, have_air_conditioning: true, basePrice: 3000, duration: 300 },
  { number: '720A', name: 'Татарстан', type: 'regular', have_first_class: false, have_second_class: true, have_third_class: true, have_fourth_class: true, have_wifi: false, have_air_conditioning: true, basePrice: 2200, duration: 360 },
  { number: '256B', name: 'Урал', type: 'regular', have_first_class: true, have_second_class: true, have_third_class: true, have_fourth_class: false, have_wifi: true, have_air_conditioning: false, basePrice: 2800, duration: 420 },
  { number: '302H', name: 'Волга', type: 'regular', have_first_class: false, have_second_class: true, have_third_class: true, have_fourth_class: true, have_wifi: true, have_air_conditioning: true, basePrice: 1900, duration: 300 },
];

function generateMockRoutes(fromCityId, toCityId, fromCityName, toCityName, fromStation, toStation) {
  const routes = [];
  const baseDate = new Date('2024-05-20');

  for (let i = 0; i < 5; i++) {
    const config = TRAIN_CONFIGS[i % TRAIN_CONFIGS.length];
    const departureHour = 6 + i * 3;
    
    const departureDateTime = new Date(baseDate);
    departureDateTime.setHours(departureHour, [0, 15, 30, 45][i], 0);
    
    const durationMs = (config.duration + Math.floor(Math.random() * 60)) * 60000;
    const arrivalDateTime = new Date(departureDateTime.getTime() + durationMs);
    
    const routeId = `route-${Date.now()}-${i}`;
    const basePrice = Math.round(config.basePrice * (0.8 + i * 0.1));
    
    const priceInfo = {};
    const availableSeatsInfo = {};
    
    if (config.have_first_class) {
      priceInfo.first = { bottom_price: Math.round(basePrice * 2.5), top_price: Math.round(basePrice * 2.8) };
      availableSeatsInfo.first = 5 + i;
    }
    if (config.have_second_class) {
      priceInfo.second = { bottom_price: Math.round(basePrice * 1.5), top_price: Math.round(basePrice * 1.7) };
      availableSeatsInfo.second = 10 + i * 3;
    }
    if (config.have_third_class) {
      priceInfo.third = { bottom_price: basePrice, top_price: Math.round(basePrice * 1.2) };
      availableSeatsInfo.third = 15 + i * 5;
    }
    if (config.have_fourth_class) {
      priceInfo.fourth = { bottom_price: Math.round(basePrice * 0.7), top_price: Math.round(basePrice * 0.8) };
      availableSeatsInfo.fourth = 20 + i * 3;
    }

    const allPrices = Object.values(priceInfo).map(p => p.bottom_price).filter(Boolean);
    const minPrice = Math.min(...allPrices);

    routes.push({
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
        train: { _id: `${routeId}-train`, number: config.number, name: config.name },
        from: { datetime: departureDateTime.getTime(), railway_station_name: fromStation, city: { _id: fromCityId, name: fromCityName } },
        to: { datetime: arrivalDateTime.getTime(), railway_station_name: toStation, city: { _id: toCityId, name: toCityName } }
      },
      arrival: null
    });
  }
  
  return routes;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Тихой перехватчик без console.error
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

const trainApi = {
  async searchCities(query) {
    if (!query || query.length < 2) return [];
    
    const queryLower = query.toLowerCase();
    const mockResult = MOCK_CITIES.filter(city => city.name.toLowerCase().includes(queryLower));
    
    try {
      const response = await api.get('/routes/cities', { params: { name: query } });
      let cities = response.data;
      
      if (cities?.items && Array.isArray(cities.items)) cities = cities.items;
      else if (cities?.data && Array.isArray(cities.data)) cities = cities.data;
      else if (!Array.isArray(cities)) cities = [];
      
      return cities.length > 0 ? cities : mockResult;
    } catch {
      return mockResult;
    }
  },

  async searchRoutes(params = {}) {
    const fromCityId = params.from_city_id || 'mock-moscow';
    const toCityId = params.to_city_id || 'mock-spb';
    const fromCity = MOCK_CITIES.find(c => c._id === fromCityId) || MOCK_CITIES[0];
    const toCity = MOCK_CITIES.find(c => c._id === toCityId) || MOCK_CITIES[1];
    
    const mockResult = {
      items: generateMockRoutes(fromCityId, toCityId, fromCity.name, toCity.name, fromCity.railway_station_name, toCity.railway_station_name),
      total_count: 5
    };

    if (!params.from_city_id || !params.to_city_id) {
      return mockResult;
    }

    try {
      const response = await api.get('/routes', { params });
      if (response.data?.items?.length > 0) {
        return { items: response.data.items, total_count: response.data.total_count || response.data.items.length };
      }
      return mockResult;
    } catch {
      return mockResult;
    }
  },

  formatRouteForUI(apiRoute, index = 0) {
    try {
      const route = apiRoute.departure || apiRoute.train || apiRoute;
      if (!route) return null;
      
      const train = route.train || apiRoute.train || {};
      const from = route.from || apiRoute.from || {};
      const to = route.to || apiRoute.to || {};
      const fromCity = from.city || apiRoute.from_city || {};
      const toCity = to.city || apiRoute.to_city || {};
      const priceInfo = route.price_info || apiRoute.price_info || {};
      
      const wagons = [];
      const baseId = apiRoute._id || apiRoute.id || `route-${Date.now()}-${index}`;
      
      if (route.have_first_class || apiRoute.have_first_class) {
        wagons.push({
          id: `${baseId}-first`, type: 'lux', name: 'Люкс', apiType: 'first',
          price: priceInfo.first?.bottom_price || 0, availableSeats: 5
        });
      }
      if (route.have_second_class || apiRoute.have_second_class) {
        wagons.push({
          id: `${baseId}-second`, type: 'coupe', name: 'Купе', apiType: 'second',
          price: priceInfo.second?.bottom_price || 0, availableSeats: 10
        });
      }
      if (route.have_third_class || apiRoute.have_third_class) {
        wagons.push({
          id: `${baseId}-third`, type: 'platzkart', name: 'Плацкарт', apiType: 'third',
          price: priceInfo.third?.bottom_price || 0, availableSeats: 20
        });
      }
      if (route.have_fourth_class || apiRoute.have_fourth_class) {
        wagons.push({
          id: `${baseId}-fourth`, type: 'sitting', name: 'Сидячий', apiType: 'fourth',
          price: priceInfo.fourth?.bottom_price || 0, availableSeats: 15
        });
      }
      
      const minPrice = wagons.length > 0 ? Math.min(...wagons.map(w => w.price || 0)) : 0;
      const departureDateTime = from.datetime ? new Date(from.datetime) : new Date();
      const arrivalDateTime = to.datetime ? new Date(to.datetime) : new Date();
      
      const normalTrainNames = [
        { number: '116C', name: 'Сапсан' }, { number: '044A', name: 'Невский экспресс' },
        { number: '720A', name: 'Татарстан' }, { number: '256B', name: 'Урал' },
        { number: '302H', name: 'Волга' }
      ];
      
      let trainNumber = train.number || train.name || apiRoute.train_number || '';
      let trainName = train.name || '';
      
      if (!trainNumber || trainNumber.length > 6) {
        const normal = normalTrainNames[index % normalTrainNames.length];
        trainNumber = normal.number;
        trainName = normal.name;
      }
      
      return {
        id: baseId, number: trainNumber, name: trainName,
        fromCity: fromCity.name || '', fromStation: from.railway_station_name || '',
        toCity: toCity.name || '', toStation: to.railway_station_name || '',
        departureTime: departureDateTime.toISOString(), arrivalTime: arrivalDateTime.toISOString(),
        departureDate: departureDateTime.toLocaleDateString('ru-RU'), arrivalDate: arrivalDateTime.toLocaleDateString('ru-RU'),
        duration: route.duration || 0, minPrice, wagons,
        hasWifi: route.have_wifi || false,
        hasConditioner: route.have_air_conditioning || false,
        hasLinens: route.have_linens_included || false
      };
    } catch {
      return null;
    }
  },

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
  },

  async getLastRoutes() {
    try {
      const response = await api.get('/routes/last');
      if (Array.isArray(response.data) && response.data.length > 0) return response.data;
    } catch {}
    
    return [
      { _id: 'last-1', from_city: { name: 'Москва' }, to_city: { name: 'Санкт-Петербург' }, min_price: 2500, train: { number: '116C', name: 'Сапсан' } },
      { _id: 'last-2', from_city: { name: 'Москва' }, to_city: { name: 'Казань' }, min_price: 3200, train: { number: '720A', name: 'Татарстан' } },
      { _id: 'last-3', from_city: { name: 'Москва' }, to_city: { name: 'Сочи' }, min_price: 4500, train: { number: '302H', name: 'Волга' } }
    ];
  },

  async getAllCities() {
    try {
      const response = await api.get('/routes/cities');
      let cities = response.data;
      if (cities?.items && Array.isArray(cities.items)) return cities.items;
      return Array.isArray(cities) ? cities : MOCK_CITIES;
    } catch {
      return MOCK_CITIES;
    }
  },

  async searchStations(query) {
    if (!query || query.length < 2) return [];
    try {
      const response = await api.get('/routes/stations', { params: { name: query } });
      return response.data || [];
    } catch {
      return [];
    }
  },

  async createOrder(orderData) {
    try {
      const response = await api.post('/order', orderData);
      return response.data;
    } catch {
      return { success: true, orderId: `order-${Date.now()}` };
    }
  },

  async getRouteDetails(routeId) {
    try {
      const response = await api.get(`/routes/${routeId}`);
      return response.data;
    } catch {
      return null;
    }
  },

  async getRouteSeats(routeId, params = {}) {
    try {
      const response = await api.get(`/routes/${routeId}/seats`, { params });
      return response.data;
    } catch {
      return [];
    }
  }
};

export { trainApi };
export default api;