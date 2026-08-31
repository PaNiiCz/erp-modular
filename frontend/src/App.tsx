import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Dashboard from './pages/Dashboard';
import EmConstrucao from './pages/EmConstrucao';
import RotaProtegida from './components/RotaProtegida';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        <Route
          path="/dashboard"
          element={
            <RotaProtegida>
              <Layout>
                <Dashboard />
              </Layout>
            </RotaProtegida>
          }
        />
        <Route
          path="/clientes"
          element={
            <RotaProtegida>
              <Layout>
                <EmConstrucao titulo="Clientes" />
              </Layout>
            </RotaProtegida>
          }
        />
        <Route
          path="/produtos"
          element={
            <RotaProtegida>
              <Layout>
                <EmConstrucao titulo="Produtos" />
              </Layout>
            </RotaProtegida>
          }
        />
        <Route
          path="/estoque"
          element={
            <RotaProtegida>
              <Layout>
                <EmConstrucao titulo="Estoque" />
              </Layout>
            </RotaProtegida>
          }
        />
        <Route
          path="/vendas"
          element={
            <RotaProtegida>
              <Layout>
                <EmConstrucao titulo="Vendas" />
              </Layout>
            </RotaProtegida>
          }
        />
        <Route
          path="/financeiro"
          element={
            <RotaProtegida>
              <Layout>
                <EmConstrucao titulo="Financeiro" />
              </Layout>
            </RotaProtegida>
          }
        />
        <Route
          path="/compras"
          element={
            <RotaProtegida>
              <Layout>
                <EmConstrucao titulo="Compras" />
              </Layout>
            </RotaProtegida>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;