const Orden = require('../models/Orden');
const Numero = require('../models/Numero');
const db = require('../config/db');

const adminOrdenController = {
  async listarPendientes(req, res) {
    const ordenes = await Orden.listarPendientes();

    const [[{ pendientes }]] = await db.query(
      `SELECT COUNT(*) AS pendientes FROM ordenes WHERE estado = 'pendiente'`
    );

    res.render('admin/ordenes-pendientes', {
      title: 'Órdenes pendientes',
      ordenes,
      stats: { pendientes }
    });
  },

  async aprobar(req, res) {
    try {
      const { ordenId } = req.params;
      await Orden.actualizarEstado(ordenId, 'aprobado');
      await Numero.marcarVendidos(ordenId);
      res.redirect('/admin/ordenes');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error al aprobar la orden: ' + error.message);
    }
  },

  async rechazar(req, res) {
    try {
      const { ordenId } = req.params;
      await Orden.actualizarEstado(ordenId, 'rechazado');
      await Numero.liberar(ordenId);
      res.redirect('/admin/ordenes');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error al rechazar la orden: ' + error.message);
    }
  }
};

module.exports = adminOrdenController;