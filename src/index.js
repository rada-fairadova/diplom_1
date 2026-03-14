import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { TicketProvider } from './context/TicketContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <TicketProvider>
      <App />
    </TicketProvider>
  </React.StrictMode>
);
