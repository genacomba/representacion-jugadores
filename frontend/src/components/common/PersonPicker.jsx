import { useEffect, useRef, useState } from "react";
import { User, X } from "lucide-react";
import { contactsApi } from "../../api/contacts";
import { useDebounce } from "../../hooks/useDebounce";
import { Input } from "./Field";

/** Typeahead over existing contacts (optionally restricted to one category),
 * used for "quién me lo recomendó" and "representante" pickers. */
export default function PersonPicker({ category, value, valueLabel, onChange, placeholder, excludeId }) {
  const [query, setQuery] = useState(valueLabel || "");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(valueLabel || "");
  }, [valueLabel]);

  useEffect(() => {
    if (!open || debouncedQuery.trim().length < 2) {
      setOptions([]);
      return;
    }
    contactsApi
      .list({ name: debouncedQuery.trim(), category, page_size: 8 })
      .then((data) => setOptions(data.results.filter((p) => p.id !== excludeId)));
  }, [debouncedQuery, category, open, excludeId]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const select = (person) => {
    onChange(person);
    setQuery(person.full_name);
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
        <Input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onChange(null);
          }}
          placeholder={placeholder || "Buscar contacto..."}
          className="pl-9 pr-9"
        />
        {value && (
          <button type="button" onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={16} className="text-ink-500" />
          </button>
        )}
      </div>
      {open && options.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-pitch-600 bg-pitch-800 shadow-xl">
          {options.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => select(person)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-ink-200 hover:bg-pitch-700"
            >
              {person.full_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
