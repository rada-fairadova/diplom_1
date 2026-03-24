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

// Layout компонент для общих элементов
function Layout() {
  return (
    <>
      <LoadingScreen />
      <Header />
      <div className="App">
        <Outlet /> {/* Дочерние компоненты будут рендериться здесь */}
      </div>
      <Footer />
    </>
  );
}

function App() {
  // Для GitHub Pages нужно указать basename
  const basename = process.env.NODE_ENV === 'production' 
    ? '/diplom_1'  // замените на имя вашего репозитория
    : '/';

  return (
    <TicketProvider>
      <BrowserRouter basename={basename}>
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
      </BrowserRouter>
    </TicketProvider>
  );
}

export default App;
