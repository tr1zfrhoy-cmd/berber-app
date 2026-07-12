import React, { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { hideNativeSplash, setupStatusBar, wireHardwareBack, isNative } from "./lib/native";

import { AuthProvider, useAuth } from "./context/AuthContext";
import Splash from "./components/Splash";
import Auth from "./components/Auth";
import Layout from "./components/Layout";
import MapView from "./components/MapView";

import CustomerHome from "./pages/CustomerHome";
import Booking from "./pages/Booking";
import BarberDashboard from "./pages/BarberDashboard";
import Wallet from "./pages/Wallet";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminUserDetail from "./pages/AdminUserDetail";
import AdminBookings from "./pages/AdminBookings";
import AdminSettings from "./pages/AdminSettings";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import BarberWorks from "./pages/BarberWorks";
import AdminReports from "./pages/AdminReports";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import Onboarding from "./pages/Onboarding";
import InstallPrompt from "./components/InstallPrompt";

const RoleHome = () => {
  const { user } = useAuth();
  if (user?.role === "barber") return <BarberDashboard />;
  if (user?.role === "admin") return <AdminDashboard />;
  return <CustomerHome />;
};

const Protected = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  // Allow guests to read legal pages from the auth-screen links.
  // Everything else requires login.
  if (!user) {
    return (
      <Routes>
        <Route path="privacy" element={<PrivacyPolicy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="help" element={<Help />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }
  return (
    <Layout>
      <Routes>
        <Route index element={<RoleHome />} />
        <Route path="map" element={<MapView />} />
        <Route path="book" element={<Booking />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="chat" element={<Chat />} />
        <Route path="settings" element={<Settings />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/:id" element={<AdminUserDetail />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="admin-settings" element={<AdminSettings />} />
        <Route path="privacy" element={<PrivacyPolicy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="works" element={<BarberWorks />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="help" element={<Help />} />
      </Routes>
    </Layout>
  );
};

const isOnboarded = () => {
  try { return localStorage.getItem("berber_onboarded") === "1"; }
  catch (e) { return true; }
};

// Route-level guards that re-read localStorage on EVERY render/navigation
// so that dismissing onboarding takes effect immediately without a page reload.
const OnboardingGate = () => {
  const { user } = useAuth();
  if (isOnboarded()) return <Navigate to={user ? "/app" : "/auth"} replace />;
  return <Onboarding />;
};

const AuthGate = () => {
  const { user } = useAuth();
  if (user) return <Navigate to="/app" replace />;
  if (!isOnboarded()) return <Navigate to="/onboarding" replace />;
  return <Auth />;
};

const CatchAllRedirect = () => {
  const { user } = useAuth();
  if (user) return <Navigate to="/app" replace />;
  return <Navigate to={isOnboarded() ? "/auth" : "/onboarding"} replace />;
};

const Root = () => {
  const [showSplash, setShowSplash] = useState(true);
  const { loading } = useAuth();

  if (showSplash) return <Splash onDone={() => setShowSplash(false)} />;
  if (loading) return null;

  return (
    <Routes>
      <Route path="/onboarding" element={<OnboardingGate />} />
      <Route path="/auth" element={<AuthGate />} />
      <Route path="/app/*" element={<Protected />} />
      <Route path="*" element={<CatchAllRedirect />} />
    </Routes>
  );
};

function App() {
  useEffect(() => {
    // Native shell polish: kill the OS splash once React is mounted,
    // set the status bar to the dark identity, and wire Android hardware back.
    setupStatusBar();
    hideNativeSplash();
    if (isNative()) document.body.classList.add("cap-native");
    const unsub = wireHardwareBack();
    return () => { try { unsub(); } catch (e) {} };
  }, []);

  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Root />
          <InstallPrompt />
          <Toaster position="top-center" richColors theme="dark" toastOptions={{ style: { fontFamily: "Cairo, sans-serif", direction: "rtl" } }} />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
