import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './routes/ProtectedRoute';
import ClickSpark from './components/reactbits/ClickSpark';

// Layouts (kept eager - needed on every route, small)
import { PublicLayout } from './components/layouts/PublicLayout';
import { DashboardLayout } from './components/layouts/DashboardLayout';

// Public Pages - lazy loaded so a visitor's first load doesn't include
// member/admin portal code
// Public Pages - lazy loaded so a visitor's first load doesn't include
// member/admin portal code
const Home = lazy(() => import('./pages/public/Home'));
const PublicSessions = lazy(() => import('./pages/public/PublicSessions'));
const Gallery = lazy(() => import('./pages/public/Gallery'));
const Apply = lazy(() => import('./pages/public/Apply'));
const Login = lazy(() => import('./pages/public/Login'));
const EventDetails = lazy(() => import('./pages/public/EventDetails'));

// Admin Portal Pages - lazy loaded, only fetched for admins
const AllAttendance = lazy(() => import('./pages/admin/AllAttendance'));
const SessionForm = lazy(() => import('./pages/admin/SessionForm'));
const EventForm = lazy(() => import('./pages/admin/EventForm'));
const Applications = lazy(() => import('./pages/admin/Applications'));
const GalleryManager = lazy(() => import('./pages/admin/GalleryManager'));

// Member Portal Pages - lazy loaded, only fetched when a logged-in member
// actually navigates into the dashboard
const Dashboard = lazy(() => import('./pages/member/Dashboard'));
const MyAttendance = lazy(() => import('./pages/member/MyAttendance'));
const Sessions = lazy(() => import('./pages/member/Sessions'));
const SessionDetail = lazy(() => import('./pages/member/SessionDetail'));



// Simple full-page fallback shown while a lazy route's chunk downloads
const RouteLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-black">
    <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
  </div>
);

// Nav clicks route hash links (#about) to "/#about". React Router doesn't
// auto-scroll on that, so this watches the URL and scrolls to the matching
// section - retrying briefly in case the page (and its sections) just mounted.
const ScrollToHash = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    let attempts = 0;
    let frameId;

    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (attempts < 30) {
        attempts += 1;
        frameId = requestAnimationFrame(tryScroll);
      }
    };
    tryScroll();

    return () => cancelAnimationFrame(frameId);
  }, [location.pathname, location.hash]);

  return null;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <ScrollToHash />
          <ClickSpark sparkColor="#ffffff" sparkSize={10} sparkRadius={15} sparkCount={8} duration={400}>
            <Suspense fallback={<RouteLoading />}>
            <Routes>
{/* Public Layout Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
                <Route path="/events/:slug" element={<EventDetails />} />
                <Route path="/sessions-archive" element={<PublicSessions />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/apply" element={<Apply />} />
                <Route path="/login" element={<Login />} />
              </Route>

              {/* Member Portal Protected Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/attendance" element={<MyAttendance />} />
                <Route path="/sessions" element={<Sessions />} />
                <Route path="/sessions/:id" element={<SessionDetail />} />
              </Route>

              {/* Admin Portal Protected Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                  <Route index element={<Dashboard />} />
  <Route path="members" element={<AllAttendance />} />
  <Route path="applications" element={<Applications />} />
  <Route path="sessions" element={<Sessions />} />
  <Route path="sessions/new" element={<SessionForm />} />
  <Route path="events" element={<EventForm />} />
  <Route path="resources" element={<GalleryManager />} />
  <Route path="attendance" element={<AllAttendance />} />
</Route>

              {/* Catch-all Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
          </ClickSpark>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;