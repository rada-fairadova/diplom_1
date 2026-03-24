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

// Создаем Layout компонент для общих элементов
function Layout() {
  return (
    <>
      <LoadingScreen />
      <Header />
      <div className="App">
        <Outlet /> {/* Здесь будут рендериться дочерние компоненты */}
        <Footer />
      </div>
    </>
  );
}

function App() {
  return (
    <TicketProvider>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<MainPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/seats" element={<SeatsSelectionPage />} />
            <Route path="/passengers" element={<PassengersPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/confirmation" element={<OrderSuccessPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Router>
    </TicketProvider>
  );
}

export default App;
