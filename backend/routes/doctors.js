const express = require('express');
const { body } = require('express-validator');
const router   = express.Router();
const ctrl     = require('../controllers/doctorsController');
const validate = require('../middleware/validate');

const doctorRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('speciality').trim().notEmpty().withMessage('Speciality is required'),
  body('salary').isFloat({ gt: 0 }).withMessage('Salary must be a positive number'),
];

router.get('/',              ctrl.getAll);
router.get('/departments',   ctrl.getDepartments);
router.get('/:id/schedule',  ctrl.getSchedule);
router.post('/',             doctorRules, validate, ctrl.create);
router.put('/:id',           doctorRules, validate, ctrl.update);

module.exports = router;
