const express = require('express');
const router = express.Router();
const vendedorController = require('../controllers/vendedorController');
const verificarAdmin = require('../middleware/verificarAdmin');

router.get('/admin/rifas/:id/vendedores', verificarAdmin, vendedorController.mostrar);
router.post('/admin/rifas/:id/vendedores/crear', verificarAdmin, vendedorController.crear);
router.post('/admin/rifas/:id/vendedores/:vid/estado', verificarAdmin, vendedorController.cambiarEstado);

module.exports = router;