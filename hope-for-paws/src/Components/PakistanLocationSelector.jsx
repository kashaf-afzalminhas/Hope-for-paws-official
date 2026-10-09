import React, { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL } from '../config';
import { ChevronDown } from 'lucide-react';

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
  const [openMenu, setOpenMenu] = useState(null);
  const locationMenuRef = useRef(null);
  const current = { ...EMPTY_LOCATION, ...(value || {}) };

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/adoptions/cities?hierarchy=true`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Failed to load locations')))
      .then((data) => { if (active) setLocations(data); })
      .catch((error) => console.error('Failed to load location hierarchy:', error));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const closeLocationMenu = (event) => {
      const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
      if (locationMenuRef.current && !path.includes(locationMenuRef.current)) {
        setOpenMenu(null);
      }
    };
    const closeLocationMenuOnEscape = (event) => {
      if (event.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('pointerdown', closeLocationMenu, true);
    document.addEventListener('click', closeLocationMenu, true);
    document.addEventListener('keydown', closeLocationMenuOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeLocationMenu, true);
      document.removeEventListener('click', closeLocationMenu, true);
      document.removeEventListener('keydown', closeLocationMenuOnEscape);
    };
  }, []);

  const provinces = locations?.provinces || [];
  const province = provinces.find((item) => item.code === current.provinceCode);
  const cities = province?.cities || [];

  const emit = (next) => onChange({ ...EMPTY_LOCATION, ...current, ...next });
  const requiredMark = required ? ' *' : '';
  const countryOptions = useMemo(() => locations?.countries || [{ code: 'PK', name: 'Pakistan' }], [locations]);
  const triggerClass = 'block w-full rounded-xl border border-[#e8dcc8] bg-white px-3 py-2.5 text-left text-[#4E3B31] transition-colors focus:border-[#6b493d] focus:outline-none focus:ring-2 focus:ring-[#6b493d]/20 disabled:cursor-not-allowed disabled:bg-gray-100';
  const menuClass = 'absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-[#e8dcc8] bg-white py-1 text-[#4E3B31] shadow-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
  const optionClass = 'block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[#F8F4ED]';

  const renderMenu = (menu, label, value, options, onSelect, placeholder) => (
    <div className="relative mt-1">
      <button
        type="button"
        disabled={disabled || (menu === 'province' && !locations) || (menu === 'city' && !province)}
        onClick={() => setOpenMenu((open) => open === menu ? null : menu)}
        aria-haspopup="listbox"
        aria-expanded={openMenu === menu}
        className={triggerClass}
      >
        <span className="flex items-center justify-between gap-3">
          <span>{value || placeholder}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${openMenu === menu ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {openMenu === menu && (
        <div role="listbox" aria-label={label} className={menuClass}>
          {options.map((item) => (
            <button
              type="button"
              role="option"
              aria-selected={value === item.value}
              key={item.value}
              onClick={() => { onSelect(item); setOpenMenu(null); }}
              className={optionClass}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div ref={locationMenuRef} className="grid gap-4 md:grid-cols-2">
      <label className="text-sm font-medium text-gray-700">
        Country{requiredMark}
        {renderMenu('country', 'Country', current.countryName, countryOptions.map((item) => ({ value: item.code, label: item.name })), (item) => emit({ countryCode: item.value, countryName: item.label, provinceCode: '', provinceName: '', cityCode: '', cityName: '' }), 'Select country')}
      </label>
      <label className="text-sm font-medium text-gray-700">
        Province / Region{requiredMark}
        {renderMenu('province', 'Province or region', current.provinceName, provinces.map((item) => ({ value: item.code, label: item.name })), (item) => { const next = provinces.find((provinceItem) => provinceItem.code === item.value); emit({ provinceCode: next?.code || '', provinceName: next?.name || '', cityCode: '', cityName: '' }); }, locations ? 'Select province / region' : 'Loading locations...')}
      </label>
      <label className="text-sm font-medium text-gray-700">
        City{requiredMark}
        {renderMenu('city', 'City', current.cityName, cities.map((item) => ({ value: item.code, label: item.name })), (item) => { const next = cities.find((cityItem) => cityItem.code === item.value); emit({ cityCode: next?.code || '', cityName: next?.name || '' }); }, 'Select city')}
      </label>
    </div>
  );
}
