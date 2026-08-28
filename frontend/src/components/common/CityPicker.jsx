import { useEffect, useRef, useState } from "react";
import { MapPin, Plus } from "lucide-react";
import { locationsApi } from "../../api/locations";
import { useDebounce } from "../../hooks/useDebounce";
import { Input } from "./Field";

/**
 * Autocomplete against the shared City reference table (see backend
 * apps.locations.models.City docstring): typing filters existing cities for
 * the selected country, and if nothing matches, offers to create one
 * on the fly. This is the only way contacts/clubs get a city, precisely so
 * we never end up with "Buenos Aires" / "Bs As" / "CABA" as unrelated rows.
 */
export default function CityPicker({ country, value, valueLabel, onChange, disabled }) {
  const [query, setQuery] = useState(valueLabel || "");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [creating, setCreating] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(valueLabel || "");
  }, [valueLabel]);

  useEffect(() => {
    if (!country || !open) return;
    locationsApi.cities({ search: debouncedQuery, country }).then(setOptions);
  }, [debouncedQuery, country, open]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const select = (city) => {
    onChange(city);
    setQuery(city.name);
    setOpen(false);
  };

  const createCity = async () => {
    setCreating(true);
    try {
      const city = await locationsApi.createCity({ name: query.trim(), country });
      select(city);
    } finally {
      setCreating(false);
    }
  };

  const exactMatch = options.some((o) => o.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
        <Input
          disabled={disabled}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onChange(null);
          }}
          placeholder={disabled ? "Elegí primero el país" : "Buscar ciudad..."}
          className="pl-9"
        />
      </div>
      {open && !disabled && query.trim().length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-pitch-600 bg-pitch-800 shadow-xl">
          {options.map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() => select(city)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-ink-200 hover:bg-pitch-700"
            >
              <MapPin size={14} className="text-ink-500" />
              {city.name}
              {city.admin_area && <span className="text-ink-500">· {city.admin_area}</span>}
            </button>
          ))}
          {!exactMatch && query.trim().length > 1 && (
            <button
              type="button"
              disabled={creating}
              onClick={createCity}
              className="flex w-full items-center gap-2 border-t border-pitch-600 px-4 py-2.5 text-left text-sm text-gold-400 hover:bg-pitch-700 disabled:opacity-50"
            >
              <Plus size={14} />
              {creating ? "Creando..." : `Crear ciudad "${query.trim()}"`}
            </button>
          )}
          {options.length === 0 && exactMatch === false && query.trim().length <= 1 && (
            <p className="px-4 py-3 text-xs text-ink-500">Escribí al menos 2 letras.</p>
          )}
        </div>
      )}
    </div>
  );
}
