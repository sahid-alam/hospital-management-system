const express = require('express');
const { body } = require('express-validator');
const router   = express.Router();
const ctrl     = require('../controllers/billingController');
const validate = require('../middleware/validate');

const billRules = [
  body('patient_id').isInt({ gt: 0 }).withMessage('Valid patient_id required'),
  body('total_amount').isFloat({ min: 0 }).withMessage('total_amount must be >= 0'),
];

const payRules = [
  body('paid_amount').isFloat({ gt: 0 }).withMessage('paid_amount must be > 0'),
  body('payment_mode').isIn(['Cash', 'Card', 'UPI', 'Insurance'])
    .withMessage('payment_mode must be Cash, Card, UPI, or Insurance'),
];

router.get('/',          ctrl.getAll);
router.get('/revenue',   ctrl.getRevenue);
router.post('/',         billRules, validate, ctrl.create);
router.patch('/:id/pay', payRules, validate, ctrl.recordPayment);

module.exports = router;
