const express = require('express');
const router = express.Router();
const facturaController = require('../facturaController');

router.post('/pdf', facturaController.generarFacturaPDF);

module.exports = router;
