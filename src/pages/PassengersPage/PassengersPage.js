import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTicket } from '../../context/TicketContext';
import OrderSteps from '../../components/OrderSteps/OrderSteps';
import PassengerForm from '../../components/PassengerForm/PassengerForm';
import './PassengersPage.css';

function PassengersPage() {
  const navigate = useNavigate();
  const { 
    selectedTrain,
    selectedWagon,
    selectedSeats,
    passengers,
    addPassenger,
    updatePassenger,
    removePassenger
  } = useTicket();

  const [currentPassengerIndex, setCurrentPassengerIndex] = useState(0);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [seatPrices, setSeatPrices] = useState({});
  const [localTotal, setLocalTotal] = useState(0);

  // Инициализация пассажиров по количеству выбранных мест
  useEffect(() => {
    if (selectedSeats.length > 0 && passengers.length === 0) {
      const newPassengers = selectedSeats.map((seat, index) => ({
        id: `passenger-${Date.now()}-${index}`,
        type: 'adult',
        seatNumber: seat,
        lastName: '',
        firstName: '',
        middleName: '',
        gender: 'male',
        birthDate: '',
        documentType: 'passport',
        documentSeries: '',
        documentNumber: '',
        phone: '',
        email: '',
        limitedMobility: false,
        includeBedding: true,
        foodPreference: 'none'
      }));
      
      newPassengers.forEach(passenger => {
        addPassenger(passenger);
      });
    }
  }, [selectedSeats.length, passengers.length, addPassenger, selectedSeats]);

  // Расчет общей стоимости
  useEffect(() => {
    const calculateTotalPrice = () => {
      if (!selectedWagon || !selectedTrain || selectedSeats.length === 0 || passengers.length === 0) {
        setLocalTotal(0);
        return;
      }

      try {
        const basePrice = selectedWagon.price || 2000;
        let calculatedTotal = 0;
        const prices = {};
        
        passengers.forEach(passenger => {
          const passengerPrice = passenger.type === 'child' ? 
            Math.round(basePrice * 0.6) : 
            basePrice;
          
          prices[passenger.seatNumber] = passengerPrice;
          calculatedTotal += passengerPrice;
        });
        
        setSeatPrices(prices);
        setLocalTotal(calculatedTotal);
      } catch (error) {
        console.error('Ошибка при расчете стоимости:', error);
        setLocalTotal(0);
      }
    };

    calculateTotalPrice();
  }, [selectedWagon, selectedTrain, selectedSeats, passengers]);

  const validatePassenger = (passenger) => {
    const errors = {};
    
    // Проверка ФИО
    if (!passenger.lastName || !passenger.lastName.trim()) {
      errors.lastName = 'Введите фамилию';
    }
    
    if (!passenger.firstName || !passenger.firstName.trim()) {
      errors.firstName = 'Введите имя';
    }
    
    // Проверка даты рождения
    if (!passenger.birthDate || !passenger.birthDate.trim()) {
      errors.birthDate = 'Введите дату рождения';
    } else {
      try {
        const birthDate = new Date(passenger.birthDate);
        
        if (isNaN(birthDate.getTime())) {
          errors.birthDate = 'Некорректная дата';
        } else {
          const today = new Date();
          const birthYear = birthDate.getFullYear();
          
          // Вычисляем точный возраст
          let age = today.getFullYear() - birthYear;
          const monthDiff = today.getMonth() - birthDate.getMonth();
          const dayDiff = today.getDate() - birthDate.getDate();
          
          if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            age--;
          }
          
          // Проверка на будущую дату
          if (birthDate > today) {
            errors.birthDate = 'Дата рождения не может быть в будущем';
          }
          
          // Проверка года рождения 
          else if (birthYear >= 1990) {
            errors.birthDate = 'Год рождения должен быть позже 1990';
          }
          
          // Проверка возрастных ограничений по типу билета
          else if (passenger.type === 'child') {
            if (age >= 10) {
              errors.birthDate = 'Для детского билета возраст должен быть меньше 10 лет';
            }
          } else if (passenger.type === 'adult') {
            if (age < 10) {
              errors.birthDate = 'Для взрослого билета возраст должен быть от 10 лет';
            }
          }
        }
      } catch (error) {
        console.error('Ошибка при проверке даты рождения:', error);
        errors.birthDate = 'Некорректная дата';
      }
    }
    
    // Проверка паспортных данных
    if (passenger.documentType === 'passport') {
      const series = passenger.documentSeries ? passenger.documentSeries.toString().trim() : '';
      const number = passenger.documentNumber ? passenger.documentNumber.toString().trim() : '';
      
      if (!series || !/^\d{4}$/.test(series)) {
        errors.documentSeries = 'Серия паспорта должна содержать 4 цифры';
      }
      
      if (!number || !/^\d{6}$/.test(number)) {
        errors.documentNumber = 'Номер паспорта должен содержать 6 цифр';
      }
    }
    
    if (passenger.documentType === 'birthCertificate') {
      const certificateNumber = passenger.documentNumber ? passenger.documentNumber.toString().trim() : '';
      
      if (!certificateNumber || !/^[IVXLCDM]+-[А-Я]{2}-\d{6}$/i.test(certificateNumber)) {
        errors.documentNumber = 'Формат: Римские цифры-Две буквы-Шесть цифр (например: VIII-ЫП-123456)';
      }
    }
    
    // Проверка контактных данных
    if (passenger.phone && passenger.phone.trim()) {
      const phone = passenger.phone.trim();
      if (!/^\+7\d{10}$/.test(phone)) {
        errors.phone = 'Формат: +7XXXXXXXXXX';
      }
    }
    
    if (passenger.email && passenger.email.trim()) {
      const email = passenger.email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'Введите корректный email адрес';
      }
    }
    
    return errors;
  };

  const handleSavePassenger = async (passengerData) => {
    const validationErrors = validatePassenger(passengerData);
    
    if (Object.keys(validationErrors).length === 0) {
      try {
        if (currentPassengerIndex < passengers.length) {
          const updatedPassenger = {
            ...passengers[currentPassengerIndex],
            ...passengerData
          };
          updatePassenger(currentPassengerIndex, updatedPassenger);
        } else {
          addPassenger(passengerData);
        }
        
        setErrors({});
        setApiError('');
        
        // Переходим к следующему пассажиру
        if (currentPassengerIndex < selectedSeats.length - 1) {
          setCurrentPassengerIndex(currentPassengerIndex + 1);
        }
      } catch (error) {
        console.error('Ошибка при сохранении пассажира:', error);
        setApiError('Не удалось сохранить данные. Пожалуйста, попробуйте еще раз.');
      }
    } else {
      setErrors(validationErrors);
    }
  };

  const handleNext = async () => {
    // Проверяем, что все пассажиры заполнены
    if (passengers.length !== selectedSeats.length) {
      setApiError(`Необходимо заполнить данные для всех ${selectedSeats.length} пассажиров`);
      return;
    }
    
    // Проверяем валидность всех пассажиров
    const invalidPassengers = [];
    const allErrors = {};
    
    passengers.forEach((passenger, index) => {
      const errors = validatePassenger(passenger);
      if (Object.keys(errors).length > 0) {
        invalidPassengers.push(index + 1);
        allErrors[index] = errors;
        
        if (index === currentPassengerIndex) {
          setErrors(errors);
        }
      }
    });
    
    if (invalidPassengers.length > 0) {
      const firstInvalidIndex = invalidPassengers[0] - 1;
      setCurrentPassengerIndex(firstInvalidIndex);
      setErrors(allErrors[firstInvalidIndex] || {});
      
      setApiError(`Пожалуйста, проверьте правильность заполнения данных пассажиров: ${invalidPassengers.join(', ')}`);
      return;
    }
    
    setLoading(true);
    
    try {
      navigate('/payment');
    } catch (error) {
      console.error('Ошибка при проверке данных:', error);
      setApiError('Произошла ошибка при проверке данных. Пожалуйста, попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPassenger = () => {
    if (passengers.length < selectedSeats.length) {
      const newPassenger = {
        id: `passenger-${Date.now()}-${passengers.length}`,
        type: 'adult',
        seatNumber: selectedSeats[passengers.length],
        lastName: '',
        firstName: '',
        middleName: '',
        gender: 'male',
        birthDate: '',
        documentType: 'passport',
        documentSeries: '',
        documentNumber: '',
        phone: '',
        email: '',
        limitedMobility: false,
        includeBedding: true,
        foodPreference: 'none'
      };
      addPassenger(newPassenger);
      setCurrentPassengerIndex(passengers.length);
      setApiError('');
    }
  };

  const handleRemovePassenger = (index) => {
    if (passengers.length > 1) {
      removePassenger(index);
      if (currentPassengerIndex >= index) {
        setCurrentPassengerIndex(Math.max(0, currentPassengerIndex - 1));
      }
      setApiError('');
    }
  };

  const formatPrice = (price) => {
    return price ? price.toLocaleString('ru-RU') : '0';
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateTimeString) => {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateTimeString;
    }
  };

  const getPassengerPrice = (passenger) => {
    if (!selectedWagon) return 0;
    const seatNumber = passenger.seatNumber;
    const basePrice = seatPrices[seatNumber] || selectedWagon.price || 2000;
    
    return passenger.type === 'child' ? 
      Math.round(basePrice * 0.6) : 
      basePrice;
  };

  // Вспомогательная функция для расчета возраста
  const calculateAge = (birthDateString) => {
    if (!birthDateString) return null;
    
    try {
      const birthDate = new Date(birthDateString);
      if (isNaN(birthDate.getTime())) return null;
      
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
      }
      
      return age;
    } catch (error) {
      console.error('Ошибка при расчете возраста:', error);
      return null;
    }
  };

  // Проверка, заполнены ли обязательные поля
  const areAllPassengersValid = () => {
    if (passengers.length !== selectedSeats.length) return false;
    
    return passengers.every(passenger => {
      const errors = validatePassenger(passenger);
      return Object.keys(errors).length === 0;
    });
  };

  if (!selectedTrain || !selectedWagon || selectedSeats.length === 0) {
    return (
      <div className="passengers-page error-state">
        <OrderSteps />
        <div className="passengers-page__container">
          <div className="passengers-error-message">
            <h2>Данные неполные</h2>
            <p>Пожалуйста, вернитесь и выберите поезд, вагон и места</p>
            <button 
              className="passengers-error-back-btn"
              onClick={() => navigate('/seats')}
            >
              ← Вернуться к выбору мест
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="passengers-page">
      <OrderSteps />

      <div className="passengers-page__container">
        <main className="passengers-page__main">
          {/* Детали поездки */}
          <div className="trip-details">
            <h2 className="trip-details__title">ДЕТАЛИ ПОЕЗДКИ</h2>
            
            <div className="trip-details__content">
              {/* Туда */}
              <div className="trip-details__direction">
                <h3 className="trip-details__direction-title">Туда</h3>
                <div className="trip-details__direction-content">
                  <div className="trip-details__date">
                    {formatDate(selectedTrain.departureTime)}
                  </div>
                  <div className="trip-details__train-info">
                    <div className="trip-details__train-number">
                      № Поезда: <strong>{selectedTrain.number}</strong>
                    </div>
                    <div className="trip-details__train-name">
                      {selectedTrain.name || `${selectedTrain.fromCity} → ${selectedTrain.toCity}`}
                    </div>
                  </div>
                  <div className="trip-details__route">
                    <div className="trip-details__route-time">
                      {formatTime(selectedTrain.departureTime)} → {formatTime(selectedTrain.arrivalTime)}
                    </div>
                    <div className="trip-details__route-stations">
                      <div className="trip-details__station">
                        <div className="trip-details__station-city">{selectedTrain.fromCity}</div>
                        <div className="trip-details__station-name">{selectedTrain.fromStation}</div>
                      </div>
                      <div className="trip-details__station">
                        <div className="trip-details__station-city">{selectedTrain.toCity}</div>
                        <div className="trip-details__station-name">{selectedTrain.toStation}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Пассажиры */}
              <div className="trip-details__passengers">
                <h3 className="trip-details__passengers-title">Пассажиры</h3>
                <div className="trip-details__passengers-list">
                  {passengers.map((passenger, index) => {
                    const age = calculateAge(passenger.birthDate);
                    
                    return (
                      <div key={passenger.id || index} className="trip-details__passenger-item">
                        <div className="trip-details__passenger-info">
                          <div className="trip-details__passenger-number">
                            Пассажир {index + 1}
                            {passenger.type === 'child' && (
                              <span className="trip-details__passenger-child-label"> (ребенок)</span>
                            )}
                          </div>
                          <div className="trip-details__passenger-name">
                            {passenger.lastName || 'Не указано'} {passenger.firstName || ''} {passenger.middleName || ''}
                          </div>
                          <div className="trip-details__passenger-seat">
                            Место: {passenger.seatNumber || selectedSeats[index]}
                          </div>
                          {passenger.birthDate && age !== null && (
                            <div className="trip-details__passenger-age">
                              Возраст: {age} {age === 1 ? 'год' : age >= 2 && age <= 4 ? 'года' : 'лет'}
                            </div>
                          )}
                        </div>
                        <div className="trip-details__passenger-price">
                          {formatPrice(getPassengerPrice(passenger))} ₽
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Итог */}
              <div className="trip-details__total">
                <div className="trip-details__total-label">ИТОГ:</div>
                <div className="trip-details__total-price">
                  {formatPrice(localTotal)} ₽
                </div>
              </div>
            </div>
          </div>

          {/* Формы пассажиров */}
          <div className="passengers-forms">
            <h2 className="passengers-forms__title">
              Пассажир {currentPassengerIndex + 1} из {selectedSeats.length}
              <span className="passengers-forms__seat-number">
                (Место: {selectedSeats[currentPassengerIndex]})
              </span>
            </h2>
            
            <div className="passengers-forms__progress">
              <div 
                className="passengers-forms__progress-bar"
                style={{ width: `${((currentPassengerIndex + 1) / selectedSeats.length) * 100}%` }}
              ></div>
            </div>

            {passengers[currentPassengerIndex] && (
              <PassengerForm
                key={passengers[currentPassengerIndex].id || currentPassengerIndex}
                passengerNumber={currentPassengerIndex + 1}
                seatNumber={selectedSeats[currentPassengerIndex]}
                onSave={handleSavePassenger}
                initialData={passengers[currentPassengerIndex]}
                validationErrors={errors}
              />
            )}

            {/* Ошибки валидации */}
            {Object.keys(errors).length > 0 && (
              <div className="passengers-forms__errors">
                <h4 className="passengers-forms__errors-title">
                  Исправьте ошибки:
                </h4>
                <ul className="passengers-forms__errors-list">
                  {Object.entries(errors).map(([field, message]) => (
                    <li key={field} className="passengers-forms__error">
                      {message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* API ошибки */}
            {apiError && (
              <div className="passengers-forms__api-error">
                <div className="passengers-forms__api-error-text">{apiError}</div>
              </div>
            )}

            {/* Управление пассажирами */}
            <div className="passengers-controls">
              <div className="passengers-controls__navigation">
                <button
                  className="passengers-controls__button passengers-controls__button--prev"
                  onClick={() => setCurrentPassengerIndex(Math.max(0, currentPassengerIndex - 1))}
                  disabled={currentPassengerIndex === 0 || loading}
                >
                  ← Предыдущий
                </button>
                
                <div className="passengers-controls__indicators">
                  {passengers.map((passenger, index) => {
                    const passengerErrors = validatePassenger(passenger);
                    const hasErrors = Object.keys(passengerErrors).length > 0;
                    const isFilled = passenger.lastName && passenger.firstName && passenger.birthDate;
                    
                    return (
                      <button
                        key={index}
                        className={`passengers-controls__indicator 
                          ${index === currentPassengerIndex ? 'passengers-controls__indicator--active' : ''} 
                          ${isFilled ? 'passengers-controls__indicator--filled' : ''}
                          ${hasErrors ? 'passengers-controls__indicator--error' : ''}`}
                        onClick={() => setCurrentPassengerIndex(index)}
                        disabled={loading}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  className="passengers-controls__button passengers-controls__button--next"
                  onClick={() => {
                    if (currentPassengerIndex < passengers.length - 1) {
                      setCurrentPassengerIndex(currentPassengerIndex + 1);
                    } else if (passengers.length < selectedSeats.length) {
                      handleAddPassenger();
                    }
                  }}
                  disabled={(currentPassengerIndex === passengers.length - 1 && passengers.length === selectedSeats.length) || loading}
                >
                  {currentPassengerIndex < passengers.length - 1 ? 'Следующий →' : 'Добавить пассажира'}
                </button>
              </div>

              {passengers.length > 1 && (
                <button
                  className="passengers-controls__remove"
                  onClick={() => handleRemovePassenger(currentPassengerIndex)}
                  disabled={loading || passengers.length <= 1}
                >
                  Удалить текущего пассажира
                </button>
              )}
            </div>
          </div>

          {/* Кнопка продолжения */}
          <div className="passengers-action">
            <button 
              className="passengers-action__continue"
              onClick={handleNext}
              disabled={!areAllPassengersValid() || loading}
            >
              {loading ? (
                <>
                  <span className="passengers-action__spinner"></span>
                  Проверка данных...
                </>
              ) : (
                'Перейти к оплате'
              )}
            </button>
            <p className="passengers-action__hint">
              * Для продолжения необходимо заполнить данные всех {selectedSeats.length} пассажиров
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default PassengersPage;
