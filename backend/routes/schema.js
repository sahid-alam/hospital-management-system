const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/schemaController');

router.get('/', ctrl.getSchema);

module.exports = router;
