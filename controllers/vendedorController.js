const Rifa = require('../models/Rifa');
const Vendedor = require('../models/Vendedor');

const vendedorController = {
  async mostrar(req, res) {
    const rifa = await Rifa.obtenerPorId(req.params.id);
    if (!rifa) return res.status(404).send('Rifa no encontrada');

    const vendedores = await Vendedor.listarConResumen(rifa.id);
    const base = `${req.protocol}://${req.get('host')}/venta-numeros/${rifa.id}`;

    vendedores.forEach(v => {
      v.link = `${base}?v=${v.codigo}`;
      v.total = v.vendidos * Number(rifa.precio_numero);
    });

    res.render('admin/vendedores', {
      title: 'Vendedores — ' + rifa.titulo,
      rifa,
      vendedores,
      error: req.query.error || null
    });
  },

  async crear(req, res) {
    try {
      const rifaId = req.params.id;
      const rifa = await Rifa.obtenerPorId(rifaId);
      if (!rifa) return res.status(404).send('Rifa no encontrada');

      const nombre = (req.body.nombre || '').trim();
      const telefono = (req.body.telefono || '').trim();
      const color = /^#[0-9a-fA-F]{6}$/.test(req.body.color || '') ? req.body.color : '#8b5cf6';

      if (!nombre) {
        return res.redirect('/admin/rifas/' + rifaId + '/vendedores?error=' + encodeURIComponent('Escribe el nombre del vendedor'));
      }

      await Vendedor.crear({ rifa_id: rifaId, nombre, telefono, color });
      res.redirect('/admin/rifas/' + rifaId + '/vendedores');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error al crear el vendedor: ' + error.message);
    }
  },

  async cambiarEstado(req, res) {
    try {
      const rifaId = req.params.id;
      const vendedor = await Vendedor.obtenerPorId(req.params.vid);

      // Solo se puede cambiar un vendedor que pertenezca a esta rifa
      if (!vendedor || String(vendedor.rifa_id) !== String(rifaId)) {
        return res.status(404).send('Vendedor no encontrado');
      }

      await Vendedor.cambiarActivo(vendedor.id, !vendedor.activo);
      res.redirect('/admin/rifas/' + rifaId + '/vendedores');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error al cambiar el vendedor: ' + error.message);
    }
  }
};

module.exports = vendedorController;