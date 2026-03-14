const { validationResult } = require('express-validator');

/** Collect express-validator errors and short-circuit */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

/** Global error handler – mount LAST in app */
const errorHandler = (err, req, res, _next) => {
  console.error('[ERROR]', err.stack || err.message);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large' });
  }
  if (err.message === 'Only JPG, PNG, WEBP, PDF files are allowed') {
    return res.status(400).json({ message: err.message });
  }

  const status  = err.statusCode || err.status || 500;
  const message = err.message    || 'Internal Server Error';
  res.status(status).json({ message });
};

module.exports = { validate, errorHandler };
