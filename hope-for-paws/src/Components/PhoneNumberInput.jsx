import { COUNTRY_CODES } from '../utils/constants';

const COUNTRY_PHONE_RULES = {
  '+92': { min: 10, max: 10, label: 'Pakistan' },
  '+1': { min: 10, max: 10, label: 'US/Canada' },
  '+44': { min: 10, max: 10, label: 'United Kingdom' },
  '+91': { min: 10, max: 10, label: 'India' }
};

export const validatePhone = (phoneNumber, countryCode, required = true) => {
  if ((!phoneNumber || !countryCode) && required) return 'Phone number is required';
  if (!phoneNumber || !countryCode) return '';
  if (!/^\d+$/.test(phoneNumber)) return 'Phone number must contain digits only';

  const rule = COUNTRY_PHONE_RULES[countryCode];
  if (rule && (phoneNumber.length < rule.min || phoneNumber.length > rule.max)) {
    if (rule.min === rule.max) {
      return `${rule.label} numbers must be exactly ${rule.min} digits after ${countryCode}`;
    }
    return `${rule.label} numbers must be ${rule.min}-${rule.max} digits after ${countryCode}`;
  }

  const fullPhone = countryCode + phoneNumber;
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  if (!phoneRegex.test(fullPhone)) return 'Please enter a valid phone number';
  if (phoneNumber.length < 7 || phoneNumber.length > 15) return 'Phone number must be between 7-15 digits';
  return '';
};

export const normalizePhonePart = (value) => {
  let phone = value || '';
  if (phone.startsWith('0')) phone = phone.substring(1);
  return phone;
};

export const getFullPhoneNumber = (phone, countryCode) => countryCode + phone;

export const parsePhoneNumber = (fullPhone, defaultCountryCode = '+92') => {
  const phoneString = String(fullPhone || '');
  const matchingCountry = [...COUNTRY_CODES]
    .sort((a, b) => b.code.length - a.code.length)
    .find((country) => phoneString.startsWith(country.code));

  if (!matchingCountry) {
    return { phone: phoneString, countryCode: defaultCountryCode };
  }

  return {
    phone: phoneString.substring(matchingCountry.code.length),
    countryCode: matchingCountry.code
  };
};

const PhoneNumberInput = ({
  phone,
  countryCode,
  onChange,
  onBlur,
  error,
  touched,
  label = 'Phone Number',
  required = false,
  id = 'phone',
  className = '',
  disabled = false
}) => {
  const handlePhoneChange = (event) => {
    const nextPhone = normalizePhonePart(event.target.value);
    onChange({
      phone: nextPhone,
      countryCode,
      error: validatePhone(nextPhone, countryCode, required)
    });
  };

  const handleCountryCodeChange = (event) => {
    const nextCountryCode = event.target.value;
    const nextPhone = normalizePhonePart(phone);
    onChange({
      phone: nextPhone,
      countryCode: nextCountryCode,
      error: validatePhone(nextPhone, nextCountryCode, required)
    });
  };

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[#4E3B31] mb-1">
          {label}{required ? ' *' : ''}
        </label>
      )}
      <div className="flex gap-2">
        <select
          value={countryCode}
          onChange={handleCountryCodeChange}
          disabled={disabled}
          className="px-3 py-2 border border-[#a07855] text-[#4E3B31] rounded-md focus:outline-none focus:ring-1 focus:ring-[#6b493d] focus:border-[#6b493d] sm:text-sm min-w-[120px]"
          aria-label="Country code"
        >
          {COUNTRY_CODES.map((country, index) => (
            <option key={`${country.code}-${index}`} value={country.code}>
              {country.flag} {country.code}
            </option>
          ))}
        </select>
        <input
          id={id}
          name="phone"
          type="tel"
          required={required}
          value={phone}
          onChange={handlePhoneChange}
          onBlur={onBlur}
          disabled={disabled}
          className={`min-w-0 flex-1 px-3 py-2 border ${touched && error ? 'border-red-500' : 'border-[#a07855]'} text-[#4E3B31] rounded-md focus:outline-none focus:ring-1 focus:ring-[#6b493d] focus:border-[#6b493d] sm:text-sm`}
          placeholder="XXXXXXXXXX"
          aria-invalid={touched && Boolean(error)}
        />
      </div>
      {touched && error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};

export default PhoneNumberInput;