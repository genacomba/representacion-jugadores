import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { playersApi } from "../api/players";
import { clubsApi } from "../api/clubs";
import { locationsApi } from "../api/locations";
import { contactsApi } from "../api/contacts";
import PersonCard from "../components/contacts/PersonCard";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import { Field, Input, Select } from "../components/common/Field";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import EmptyState from "../components/common/EmptyState";
import { CONTRACT_SITUATION_OPTIONS, PREFERRED_FOOT_OPTIONS } from "../constants/categories";
import { extractErrorMessage } from "../api/client";

const EMPTY_FILTERS = {
  position: "", secondary_position: "", age_min: "", age_max: "",
  nationality: "", current_country: "", club: "", has_eu_passport: "",
  preferred_foot: "", contract_situation: "", status: "",
};

export default function AdvancedPlayerSearch() {
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(() => ({
    ...EMPTY_FILTERS,
    ...Object.fromEntries(params.entries()),
  }));
  const [options, setOptions] = useState({ positions: [], statuses: [], countries: [], clubs: [] });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    Promise.all([
      playersApi.positions(),
      playersApi.statuses(),
      locationsApi.countries(),
      clubsApi.list({ page_size: 200 }),
    ]).then(([positions, statuses, countries, clubs]) => {
      setOptions({ positions, statuses, countries, clubs: clubs.results });
    });
  }, []);

  const activeFilters = useMemo(
    () => Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "")),
    [filters]
  );

  useEffect(() => {
    setParams(activeFilters, { replace: true });
    setLoading(true);
    setError(null);
    playersApi
      .search(activeFilters)
      .then(setResult)
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(activeFilters)]);

  const loadMore = () => {
    if (!result?.next) return;
    const url = new URL(result.next);
    playersApi.search(Object.fromEntries(url.searchParams)).then((next) =>
      setResult((prev) => ({ ...next, results: [...prev.results, ...next.results] }))
    );
  };

  const update = (key) => (e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }));
  const clearAll = () => setFilters(EMPTY_FILTERS);

  const handleToggleFavorite = async (person) => {
    const res = await contactsApi.toggleFavorite(person.id);
    setResult((prev) => ({
      ...prev,
      results: prev.results.map((p) => (p.id === person.id ? { ...p, is_favorite: res.is_favorite } : p)),
    }));
  };

  return (
    <div>
      <PageHeader
        title="Necesito un jugador"
        subtitle="Combiná filtros para encontrar candidatos al instante."
        back
        actions={
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-pitch-600 text-gold-400"
          >
            <SlidersHorizontal size={17} />
          </button>
        }
      />

      {showFilters && (
        <div className="mb-5 space-y-3 rounded-2xl border border-pitch-600/70 bg-pitch-850 p-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Posición">
              <Select value={filters.position} onChange={update("position")}>
                <option value="">Cualquiera</option>
                {options.positions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Posición secundaria">
              <Select value={filters.secondary_position} onChange={update("secondary_position")}>
                <option value="">Cualquiera</option>
                {options.positions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Edad mínima">
              <Input type="number" min="14" max="45" value={filters.age_min} onChange={update("age_min")} />
            </Field>
            <Field label="Edad máxima">
              <Input type="number" min="14" max="45" value={filters.age_max} onChange={update("age_max")} />
            </Field>
            <Field label="Nacionalidad">
              <Select value={filters.nationality} onChange={update("nationality")}>
                <option value="">Cualquiera</option>
                {options.countries.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="País actual">
              <Select value={filters.current_country} onChange={update("current_country")}>
                <option value="">Cualquiera</option>
                {options.countries.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Club">
              <Select value={filters.club} onChange={update("club")}>
                <option value="">Cualquiera</option>
                {options.clubs.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Estado">
              <Select value={filters.status} onChange={update("status")}>
                <option value="">Cualquiera</option>
                {options.statuses.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Pierna hábil">
              <Select value={filters.preferred_foot} onChange={update("preferred_foot")}>
                <option value="">Cualquiera</option>
                {PREFERRED_FOOT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Situación contractual">
              <Select value={filters.contract_situation} onChange={update("contract_situation")}>
                {CONTRACT_SITUATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Pasaporte comunitario">
              <Select value={filters.has_eu_passport} onChange={update("has_eu_passport")}>
                <option value="">Cualquiera</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </Select>
            </Field>
          </div>

          {Object.keys(activeFilters).length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-ink-200"
            >
              <X size={14} /> Limpiar filtros
            </button>
          )}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      )}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && result && (
        <>
          <p className="mb-3 text-sm text-ink-400">{result.count} jugador(es) encontrado(s)</p>
          {result.results.length === 0 ? (
            <EmptyState title="Ningún jugador coincide" description="Probá ajustar o quitar algún filtro." />
          ) : (
            <div className="space-y-2">
              {result.results.map((p) => (
                <PersonCard key={p.id} person={p} onToggleFavorite={handleToggleFavorite} />
              ))}
            </div>
          )}
          {result.next && (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={loadMore}>Cargar más</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
