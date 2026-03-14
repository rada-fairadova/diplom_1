import React from 'react';
import './WagonTypeSelector.css';

const wagonTypes = [
  { 
    id: 'sitting', 
    label: 'Сидячий', 
    icon: '💺',
    description: 'Удобные сидячие места',
    minPrice: 1500,
    features: ['Кондиционер', 'Розетки', 'Столик']
  },
  { 
    id: 'platzkart', 
    label: 'Плацкарт', 
    icon: '🛏️',
    description: 'Открытое купе с полками',
    minPrice: 2500,
    features: ['Бельё входит в стоимость', '54 места в вагоне']
  },
  { 
    id: 'coupe', 
    label: 'Купе', 
    icon: '🚪',
    description: 'Закрытое купе на 4 человека',
    minPrice: 3500,
    features: ['Закрытое купе', 'Две полки', 'Личное пространство']
  },
  { 
    id: 'lux', 
    label: 'Люкс (СВ)', 
    icon: '⭐',
    description: 'Комфортабельные купе повышенной комфортности',
    minPrice: 7000,
    features: ['Двухместное купе', 'Душ и туалет', 'TV', 'Wi-Fi']
  }
];

function WagonTypeSelector({ selectedType, onSelect }) {
  const handleTypeClick = (typeId) => {
    onSelect(typeId);
  };

  return (
    <div className="wagon-selector">
      <h3 className="wagon-selector__title">Тип вагона</h3>
      <div className="wagon-selector__types">
        {wagonTypes.map(type => (
          <div
            key={type.id}
            className={`wagon-selector__type ${selectedType === type.id ? 'wagon-selector__type--selected' : ''}`}
            onClick={() => handleTypeClick(type.id)}
          >
            <div className="wagon-selector__type-header">
              <span className="wagon-selector__type-icon">{type.icon}</span>
              <span className="wagon-selector__type-label">{type.label}</span>
            </div>
            
            <div className="wagon-selector__type-info">
              <div className="wagon-selector__type-description">
                {type.description}
              </div>
              
              <div className="wagon-selector__type-price">
                от {type.minPrice.toLocaleString()} ₽
              </div>
              
              <ul className="wagon-selector__type-features">
                {type.features.map((feature, index) => (
                  <li key={index} className="wagon-selector__type-feature">
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="wagon-selector__type-select">
              <div className={`wagon-selector__type-radio ${selectedType === type.id ? 'wagon-selector__type-radio--checked' : ''}`}>
                {selectedType === type.id && (
                  <div className="wagon-selector__type-radio-dot"></div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WagonTypeSelector;
