const express = require('express');
const { body } = require('express-validator');
const router   = express.Router();
const ctrl     = require('../controllers/patientsController');
const validate = require('../middleware/validate');

const patientRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('dob').isDate().withMessage('Valid date of birth required'),
  body('gender').isIn(['M', 'F', 'O']).withMessage('Gender must be M, F, or O'),
];

router.get('/stats',       ctrl.getStats);
router.get('/',            ctrl.getAll);
router.get('/:id',         ctrl.getById);
router.get('/:id/history', ctrl.getHistory);
router.post('/',           patientRules, validate, ctrl.create);
router.put('/:id',         patientRules, validate, ctrl.update);
router.delete('/:id',      ctrl.remove);

module.exports = router;
