const express = require ('express');
const router = express.Router();
const loginController = require('../loginController');


router.post('/', loginController.verificarLogin);
module.exports = router;