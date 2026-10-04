const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verificarAdmin = require('../middleware/verificarAdmin');

router.get('/admin/login', authController.mostrarLogin);
router.post('/admin/login', authController.procesarLogin);
router.post('/admin/logout', authController.logout);

router.get('/admin/usuarios/crear', verificarAdmin, authController.mostrarFormularioCrearUsuario);
router.post('/admin/usuarios/crear', verificarAdmin, authController.crearUsuario);

router.get('/admin/cambiar-password', verificarAdmin, authController.mostrarCambiarPassword);
router.post('/admin/cambiar-password', verificarAdmin, authController.cambiarPassword);

module.exports = router;