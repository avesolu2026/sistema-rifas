const Rifa = require('../models/Rifa');
const Numero = require('../models/Numero');
const Configuracion = require('../models/Configuracion');
const Vendedor = require('../models/Vendedor');

const publicController = {
  async mostrarRifa(req, res) {
    const rifaId = req.params.id;
    const rifa = await Rifa.obtenerPorId(rifaId);

    if (!rifa) {
      return res.status(404).send('Rifa no encontrada');
    }

    // Si entró por el link de un vendedor, recordamos quién fue (30 días)
    if (req.query.v) {
      try {
        const vendedor = await Vendedor.obtenerPorCodigo(rifaId, req.query.v);
        if (vendedor) {
          res.cookie('vend_' + rifaId, vendedor.codigo, {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: 'lax'
          });
        }
      } catch (error) {
        console.error('Error al leer el vendedor del link:', error);
      }
    }

    const disponibles = await Numero.contarDisponibles(rifaId);
    const vendidos = rifa.total_numeros - disponibles;
    const porcentajeVendido = ((vendidos / rifa.total_numeros) * 100).toFixed(2);

    const paquetesGuardados = rifa.paquetes ? JSON.parse(rifa.paquetes) : [];
    const cantidades = paquetesGuardados.length > 0
      ? paquetesGuardados
      : [10, 20, 30, 40, 50, 100, 200, 300, 500];

    const paquetes = cantidades
      .filter(c => c <= rifa.total_numeros)
      .map(c => ({
        cantidad: c,
        precio: (c * rifa.precio_numero).toLocaleString('es-CO')
      }));

    const config = await Configuracion.obtener();

    res.render('rifa-publica', {
      title: rifa.titulo,
      rifa,
      imagenes: JSON.parse(rifa.premio_imagenes || '[]'),
      porcentajeVendido,
      paquetes,
      whatsapp: config.whatsapp
    });
  },

  mostrarTerminos(req, res) {
    res.render('terminos', { title: 'Términos y Condiciones' });
  },

  async mostrarBusqueda(req, res) {
    const rifa = await Rifa.obtenerPorId(req.params.id);
    if (!rifa) return res.status(404).send('Rifa no encontrada');

    res.render('buscar-numeros', {
      title: 'Buscar tus números',
      rifa,
      numeros: null,
      correoBuscado: null
    });
  },

  async procesarBusqueda(req, res) {
    const rifa = await Rifa.obtenerPorId(req.params.id);
    if (!rifa) return res.status(404).send('Rifa no encontrada');

    const { correo } = req.body;
    const numeros = await Numero.buscarPorCorreo(rifa.id, correo);

    res.render('buscar-numeros', {
      title: 'Buscar tus números',
      rifa,
      numeros,
      correoBuscado: correo
    });
  }
};

module.exports = publicController;