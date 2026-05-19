const express = require('express');
const { body } = require('express-validator');
const router   = express.Router();
const ctrl     = require('../controllers/wardsController');
const validate = require('../middleware/validate');

const admitRules = [
  body('patient_id').isInt({ gt: 0 }).withMessage('Valid patient_id required'),
  body('ward_id').isInt({ gt: 0 }).withMessage('Valid ward_id required'),
];

router.get('/',                ctrl.getAll);
router.get('/admissions',      ctrl.getActiveAdmissions);
router.post('/admit',          admitRules, validate, ctrl.admit);
router.patch('/discharge/:id', ctrl.discharge);

module.exports = router;
