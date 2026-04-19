// generate-token.js (à la racine)
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { userId: 'test-user', role: 'client' },
  'super_secret_key_change_this_in_production_123456789',
  { expiresIn: '24h' }
);

console.log('Token à utiliser :', token);