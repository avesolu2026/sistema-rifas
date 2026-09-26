const express = require('express');
const router = express.Router();
const adminOrdenController = require('../controllers/adminOrdenController');
const verificarAdmin = require('../middleware/verificarAdmin');

router.get('/admin/ordenes', verificarAdmin, adminOrdenController.listarPendientes);
router.post('/admin/ordenes/:ordenId/aprobar', verificarAdmin, adminOrdenController.aprobar);
router.post('/admin/ordenes/:ordenId/rechazar', verificarAdmin, adminOrdenController.rechazar);

module.exports = router;