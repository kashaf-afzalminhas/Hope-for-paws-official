import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../config';

const EMPTY_LOCATION = {
  countryCode: 'PK',
  countryName: 'Pakistan',
  provinceCode: '',
  provinceName: '',
  cityCode: '',
  cityName: ''
};

export const emptyPakistanLocation = EMPTY_LOCATION;

export default function PakistanLocationSelector({ value, onChange, required = false, disabled = false }) {
  const [locations, setLocations] = useState(null);
  const current = { ...EMPTY_LOCATION, ...(value || {}) };

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/adoptions/cities?hierarchy=true`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Failed to load locations')))
      .then((data) => { if (active) setLocations(data); })
      .catch((error) => console.error('Failed to load location hierarchy:', error));
    return () => { active = false; };
  }, []);

  const provinces = locations?.provinces || [];
  const province = provinces.find((item) => item.code === current.provinceCode);
  const cities = province?.cities || [];

  const emit = (next) => onChange({ ...EMPTY_LOCATION, ...current, ...next });
  const selectClass = 'w-full rounded-2xl border border-gray-300 bg-white px-3 py-2.5 focus:border-[#6b493d] focus:outline-none focus:ring-1 focus:ring-[#6b493d] disabled:bg-gray-100';
  const requiredMark = required ? ' *' : '';
  const countryOptions = useMemo(() => locations?.countries || [{ code: 'PK', name: 'Pakistan' }], [locations]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm font-medium text-gray-700">
        Country{requiredMark}
        <select className={`${selectClass} mt-1`} value={current.countryCode} disabled={disabled} onChange={(event) => emit({ countryCode: event.target.value, countryName: countryOptions.find((item) => item.code === event.target.value)?.name || '', provinceCode: '', provinceName: '', cityCode: '', cityName: '' })}>
          {countryOptions.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-gray-700">
        Province / Region{requiredMark}
        <select className={`${selectClass} mt-1`} value={current.provinceCode} disabled={disabled || !locations} onChange={(event) => { const next = provinces.find((item) => item.code === event.target.value); emit({ provinceCode: next?.code || '', provinceName: next?.name || '', cityCode: '', cityName: '' }); }}>
          <option value="">{locations ? 'Select province / region' : 'Loading locations...'}</option>
          {provinces.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-gray-700">
        City{requiredMark}
        <select className={`${selectClass} mt-1`} value={current.cityCode} disabled={disabled || !province} onChange={(event) => { const next = cities.find((item) => item.code === event.target.value); emit({ cityCode: next?.code || '', cityName: next?.name || '' }); }}>
          <option value="">Select city</option>
          {cities.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
        </select>
      </label>
    </div>
  );
}
