const Configuracion = require('../models/Configuracion');

module.exports = {
  async mostrarFormulario(req, res) {
    const config = await Configuracion.obtener();
    res.render('admin/configuracion', { title: 'Configuración', config, mensaje: null });
  },

  async actualizar(req, res) {
    const { whatsapp } = req.body;
    await Configuracion.actualizar(whatsapp);
    const config = await Configuracion.obtener();
    res.render('admin/configuracion', { title: 'Configuración', config, mensaje: 'Guardado correctamente ✅' });
  }
};