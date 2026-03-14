import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage/MainPage'
import { TicketProvider } from './context/TicketContext';
import SearchPage from './pages/SearchPage/SearchPage';
import SeatsSelectionPage from './pages/SeatsSelectionPage/SeatsSelectionPage';
import PassengersPage from './pages/PassengersPage/PassengersPage';
import PaymentPage from './pages/PaymentPage/PaymentPage';
import OrderSuccessPage from './pages/OrderSuccessPage/OrderSuccessPage';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import './App.css';

function App() {
  return (
    <TicketProvider>
      <Router>
        <LoadingScreen />
        <Header />
        <div className="App">
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/" element={<SearchPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/seats" element={<SeatsSelectionPage />} />
            <Route path="/passengers" element={<PassengersPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/confirmation" element={<OrderSuccessPage />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </TicketProvider>
  );
}

export default App;
