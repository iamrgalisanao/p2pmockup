import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import PropTypes from 'prop-types';
import { useAuthStore } from './store/authStore';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RequisitionListPage from './pages/requisitions/RequisitionListPage';
import RequisitionFormPage from './pages/requisitions/RequisitionFormPage';
import RequisitionDetailPage from './pages/requisitions/RequisitionDetailPage';
import InboxPage from './pages/InboxPage';
import VendorListPage from './pages/vendors/VendorListPage';
import UserListPage from './pages/UserListPage';
import SettingsPage from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="inbox" element={<InboxPage />} />

            <Route path="requisitions" element={<RequisitionListPage />} />
            <Route path="requisitions/new" element={<RequisitionFormPage />} />
            <Route path="requisitions/:id" element={<RequisitionDetailPage />} />
            <Route path="requisitions/:id/edit" element={<RequisitionFormPage />} />

            <Route path="vendors" element={<VendorListPage />} />
            <Route path="users" element={<UserListPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;
