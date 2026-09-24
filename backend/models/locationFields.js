const structuredLocationFields = {
  countryCode: { type: String, trim: true, default: '' },
  countryName: { type: String, trim: true, default: '' },
  provinceCode: { type: String, trim: true, default: '' },
  provinceName: { type: String, trim: true, default: '' },
  cityCode: { type: String, trim: true, default: '' },
  cityName: { type: String, trim: true, default: '' }
};

module.exports = structuredLocationFields;
