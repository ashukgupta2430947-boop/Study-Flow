const bcrypt = require('bcryptjs');

const password = 'Ashuk@1234';
const hash = '$2b$10$UoEHsliJfTy4Kc8okPR08u8ocKe8T/bcioT6/qLw4JWEY2woHf8Qi';

bcrypt.compare(password, hash, (err, result) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Password Match:', result);
  }
});
