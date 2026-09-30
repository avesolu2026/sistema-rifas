const crypto = require('crypto');
const Rifa = require('../models/Rifa');
const Comprador = require('../models/Comprador');
const Orden = require('../models/Orden');
const Numero = require('../models/Numero');

// Verifica que el webhook de verdad venga de Wompi (no de un tercero malicioso)
function verificarFirmaWebhook(payload, eventsSecret) {
  const { signature, timestamp, data } = payload;
  let cadena = '';

  signature.properties.forEach(prop => {
    const partes = prop.split('.');
    let valor = data;
    partes.forEach(p => { valor = valor[p]; });
    cadena += valor;
  });

  cadena += timestamp;
  cadena += eventsSecret;

  const checksumCalculado = crypto.createHash('sha256').update(cadena).digest('hex').toUpperCase();
  return checksumCalculado === signature.checksum.toUpperCase();
}

const compraController = {
  // Muestra el formulario de compra
  async mostrarFormulario(req, res) {
    const rifaId = req.params.id;
    const cantidad = req.query.cantidad || '';

    const rifa = await Rifa.obtenerPorId(rifaId);
    if (!rifa) return res.status(404).send('Rifa no encontrada');

    res.render('comprar', {
      title: 'Completa tu compra',
      rifa,
      cantidad
    });
  },

  // Procesa el formulario: crea comprador, orden, y asigna números
  async procesarCompra(req, res) {
    try {
      const rifaId = req.params.id;
      const { nombre, telefono, correo, ciudad, cantidad } = req.body;

      const rifa = await Rifa.obtenerPorId(rifaId);
      if (!rifa) return res.status(404).send('Rifa no encontrada');

      const cantidadNum = parseInt(cantidad);
      if (!cantidadNum || cantidadNum < 1) {
        return res.status(400).send('Cantidad inválida');
      }

      const valorTotal = cantidadNum * rifa.precio_numero;

      const compradorId = await Comprador.crear({ nombre, telefono, correo, ciudad });

      const ordenId = await Orden.crear({
        rifa_id: rifaId,
        comprador_id: compradorId,
        cantidad_numeros: cantidadNum,
        valor_total: valorTotal
      });

      await Numero.asignarAleatorios(rifaId, cantidadNum, ordenId);

      res.redirect(`/comprar/${rifaId}/confirmar/${ordenId}`);

    } catch (error) {
      console.error(error);
      res.status(500).send('Error al procesar la compra: ' + error.message);
    }
  },

  // Muestra los números asignados + botón de pago con Wompi
  async mostrarConfirmacion(req, res) {
    const { id: rifaId, ordenId } = req.params;

    const rifa = await Rifa.obtenerPorId(rifaId);
    const orden = await Orden.obtenerConComprador(ordenId);
    const numeros = await Numero.obtenerPorOrden(ordenId);

    const referencia = `orden-${orden.id}`;
    const montoEnCentavos = Math.round(Number(orden.valor_total) * 100);
    const moneda = 'COP';
    const secreto = (process.env.WOMPI_INTEGRITY_SECRET || '').trim();

    const cadenaConcatenada = `${referencia}${montoEnCentavos}${moneda}${secreto}`;
    const firmaIntegridad = crypto
      .createHash('sha256')
      .update(cadenaConcatenada)
      .digest('hex');

    // --- Diagnóstico temporal (no imprime el secreto) ---
    console.log('DEBUG INTEGRIDAD:', {
      referencia,
      montoEnCentavos,
      moneda,
      valorTotalOriginal: orden.valor_total,
      tipoValorTotal: typeof orden.valor_total,
      largoSecreto: secreto ? secreto.length : null,
      inicioSecreto: secreto ? secreto.slice(0, 15) : null,
      tieneEspaciosOComillas: secreto ? (secreto !== secreto.trim() || /["'\s]/.test(secreto)) : null,
      inicioLlavePublica: process.env.WOMPI_PUBLIC_KEY ? process.env.WOMPI_PUBLIC_KEY.slice(0, 9) : null,
      largoLlavePublica: process.env.WOMPI_PUBLIC_KEY ? process.env.WOMPI_PUBLIC_KEY.length : null
    });

    // URL a la que Wompi devuelve al comprador después de pagar
    const redirectUrl = `${req.protocol}://${req.get('host')}/comprar/${rifaId}/confirmar/${ordenId}`;

    res.render('confirmar-pago', {
      title: 'Confirma tu pago',
      rifa,
      orden,
      numeros,
      referencia,
      montoEnCentavos,
      firmaIntegridad,
      wompiPublicKey: process.env.WOMPI_PUBLIC_KEY,
      redirectUrl
    });
  },

  // Wompi llama aquí automáticamente cuando el pago cambia de estado
  async webhookWompi(req, res) {
    try {
      const payload = req.body;

      console.log('Webhook Wompi recibido:', payload.event, payload.data?.transaction?.reference, payload.data?.transaction?.status);

      // Verificar que el webhook sea legítimo
      const esValido = verificarFirmaWebhook(payload, (process.env.WOMPI_EVENTS_SECRET || '').trim());
      if (!esValido) {
        console.warn('Webhook de Wompi con firma inválida, ignorado.');
        return res.status(400).send('Firma inválida');
      }

      const transaccion = payload.data.transaction;
      const referencia = transaccion.reference; // ej: "orden-15"
      const ordenId = referencia.replace('orden-', '');
      const estado = transaccion.status; // APPROVED, DECLINED, VOIDED, ERROR

      if (estado === 'APPROVED') {
        await Orden.actualizarEstado(ordenId, 'aprobado');
        await Numero.marcarVendidos(ordenId);
      } else if (estado === 'DECLINED' || estado === 'VOIDED' || estado === 'ERROR') {
        await Orden.actualizarEstado(ordenId, 'rechazado');
        await Numero.liberar(ordenId);
      }

      // Wompi solo necesita un 200 para saber que recibiste el aviso
      res.status(200).send('OK');

    } catch (error) {
      console.error('Error en webhook de Wompi:', error);
      res.status(500).send('Error procesando webhook');
    }
  }
};

module.exports = compraController;