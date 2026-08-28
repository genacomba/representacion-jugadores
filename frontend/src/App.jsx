import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import LoadingSpinner from "./components/common/LoadingSpinner";

import Login from "./pages/Login";
import Home from "./pages/Home";
import Search from "./pages/Search";
import AdvancedPlayerSearch from "./pages/AdvancedPlayerSearch";
import AddContact from "./pages/AddContact";
import ContactForm from "./pages/ContactForm";
import ContactDetail from "./pages/ContactDetail";
import ClubDetail from "./pages/ClubDetail";
import More from "./pages/More";
import CategoryList from "./pages/CategoryList";
import Favorites from "./pages/Favorites";
import NotFound from "./pages/NotFound";

// react-globe.gl pulls in three.js (huge). Splitting it into its own chunk
// keeps the initial app shell light and avoids blowing past the PWA
// precache size limit with a library only the map screen needs.
const MapPage = lazy(() => import("./pages/MapPage"));

function MapPageFallback() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="buscar" element={<Search />} />
            <Route path="jugadores" element={<AdvancedPlayerSearch />} />
            <Route path="agregar" element={<AddContact />} />
            <Route path="agregar/:category" element={<ContactForm />} />
            <Route path="contactos/:id" element={<ContactDetail />} />
            <Route path="contactos/:id/editar" element={<ContactForm mode="edit" />} />
            <Route path="clubes/:id" element={<ClubDetail />} />
            <Route path="clubes/:id/editar" element={<ContactForm mode="edit" category="club" />} />
            <Route
              path="mapa"
              element={
                <Suspense fallback={<MapPageFallback />}>
                  <MapPage />
                </Suspense>
              }
            />
            <Route path="mas" element={<More />} />
            <Route path="categoria/:category" element={<CategoryList />} />
            <Route path="favoritos" element={<Favorites />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
