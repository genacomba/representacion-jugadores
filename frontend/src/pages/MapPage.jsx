import { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import { mapApi } from "../api/map";
import { extractErrorMessage } from "../api/client";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import MapLegend from "../components/map/MapLegend";
import CityPanel from "../components/map/CityPanel";
import { ALL_CATEGORIES, categoryMeta } from "../constants/categories";

function markerElement(city) {
  const meta = categoryMeta(city.dominant_category);
  const size = Math.min(52, Math.max(26, 16 + Math.sqrt(city.total) * 8));
  const el = document.createElement("div");
  el.style.cursor = "pointer";
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.borderRadius = "9999px";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.fontFamily = "inherit";
  el.style.fontWeight = "600";
  el.style.fontSize = `${Math.max(10, size * 0.34)}px`;
  el.style.color = "#050705";
  el.style.background = meta.color;
  el.style.boxShadow = `0 0 0 3px ${meta.color}33, 0 0 14px ${meta.color}88`;
  el.style.border = "1.5px solid rgba(5,7,5,0.4)";
  el.textContent = String(city.total);
  return el;
}

export default function MapPage() {
  const containerRef = useRef(null);
  const globeRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 360, height: 480 });
  const [activeCategories, setActiveCategories] = useState(ALL_CATEGORIES.map((c) => c.value));
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [cityEntities, setCityEntities] = useState([]);
  const [panelLoading, setPanelLoading] = useState(false);

  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    mapApi
      .cities(activeCategories.length < ALL_CATEGORIES.length ? activeCategories : undefined)
      .then((data) => setCities(data.cities))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [activeCategories]);

  useEffect(() => {
    const controls = globeRef.current?.controls?.();
    if (!controls) return;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    const stop = () => (controls.autoRotate = false);
    containerRef.current?.addEventListener("pointerdown", stop, { once: true });
  }, [dimensions]);

  const toggleCategory = (value) => {
    setActiveCategories((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  };

  const handleCityClick = (city) => {
    setSelectedCity(city);
    setPanelLoading(true);
    mapApi
      .cityEntities(city.id, activeCategories.length < ALL_CATEGORIES.length ? activeCategories : undefined)
      .then((data) => setCityEntities(data.entities))
      .finally(() => setPanelLoading(false));
    globeRef.current?.pointOfView({ lat: city.latitude, lng: city.longitude, altitude: 1.3 }, 800);
  };

  const htmlElementsData = useMemo(() => cities, [cities]);

  return (
    <div className="flex h-[calc(100vh-6.5rem)] flex-col md:h-[calc(100vh-2.5rem)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-100">Mapa mundial</h1>
          <p className="text-xs text-ink-400">Ubicación aproximada por país y ciudad — no usa GPS.</p>
        </div>
      </div>

      <div className="mb-3">
        <MapLegend active={activeCategories} onToggle={toggleCategory} />
      </div>

      <div ref={containerRef} className="relative flex-1 overflow-hidden rounded-2xl border border-pitch-600/70 bg-black">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-pitch-950/60">
            <LoadingSpinner />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-pitch-950">
            <ErrorMessage message={error} />
          </div>
        )}

        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="/globe/earth-night.jpg"
          backgroundImageUrl="/globe/night-sky.png"
          backgroundColor="rgba(0,0,0,0)"
          atmosphereColor="#d4af37"
          atmosphereAltitude={0.18}
          htmlElementsData={htmlElementsData}
          htmlLat="latitude"
          htmlLng="longitude"
          htmlElement={markerElement}
          onHtmlElementClick={handleCityClick}
        />

        <CityPanel
          city={selectedCity}
          loading={panelLoading}
          entities={cityEntities}
          onClose={() => setSelectedCity(null)}
        />
      </div>
    </div>
  );
}
