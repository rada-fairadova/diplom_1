import React, { useState } from 'react';
import './PassengerForm.css';

function PassengerForm({ passengerNumber, onSave, initialData = {} }) {
  const [formData, setFormData] = useState({
    type: initialData.type || 'adult',
    lastName: initialData.lastName || '',
    firstName: initialData.firstName || '',
    middleName: initialData.middleName || '',
    gender: initialData.gender || 'male',
    birthDate: initialData.birthDate || '',
    documentType: initialData.documentType || 'passport',
    documentSeries: initialData.documentSeries || '',
    documentNumber: initialData.documentNumber || '',
    limitedMobility: initialData.limitedMobility || false
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Очищаем ошибку при изменении поля
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Введите фамилию';
    }
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Введите имя';
    }
    
    if (!formData.birthDate) {
      newErrors.birthDate = 'Введите дату рождения';
    } else if (new Date(formData.birthDate) > new Date()) {
      newErrors.birthDate = 'Дата рождения не может быть в будущем';
    }
    
    if (formData.type === 'child' && formData.documentType === 'birthCertificate') {
      if (!/^[IVX]+-[А-Я]{2}-\d{6}$/.test(formData.documentNumber)) {
        newErrors.documentNumber = 'Неверный формат свидетельства о рождении';
      }
    }
    
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    
    if (Object.keys(validationErrors).length === 0) {
      onSave(formData);
    } else {
      setErrors(validationErrors);
    }
  };

  return (
    <form className="passenger-form" onSubmit={handleSubmit}>
      <h3 className="passenger-form__title">Пассажир {passengerNumber}</h3>
      
      <div className="passenger-form__type-selector">
        <label className="passenger-form__radio-label">
          <input
            type="radio"
            name="type"
            value="adult"
            checked={formData.type === 'adult'}
            onChange={handleChange}
            className="passenger-form__radio"
          />
          Взрослый
        </label>
        
        <label className="passenger-form__radio-label">
          <input
            type="radio"
            name="type"
            value="child"
            checked={formData.type === 'child'}
            onChange={handleChange}
            className="passenger-form__radio"
          />
          Детский
        </label>
      </div>

      <div className="passenger-form__row">
        <div className="passenger-form__field">
          <label className="passenger-form__label">Фамилия *</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={`passenger-form__input ${errors.lastName ? 'passenger-form__input--error' : ''}`}
            required
          />
          {errors.lastName && <span className="passenger-form__error">{errors.lastName}</span>}
        </div>
        
        <div className="passenger-form__field">
          <label className="passenger-form__label">Имя *</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={`passenger-form__input ${errors.firstName ? 'passenger-form__input--error' : ''}`}
            required
          />
          {errors.firstName && <span className="passenger-form__error">{errors.firstName}</span>}
        </div>
        
        <div className="passenger-form__field">
          <label className="passenger-form__label">Отчество</label>
          <input
            type="text"
            name="middleName"
            value={formData.middleName}
            onChange={handleChange}
            className="passenger-form__input"
          />
        </div>
      </div>

      <div className="passenger-form__row">
        <div className="passenger-form__field">
          <label className="passenger-form__label">Пол</label>
          <div className="passenger-form__gender-selector">
            <label className="passenger-form__radio-label">
              <input
                type="radio"
                name="gender"
                value="male"
                checked={formData.gender === 'male'}
                onChange={handleChange}
                className="passenger-form__radio"
              />
              Мужской
            </label>
            
            <label className="passenger-form__radio-label">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={formData.gender === 'female'}
                onChange={handleChange}
                className="passenger-form__radio"
              />
              Женский
            </label>
          </div>
        </div>
        
        <div className="passenger-form__field">
          <label className="passenger-form__label">Дата рождения *</label>
          <input
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleChange}
            className={`passenger-form__input ${errors.birthDate ? 'passenger-form__input--error' : ''}`}
            required
          />
          {errors.birthDate && <span className="passenger-form__error">{errors.birthDate}</span>}
        </div>
      </div>

      <div className="passenger-form__row">
        <div className="passenger-form__field">
          <label className="passenger-form__label">Тип документа</label>
          <select
            name="documentType"
            value={formData.documentType}
            onChange={handleChange}
            className="passenger-form__select"
          >
            <option value="passport">Паспорт РФ</option>
            <option value="birthCertificate">Свидетельство о рождении</option>
            <option value="foreignPassport">Заграничный паспорт</option>
          </select>
        </div>
        
        {formData.documentType === 'passport' && (
          <>
            <div className="passenger-form__field">
              <label className="passenger-form__label">Серия</label>
              <input
                type="text"
                name="documentSeries"
                value={formData.documentSeries}
                onChange={handleChange}
                className="passenger-form__input"
                maxLength="4"
                pattern="\d{4}"
              />
            </div>
            
            <div className="passenger-form__field">
              <label className="passenger-form__label">Номер</label>
              <input
                type="text"
                name="documentNumber"
                value={formData.documentNumber}
                onChange={handleChange}
                className={`passenger-form__input ${errors.documentNumber ? 'passenger-form__input--error' : ''}`}
                maxLength="6"
                pattern="\d{6}"
              />
              {errors.documentNumber && <span className="passenger-form__error">{errors.documentNumber}</span>}
            </div>
          </>
        )}
        
        {formData.documentType === 'birthCertificate' && (
          <div className="passenger-form__field passenger-form__field--wide">
            <label className="passenger-form__label">Номер свидетельства *</label>
            <input
              type="text"
              name="documentNumber"
              value={formData.documentNumber}
              onChange={handleChange}
              className={`passenger-form__input ${errors.documentNumber ? 'passenger-form__input--error' : ''}`}
              placeholder="VIII-ЫП-123456"
              required
            />
            {errors.documentNumber && <span className="passenger-form__error">{errors.documentNumber}</span>}
          </div>
        )}
      </div>

      <div className="passenger-form__checkbox">
        <label className="passenger-form__checkbox-label">
          <input
            type="checkbox"
            name="limitedMobility"
            checked={formData.limitedMobility}
            onChange={handleChange}
            className="passenger-form__checkbox-input"
          />
          Ограниченная подвижность
        </label>
      </div>

      <button type="submit" className="passenger-form__button button">
        Сохранить
      </button>
    </form>
  );
}

export default PassengerForm;
