const slugify = (value) => String(value)
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const provinceDefinitions = [
  {
    code: 'PK-PB',
    name: 'Punjab',
    cities: ['Attock', 'Bahawalpur', 'Bahawalnagar', 'Bhakkar', 'Chakwal', 'Chiniot', 'Chishtian', 'Dera Ghazi Khan', 'Faisalabad', 'Gojra', 'Gujranwala', 'Gujrat', 'Hafizabad', 'Jhelum', 'Kamalia', 'Kasur', 'Khanewal', 'Khushab', 'Kot Addu', 'Lahore', 'Layyah', 'Lodhran', 'Multan', 'Muzaffargarh', 'Narowal', 'Okara', 'Pakpattan', 'Rahim Yar Khan', 'Rawalpindi', 'Sadiqabad', 'Sahiwal', 'Sargodha', 'Sheikhupura', 'Sialkot', 'Taxila', 'Vehari', 'Wah Cantonment'],
  },
  {
    code: 'PK-SD',
    name: 'Sindh',
    cities: ['Dadu', 'Ghotki', 'Hyderabad', 'Jacobabad', 'Karachi', 'Larkana', 'Mirpur Khas', 'Nawabshah', 'Sukkur', 'Tando Adam'],
  },
  {
    code: 'PK-KP',
    name: 'Khyber Pakhtunkhwa',
    cities: ['Abbottabad', 'Bannu', 'Battagram', 'Dera Ismail Khan', 'Haripur', 'Kohat', 'Mansehra', 'Mardan', 'Nowshera', 'Peshawar', 'Swabi', 'Swat'],
  },
  {
    code: 'PK-BA',
    name: 'Balochistan',
    cities: ['Chaman', 'Khuzdar', 'Quetta', 'Sibi', 'Turbat', 'Zhob'],
  },
  {
    code: 'PK-GB',
    name: 'Gilgit-Baltistan',
    cities: ['Gilgit'],
  },
  {
    code: 'PK-AJ',
    name: 'Azad Jammu and Kashmir',
    cities: ['Mirpur', 'Muzaffarabad'],
  },
  {
    code: 'PK-IS',
    name: 'Islamabad Capital Territory',
    cities: ['Islamabad'],
  },
];

const buildLocations = () => provinceDefinitions.map((province) => {
  const cities = province.cities.map((cityName) => {
    return { code: `${province.code}-${slugify(cityName)}`, name: cityName };
  });

  return {
    code: province.code,
    name: province.name,
    cities,
  };
});

const PAKISTAN_LOCATIONS = buildLocations();
const PAKISTAN_CITIES = PAKISTAN_LOCATIONS.flatMap((province) => province.cities.map((city) => city.name));

const normalizeLocation = (value) => String(value || '').trim().toLocaleLowerCase();

const findLocation = ({ countryCode, provinceCode, cityCode } = {}) => {
  const province = PAKISTAN_LOCATIONS.find((item) => item.code === provinceCode);
  const city = province?.cities.find((item) => item.code === cityCode
    || (cityCode && cityCode.startsWith(`${province.code}-`) && cityCode.endsWith(`-${slugify(item.name)}`)));
  if (countryCode && countryCode !== 'PK') return null;
  return province && city ? { countryCode: 'PK', province, city } : null;
};

const toLocationSnapshot = (location) => {
  const resolved = findLocation(location);
  if (!resolved) return null;
  return {
    countryCode: resolved.countryCode,
    countryName: 'Pakistan',
    provinceCode: resolved.province.code,
    provinceName: resolved.province.name,
    cityCode: resolved.city.code,
    cityName: resolved.city.name,
  };
};

const findCityInLocation = (location) => {
  const normalizedLocation = normalizeLocation(location);
  if (!normalizedLocation) return null;
  return PAKISTAN_CITIES.find((city) => normalizedLocation === normalizeLocation(city)) || null;
};

module.exports = { PAKISTAN_LOCATIONS, PAKISTAN_CITIES, findLocation, toLocationSnapshot, findCityInLocation };