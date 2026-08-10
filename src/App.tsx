import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Services from './pages/Services';
import Portfolio from './pages/Portfolio';
import Process from './pages/Process';
import Contact from './pages/Contact';
import CertificateIssuance from './pages/CertificateIssuance';
import AIMasterclass from './pages/AIMasterclass';
import Login from './pages/Admin/Login';
import Dashboard from './pages/Admin/Dashboard';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? (children as React.ReactElement) : <Navigate to="/admin/login" />;
};

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="services" element={<Services />} />
              <Route path="portfolio" element={<Portfolio />} />
              <Route path="process" element={<Process />} />
              <Route path="contact" element={<Contact />} />
              <Route path="certificate" element={<CertificateIssuance />} />
            </Route>

            {/* Masterclass Landing Page */}
            <Route path="/ai-masterclass" element={<AIMasterclass />} />
            <Route path="/masterclass" element={<AIMasterclass />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
}
