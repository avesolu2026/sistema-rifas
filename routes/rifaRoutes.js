const express = require('express');
const router = express.Router();
const rifaController = require('../controllers/rifaController');
const upload = require('../config/multerConfig');
const publicController = require('../controllers/publicController');
const verificarAdmin = require('../middleware/verificarAdmin');

// Ruta pública
router.get('/venta-numeros/:id', publicController.mostrarRifa);
router.get('/terminos', publicController.mostrarTerminos);
router.get('/numeros/:id', publicController.mostrarBusqueda);
router.post('/numeros/:id', publicController.procesarBusqueda);

// Panel admin
router.get('/admin/rifas', verificarAdmin, rifaController.listarRifas);
router.get('/admin/rifas/crear', verificarAdmin, rifaController.mostrarFormularioCrear);
router.get('/admin/rifas/:id/estadisticas', verificarAdmin, rifaController.mostrarEstadisticas);
router.get('/admin/rifas/:id/numeros', verificarAdmin, rifaController.mostrarNumeros);
router.post('/admin/rifas/:id/numeros/marcar', verificarAdmin, rifaController.marcarNumeros);
router.get('/admin/rifas/:id/exportar', verificarAdmin, rifaController.exportarExcel);
router.post('/admin/rifas/crear', verificarAdmin, upload.array('imagenes', 10), rifaController.crearRifa);
router.get('/admin/rifas/:id/editar', verificarAdmin, rifaController.mostrarFormularioEditar);
router.post('/admin/rifas/:id/editar', verificarAdmin, upload.array('imagenes', 10), rifaController.actualizarRifa);
router.post('/admin/rifas/:id/imagenes/eliminar', verificarAdmin, rifaController.eliminarImagen);
router.post('/admin/rifas/:id/eliminar', verificarAdmin, rifaController.eliminarRifa);

module.exports = router;