import React from 'react';
import { useLocation } from 'react-router-dom';
import './OrderSteps.css';

const steps = [
  { id: 1, name: 'Билеты', path: '/search' },
  { id: 2, name: 'Пассажиры', path: '/passengers' },
  { id: 3, name: 'Оплата', path: '/payment' },
  { id: 4, name: 'Проверка', path: '/confirmation' }
];

function OrderSteps() {
  const location = useLocation();
  const currentStep = steps.findIndex(step => 
    location.pathname.startsWith(step.path)
  ) + 1;

  return (
    <div className="order-steps">
      <div className="order-steps__container">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="order-steps__step">
              <div 
                className={`order-steps__circle ${currentStep > step.id ? 'order-steps__circle--completed' : ''} ${currentStep === step.id ? 'order-steps__circle--active' : ''}`}
              >
                {currentStep > step.id ? (
                  <span className="order-steps__check">✓</span>
                ) : (
                  <span className="order-steps__number">{step.id}</span>
                )}
              </div>
              <span className="order-steps__label">{step.name}</span>
            </div>
            
            {index < steps.length - 1 && (
              <div 
                className={`order-steps__line ${currentStep > step.id + 1 ? 'order-steps__line--completed' : ''}`}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default OrderSteps;
