const EMAIL_RE = /^\S+@\S+\.\S+$/;

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);

// ---- Auth ----
const validateRegister = ({ name, email, password }) => {
  if (!isNonEmptyString(name)) return 'Name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  if (!isNonEmptyString(email) || !EMAIL_RE.test(email.trim()))
    return 'Please provide a valid email address';
  if (!isNonEmptyString(password)) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
};

const validateLogin = ({ email, password }) => {
  if (!isNonEmptyString(email) || !EMAIL_RE.test(email.trim()))
    return 'Please provide a valid email address';
  if (!isNonEmptyString(password)) return 'Password is required';
  return null;
};

// ---- Product ----
const validateProduct = (body) => {
  const errors = {};
  if (!isNonEmptyString(body.name)) errors.name = 'Product name is required';
  if (!isNonEmptyString(body.brand)) errors.brand = 'Brand is required';
  if (!isNonEmptyString(body.category)) errors.category = 'Category is required';
  if (!isFiniteNumber(Number(body.price)) || Number(body.price) < 0)
    errors.price = 'Price must be a number ≥ 0';
  if (body.originalPrice !== null && body.originalPrice !== undefined && body.originalPrice !== '') {
    if (!isFiniteNumber(Number(body.originalPrice)) || Number(body.originalPrice) < 0)
      errors.originalPrice = 'Original price must be a number ≥ 0';
    else if (Number(body.originalPrice) <= Number(body.price))
      errors.originalPrice = 'Original price must be greater than the selling price';
  }
  if (!isNonEmptyString(body.description)) errors.description = 'Description is required';
  if (!isFiniteNumber(Number(body.stock)) || Number(body.stock) < 0)
    errors.stock = 'Stock must be a number ≥ 0';
  if (body.rating !== undefined && body.rating !== null && body.rating !== '') {
    const r = Number(body.rating);
    if (!isFiniteNumber(r) || r < 0 || r > 5) errors.rating = 'Rating must be between 0 and 5';
  }
  if (body.images !== undefined && !Array.isArray(body.images))
    errors.images = 'Images must be an array of URL strings';
  if (body.specifications !== undefined && !Array.isArray(body.specifications))
    errors.specifications = 'Specifications must be an array of { label, value } objects';
  return Object.keys(errors).length ? errors : null;
};

// ---- Order ----
const REQUIRED_CUSTOMER_FIELDS = [
  ['fullName', 'Full name is required'],
  ['phone', 'Phone number is required'],
  ['addressLine', 'Address is required'],
  ['city', 'City is required'],
  ['state', 'State is required'],
  ['pincode', 'Pincode is required'],
];

const validateOrder = (body) => {
  const errors = {};
  for (const [field, message] of REQUIRED_CUSTOMER_FIELDS) {
    if (!isNonEmptyString(body.customer?.[field])) errors[field] = message;
  }
  if (body.customer?.phone && !/^[+\d][\d\s-]{6,15}$/.test(body.customer.phone.trim()))
    errors.phone = 'Please enter a valid phone number';
  if (body.customer?.pincode && !/^\d{4,10}$/.test(body.customer.pincode.trim()))
    errors.pincode = 'Please enter a valid pincode';
  if (!Array.isArray(body.items) || body.items.length === 0)
    errors.items = 'Order must contain at least one item';
  return Object.keys(errors).length ? errors : null;
};

module.exports = { validateRegister, validateLogin, validateProduct, validateOrder };
