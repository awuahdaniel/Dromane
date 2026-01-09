import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { DashboardSkeleton, ChatSkeleton } from './components/Skeleton';

// Lazy load pages for performance
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PDFChat = lazy(() => import('./pages/PDFChat'));
const CodeAnalyzer = lazy(() => import('./pages/CodeAnalyzer'));
const ResearchAssistant = lazy(() => import('./pages/ResearchAssistant'));
const Summarizer = lazy(() => import('./pages/Summarizer'));
const Humanizer = lazy(() => import('./pages/Humanizer'));
const Settings = lazy(() => import('./pages/Settings'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));

// Full screen loader for auth check
const FullScreenLoader = () => (
  <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 text-sm">Loading...</p>
    </div>
  </div>
);

// Protected Route Component with proper auth checks
const ProtectedRoute = ({ children, fallback }) => {
  const { authStatus, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return fallback || <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public route that redirects authenticated users
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Suspense fallback={<FullScreenLoader />}>
            <Login />
          </Suspense>
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Suspense fallback={<FullScreenLoader />}>
            <Register />
          </Suspense>
        </PublicRoute>
      } />

      {/* OAuth Callback Route */}
      <Route path="/auth/callback" element={
        <Suspense fallback={<FullScreenLoader />}>
          <AuthCallback />
        </Suspense>
      } />

      {/* Dashboard & Tools */}
      <Route path="/dashboard" element={
        <ProtectedRoute fallback={<DashboardSkeleton />}>
          <Suspense fallback={<DashboardSkeleton />}>
            <Dashboard />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/research" element={
        <ProtectedRoute fallback={<ChatSkeleton />}>
          <Suspense fallback={<ChatSkeleton />}>
            <ResearchAssistant />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/pdf" element={
        <ProtectedRoute fallback={<ChatSkeleton />}>
          <Suspense fallback={<ChatSkeleton />}>
            <PDFChat />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/code" element={
        <ProtectedRoute fallback={<ChatSkeleton />}>
          <Suspense fallback={<ChatSkeleton />}>
            <CodeAnalyzer />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/summarizer" element={
        <ProtectedRoute fallback={<ChatSkeleton />}>
          <Suspense fallback={<ChatSkeleton />}>
            <Summarizer />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/humanizer" element={
        <ProtectedRoute fallback={<ChatSkeleton />}>
          <Suspense fallback={<ChatSkeleton />}>
            <Humanizer />
          </Suspense>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute fallback={<FullScreenLoader />}>
          <Suspense fallback={<FullScreenLoader />}>
            <Settings />
          </Suspense>
        </ProtectedRoute>
      } />

      {/* Default Redirection */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <AppRoutes />
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
