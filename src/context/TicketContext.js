import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

const TicketContext = createContext();

export const useTicket = () => {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTicket must be used within a TicketProvider');
  }
  return context;
};

export const TicketProvider = ({ children }) => {
  // Состояние поиска с восстановлением из localStorage
  const [searchParams, setSearchParams] = useState(() => {
    const saved = localStorage.getItem('ticketSearchParams');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log('🔄 Восстановлены параметры поиска из localStorage:', parsed);
        return parsed;
      } catch (e) {
        console.error('Ошибка парсинга сохраненных параметров поиска');
      }
    }
    return {
      from: '',
      to: '',
      departureDate: '',
      passengers: {
        adults: 1,
        children: 0,
        infants: 0
      }
    };
  });

  // Состояние билета с восстановлением из localStorage
  const [selectedTrain, setSelectedTrain] = useState(() => {
    const saved = localStorage.getItem('selectedTrain');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log('🔄 Восстановлен выбранный поезд из localStorage');
        return parsed;
      } catch (e) {
        console.error('Ошибка парсинга сохраненного поезда');
      }
    }
    return null;
  });

  const [selectedWagon, setSelectedWagon] = useState(() => {
    const saved = localStorage.getItem('selectedWagon');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log('🔄 Восстановлен выбранный вагон из localStorage');
        return parsed;
      } catch (e) {
        console.error('Ошибка парсинга сохраненного вагона');
      }
    }
    return null;
  });

  const [selectedSeats, setSelectedSeats] = useState(() => {
    const saved = localStorage.getItem('selectedSeats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log('🔄 Восстановлены выбранные места из localStorage');
        return parsed;
      } catch (e) {
        console.error('Ошибка парсинга сохраненных мест');
      }
    }
    return [];
  });

  const [passengers, setPassengers] = useState([]);
  const [orderDetails, setOrderDetails] = useState(null);
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    holder: ''
  });

  // Сохранение параметров поиска
  useEffect(() => {
    if (searchParams.from || searchParams.to) {
      localStorage.setItem('ticketSearchParams', JSON.stringify(searchParams));
      console.log('💾 Сохранены параметры поиска:', searchParams);
    }
  }, [searchParams]);

  // Сохранение выбранного поезда
  useEffect(() => {
    if (selectedTrain) {
      localStorage.setItem('selectedTrain', JSON.stringify(selectedTrain));
      console.log('💾 Сохранен выбранный поезд');
    }
  }, [selectedTrain]);

  // Сохранение выбранного вагона
  useEffect(() => {
    if (selectedWagon) {
      localStorage.setItem('selectedWagon', JSON.stringify(selectedWagon));
      console.log('💾 Сохранен выбранный вагон');
    }
  }, [selectedWagon]);

  // Сохранение выбранных мест
  useEffect(() => {
    if (selectedSeats && selectedSeats.length > 0) {
      localStorage.setItem('selectedSeats', JSON.stringify(selectedSeats));
      console.log('💾 Сохранены выбранные места:', selectedSeats);
    }
  }, [selectedSeats]);

  // Функция для обновления параметров поиска
  const updateSearchParams = useCallback((newParams) => {
    setSearchParams(prev => {
      const updated = { ...prev, ...newParams };
      return updated;
    });
  }, []);

  const addPassenger = useCallback((passenger) => {
    setPassengers(prev => [...prev, passenger]);
  }, []);

  const updatePassenger = useCallback((index, updatedPassenger) => {
    setPassengers(prev => {
      const updated = [...prev];
      updated[index] = updatedPassenger;
      return updated;
    });
  }, []);

  const removePassenger = useCallback((index) => {
    setPassengers(prev => prev.filter((_, i) => i !== index));
  }, []);

  const setOrder = useCallback((order) => {
    setOrderDetails(order);
  }, []);

  const total = useMemo(() => {
    if (!selectedWagon) return 0;
    const adultPrice = selectedWagon.price;
    const adultCount = passengers.filter(p => p.type === 'adult').length;
    const childCount = passengers.filter(p => p.type === 'child').length;
    const childPrice = Math.round(adultPrice * 0.6);
    
    return (adultCount * adultPrice) + (childCount * childPrice);
  }, [selectedWagon, passengers]);

  const resetTicket = useCallback(() => {
    setSelectedTrain(null);
    setSelectedWagon(null);
    setSelectedSeats([]);
    setPassengers([]);
    setOrderDetails(null);
    setCardData({
      number: '',
      expiry: '',
      cvv: '',
      holder: ''
    });
    
    // Очищаем localStorage
    localStorage.removeItem('selectedTrain');
    localStorage.removeItem('selectedWagon');
    localStorage.removeItem('selectedSeats');
    localStorage.removeItem('selectedWagonType');
    localStorage.removeItem('bookingData');
    
    console.log('🔄 Все данные билета сброшены');
  }, []);

  const value = {
    // Поиск
    searchParams,
    updateSearchParams,
    
    // Состояние билета
    selectedTrain,
    selectedWagon,
    selectedSeats,
    passengers,
    total,
    
    // Состояние заказа
    orderDetails,
    
    // Данные карты
    cardData,
    setCardData,
    
    // Сеттеры
    setSelectedTrain,
    setSelectedWagon,
    setSelectedSeats,
    
    // Методы для работы с пассажирами
    addPassenger,
    updatePassenger,
    removePassenger,
    
    // Метод для создания заказа
    setOrder,
    
    // Вспомогательные методы
    resetTicket
  };

  return (
    <TicketContext.Provider value={value}>
      {children}
    </TicketContext.Provider>
  );
};
