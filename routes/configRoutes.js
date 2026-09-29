const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const verificarAdmin = require('../middleware/verificarAdmin');

router.get('/admin/configuracion', verificarAdmin, configController.mostrarFormulario);
router.post('/admin/configuracion', verificarAdmin, configController.actualizar);

module.exports = router;