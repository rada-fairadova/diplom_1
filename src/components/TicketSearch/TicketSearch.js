import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTicket } from '../../context/TicketContext';
import './TicketSearch.css';

function TicketSearch() {
  const navigate = useNavigate();
  const { updateSearchParams } = useTicket();
  
  const [formData, setFormData] = useState({
    from: 'Москва',
    to: 'Санкт-Петербург',
    departureDate: '',
    returnDate: '',
    passengers: {
      adults: 1,
      children: 0,
      childrenWithoutSeat: 0
    },
    ticketType: 'any'
  });

  const [errors, setErrors] = useState({});
  const [isOneWay, setIsOneWay] = useState(true);

  // Установка дат по умолчанию
  React.useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setFormData(prev => ({
      ...prev,
      departureDate: today.toISOString().split('T')[0],
      returnDate: tomorrow.toISOString().split('T')[0]
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('passengers.')) {
      const passengerType = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        passengers: {
          ...prev.passengers,
          [passengerType]: parseInt(value) || 0
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePassengerChange = (type, delta) => {
    setFormData(prev => ({
      ...prev,
      passengers: {
        ...prev.passengers,
        [type]: Math.max(0, prev.passengers[type] + delta)
      }
    }));
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.from.trim()) {
      newErrors.from = 'Введите город отправления';
    }
    
    if (!formData.to.trim()) {
      newErrors.to = 'Введите город прибытия';
    }
    
    if (formData.from === formData.to) {
      newErrors.to = 'Города отправления и прибытия не могут совпадать';
    }
    
    if (!formData.departureDate) {
      newErrors.departureDate = 'Выберите дату отправления';
    }
    
    if (!isOneWay && !formData.returnDate) {
      newErrors.returnDate = 'Выберите дату возвращения';
    }
    
    if (!isOneWay && formData.returnDate && formData.departureDate) {
      if (new Date(formData.returnDate) <= new Date(formData.departureDate)) {
        newErrors.returnDate = 'Дата возвращения должна быть позже даты отправления';
      }
    }
    
    const totalPassengers = formData.passengers.adults + formData.passengers.children;
    if (totalPassengers === 0) {
      newErrors.passengers = 'Выберите хотя бы одного пассажира';
    }
    
    if (formData.passengers.adults === 0 && formData.passengers.children > 0) {
      newErrors.passengers = 'Дети не могут путешествовать без взрослых';
    }
    
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    
    if (Object.keys(validationErrors).length === 0) {
      const searchData = {
        ...formData,
        isOneWay,
        totalPassengers: formData.passengers.adults + formData.passengers.children
      };
      
      updateSearchParams(searchData);
      navigate('/search');
    } else {
      setErrors(validationErrors);
    }
  };

  const swapCities = () => {
    setFormData(prev => ({
      ...prev,
      from: prev.to,
      to: prev.from
    }));
  };

  const popularCities = [
    'Москва', 'Санкт-Петербург', 'Казань', 'Нижний Новгород',
    'Екатеринбург', 'Новосибирск', 'Самара', 'Ростов-на-Дону'
  ];

  const wagonTypes = [
    { value: 'any', label: 'Любой' },
    { value: 'sitting', label: 'Сидячий' },
    { value: 'platzkart', label: 'Плацкарт' },
    { value: 'coupe', label: 'Купе' },
    { value: 'lux', label: 'Люкс' },
  ];

  return (
    <div className="ticket-search">
      <div className="ticket-search__header">
        <h1 className="ticket-search__title">Вся жизнь - путешествие!</h1>
        <p className="ticket-search__subtitle">Найдите идеальные билеты для вашего путешествия</p>
      </div>

      <form className="ticket-search__form" onSubmit={handleSubmit}>
        <div className="ticket-search__row">
          <div className="ticket-search__field">
            <label className="ticket-search__label">Откуда</label>
            <div className="ticket-search__input-wrapper">
              <input
                type="text"
                name="from"
                value={formData.from}
                onChange={handleChange}
                className={`ticket-search__input ${errors.from ? 'ticket-search__input--error' : ''}`}
                placeholder="Город отправления"
                list="cities-from"
                required
              />
              <datalist id="cities-from">
                {popularCities.map((city, index) => (
                  <option key={index} value={city} />
                ))}
              </datalist>
            </div>
            {errors.from && <span className="ticket-search__error">{errors.from}</span>}
          </div>

          <button 
            type="button" 
            className="ticket-search__swap-button"
            onClick={swapCities}
            aria-label="Поменять города местами"
          >
            ↔
          </button>

          <div className="ticket-search__field">
            <label className="ticket-search__label">Куда</label>
            <div className="ticket-search__input-wrapper">
              <input
                type="text"
                name="to"
                value={formData.to}
                onChange={handleChange}
                className={`ticket-search__input ${errors.to ? 'ticket-search__input--error' : ''}`}
                placeholder="Город прибытия"
                list="cities-to"
                required
              />
              <datalist id="cities-to">
                {popularCities.map((city, index) => (
                  <option key={index} value={city} />
                ))}
              </datalist>
            </div>
            {errors.to && <span className="ticket-search__error">{errors.to}</span>}
          </div>
        </div>

        <div className="ticket-search__row">
          <div className="ticket-search__field">
            <label className="ticket-search__label">Дата поездки</label>
            <input
              type="date"
              name="departureDate"
              value={formData.departureDate}
              onChange={handleChange}
              className={`ticket-search__input ${errors.departureDate ? 'ticket-search__input--error' : ''}`}
              min={new Date().toISOString().split('T')[0]}
              required
            />
            {errors.departureDate && <span className="ticket-search__error">{errors.departureDate}</span>}
          </div>

          <div className="ticket-search__field">
            <div className="ticket-search__trip-type">
              <label className="ticket-search__radio-label">
                <input
                  type="radio"
                  name="tripType"
                  checked={isOneWay}
                  onChange={() => setIsOneWay(true)}
                  className="ticket-search__radio"
                />
                В одну сторону
              </label>
              <label className="ticket-search__radio-label">
                <input
                  type="radio"
                  name="tripType"
                  checked={!isOneWay}
                  onChange={() => setIsOneWay(false)}
                  className="ticket-search__radio"
                />
                Туда и обратно
              </label>
            </div>

            {!isOneWay && (
              <>
                <label className="ticket-search__label">Дата возвращения</label>
                <input
                  type="date"
                  name="returnDate"
                  value={formData.returnDate}
                  onChange={handleChange}
                  className={`ticket-search__input ${errors.returnDate ? 'ticket-search__input--error' : ''}`}
                  min={formData.departureDate}
                  disabled={isOneWay}
                />
                {errors.returnDate && <span className="ticket-search__error">{errors.returnDate}</span>}
              </>
            )}
          </div>
        </div>

        <div className="ticket-search__row">
          <div className="ticket-search__field">
            <label className="ticket-search__label">Пассажиры</label>
            <div className="ticket-search__passengers">
              <div className="ticket-search__passenger-type">
                <span className="ticket-search__passenger-label">Взрослых</span>
                <div className="ticket-search__passenger-controls">
                  <button
                    type="button"
                    className="ticket-search__passenger-button"
                    onClick={() => handlePassengerChange('adults', -1)}
                    disabled={formData.passengers.adults <= 0}
                  >
                    -
                  </button>
                  <span className="ticket-search__passenger-count">{formData.passengers.adults}</span>
                  <button
                    type="button"
                    className="ticket-search__passenger-button"
                    onClick={() => handlePassengerChange('adults', 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="ticket-search__passenger-type">
                <span className="ticket-search__passenger-label">Детей (до 10 лет)</span>
                <div className="ticket-search__passenger-controls">
                  <button
                    type="button"
                    className="ticket-search__passenger-button"
                    onClick={() => handlePassengerChange('children', -1)}
                    disabled={formData.passengers.children <= 0}
                  >
                    -
                  </button>
                  <span className="ticket-search__passenger-count">{formData.passengers.children}</span>
                  <button
                    type="button"
                    className="ticket-search__passenger-button"
                    onClick={() => handlePassengerChange('children', 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="ticket-search__passenger-type">
                <span className="ticket-search__passenger-label">Детей без места</span>
                <div className="ticket-search__passenger-controls">
                  <button
                    type="button"
                    className="ticket-search__passenger-button"
                    onClick={() => handlePassengerChange('childrenWithoutSeat', -1)}
                    disabled={formData.passengers.childrenWithoutSeat <= 0}
                  >
                    -
                  </button>
                  <span className="ticket-search__passenger-count">{formData.passengers.childrenWithoutSeat}</span>
                  <button
                    type="button"
                    className="ticket-search__passenger-button"
                    onClick={() => handlePassengerChange('childrenWithoutSeat', 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            {errors.passengers && <span className="ticket-search__error">{errors.passengers}</span>}
          </div>

          <div className="ticket-search__field">
            <label className="ticket-search__label">Тип вагона</label>
            <select
              name="ticketType"
              value={formData.ticketType}
              onChange={handleChange}
              className="ticket-search__select"
            >
              {wagonTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="ticket-search__actions">
          <button type="submit" className="ticket-search__submit-button">
            НАЙТИ БИЛЕТЫ
          </button>
        </div>
      </form>
    </div>
  );
}

export default TicketSearch;
