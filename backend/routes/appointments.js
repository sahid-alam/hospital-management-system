const express = require('express');
const { body } = require('express-validator');
const router   = express.Router();
const ctrl     = require('../controllers/appointmentsController');
const validate = require('../middleware/validate');

const bookRules = [
  body('patient_id').isInt({ gt: 0 }).withMessage('Valid patient_id required'),
  body('doctor_id').isInt({ gt: 0 }).withMessage('Valid doctor_id required'),
  body('appt_date').isDate().withMessage('Valid appointment date required'),
  body('appt_time').matches(/^\d{2}:\d{2}$/).withMessage('Time must be HH:MM'),
];

router.get('/stats',   ctrl.getStats);
router.get('/',        ctrl.getAll);
router.get('/today',   ctrl.getToday);
router.post('/',       bookRules, validate, ctrl.create);
router.patch('/:id',   ctrl.updateStatus);
router.delete('/:id',  ctrl.cancel);

module.exports = router;
