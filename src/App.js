import { HashRouter, Routes, Route } from 'react-router-dom';
import { TicketProvider } from './context/TicketContext';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import MainPage from './pages/MainPage/MainPage';
import SearchPage from './pages/SearchPage/SearchPage';
import SeatsSelectionPage from './pages/SeatsSelectionPage/SeatsSelectionPage';
import PassengersPage from './pages/PassengersPage/PassengersPage';
import PaymentPage from './pages/PaymentPage/PaymentPage';
import OrderSuccessPage from './pages/OrderSuccessPage/OrderSuccessPage';

function App() {
  return (
    <TicketProvider>
      <HashRouter>
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
      </HashRouter>
    </TicketProvider>
  );
}

export default App;
