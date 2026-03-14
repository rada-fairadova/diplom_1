import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const TicketContext = createContext();

export const useTicket = () => {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTicket must be used within a TicketProvider');
  }
  return context;
};

export const TicketProvider = ({ children }) => {
  // Состояние поиска
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    departureDate: '',
    passengers: {
      adults: 1,
      children: 0,
      infants: 0
    }
  });

  // Состояние билета
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [selectedWagon, setSelectedWagon] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengers, setPassengers] = useState([]);
  
  // Состояние заказа
  const [orderDetails, setOrderDetails] = useState(null);
  
  // Данные карты для оплаты
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    holder: ''
  });

  // Функция для обновления параметров поиска
  const updateSearchParams = useCallback((newParams) => {
    setSearchParams(prev => ({
      ...prev,
      ...newParams
    }));
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

  // Функция для создания заказа
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
    // Не сбрасываем searchParams, чтобы сохранить историю поиска
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
