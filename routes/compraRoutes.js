const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compraController');

router.get('/comprar/:id', compraController.mostrarFormulario);
router.post('/comprar/:id', compraController.procesarCompra);
router.get('/comprar/:id/confirmar/:ordenId', compraController.mostrarConfirmacion);

// Webhook de Wompi: aquí llega la confirmación automática del pago
router.post('/webhook/wompi', express.json(), compraController.webhookWompi);

module.exports = router;