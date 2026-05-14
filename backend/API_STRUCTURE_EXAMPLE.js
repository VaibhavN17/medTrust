// Example: /api/auth/login.js
// This shows how to structure backend routes for Vercel serverless functions

const express = require('express');
const router = express.Router();

// Import your controller
const { login, register } = require('../../backend/src/controllers/authController');

router.post('/', login);
router.post('/register', register);

module.exports = router;

/* 
IMPORTANT: 
1. Convert backend/src/server.js to use API routes in /api folder
2. Each route file should be a Vercel serverless function
3. Maximum execution time: 10 seconds (on Pro plan: 60 seconds)
4. Use stateless design (no in-memory sessions)

STRUCTURE:
/api/
  ├── auth/
  │   ├── login.js
  │   ├── register.js
  │   └── logout.js
  ├── campaigns/
  │   ├── index.js
  │   ├── [id].js
  │   └── create.js
  ├── donations/
  │   └── index.js
  └── middleware/
      └── auth.js
*/

