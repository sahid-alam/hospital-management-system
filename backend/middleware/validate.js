const { validationResult } = require('express-validator');

// Run after a chain of express-validator checks; short-circuits with 422 on failure
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

module.exports = validate;
