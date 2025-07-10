import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home.jsx';
import Configurar from './components/Configurar.jsx';
import Cardapio from './components/Cardapio.jsx';
import './App.css';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/configurar" element={<Configurar />} />
                <Route path="/:restaurantId" element={<Cardapio />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;