import { useEffect, useState } from "react";
import { locationsApi } from "../api/locations";

let cache = null;

export function useCountries() {
  const [countries, setCountries] = useState(cache || []);

  useEffect(() => {
    if (cache) return;
    locationsApi.countries().then((data) => {
      cache = data;
      setCountries(data);
    });
  }, []);

  return countries;
}

/** Resolves a 2-letter country code (as stored on Person/Club) to its
 * display name, e.g. "ES" -> "España", falling back to the raw code while
 * the country list is still loading. */
export function useCountryName() {
  const countries = useCountries();
  return (code) => countries.find((c) => c.code === code)?.name || code;
}
