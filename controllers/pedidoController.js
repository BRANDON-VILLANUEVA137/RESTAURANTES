const Pedido = require('./models/pedidoModel'); 
const { getSockets } = require('../sockets/socketManager');
const db = require('../config/db');


exports.obtenerProductos = (req, res) => {
  Pedido.obtenerCartaYMenu((err, data) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(data); // ← devolverá { carta: [...], menuDia: [...] }
  });
};
//--------------------------------------------------------------------------------------------------------------------------------

exports.obtenerPedidosPorMesa = (req, res) => {
  const { id_mesa } = req.params;

  console.log("Mesa recibida en el controlador:", id_mesa);

  db.query('SELECT * FROM pedidos WHERE id_mesa = ?', [id_mesa], (err, results) => {
      if (err) {
          console.error("❌ Error al consultar la base de datos:", err);
          return res.status(500).json({ error: "Error al obtener los pedidos" });
      }

      const pedidos = results.map(pedido => {
          let productos = pedido.productos;

          // ✅ Solo parseamos si es string
          if (typeof productos === 'string') {
              try {
                  productos = JSON.parse(productos);
              } catch (e) {
                  console.error("❌ Error al parsear productos:", productos);
                  productos = [];
              }
          }

          return {
              id_pedido: pedido.id_pedido,
              id_mesa: pedido.id_mesa,
              estado: pedido.estado,
              total: pedido.total,
              fecha_hora: pedido.fecha_hora,
              descripcion: pedido.descripcion,
              productos: productos
          };
      });

      res.json(pedidos);
  });
};
//--------------------------------------------------------------------------------------------------------------------------------


exports.crearPedido = (req, res) => {
  const pedido = req.body;
  Pedido.crearPedido(pedido, (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al crear el pedido' });
    res.json({ message: 'Pedido creado con éxito', id: result.insertId });
  });
};
//--------------------------------------------------------------------------------------------------------------------------------

exports.editarPedido = (req, res) => {
  const id = req.params.id;
  const { descripcion, total } = req.body;
  Pedido.editarPedido(id, descripcion, total, (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar' });
    res.json({ message: 'Pedido actualizado correctamente' });
  });
};
//--------------------------------------------------------------------------------------------------------------------------------

exports.eliminarPedido = (req, res) => {
  const id = req.params.id;
  Pedido.eliminarPedido(id, (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar' });
    res.json({ message: 'Pedido eliminado con éxito' });
  });
};
//--------------------------------------------------------------------------------------------------------------------------------

exports.listarPedidosCocinero = (req, res) => {
  Pedido.listarPedidosCocinero((err, pedidos) => {
      if (err) {
          console.error("Error al obtener pedidos para cocinero:", err);
          return res.status(500).json({ error: "Error al obtener pedidos" });
      }

      res.json(pedidos);
  });
};

//--------------------------------------------------------------------------------------------------------------------------------

exports.actualizarEstadoPedido = (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!estado) {
      return res.status(400).json({ error: "El estado es requerido" });
  }

  db.query('SELECT * FROM pedidos WHERE id_pedido = ?', [id], (err, results) => {
      if (err) return res.status(500).json({ error: "Error en la base de datos" });
      if (results.length === 0) return res.status(404).json({ error: "Pedido no encontrado" });

      db.query('UPDATE pedidos SET estado = ? WHERE id_pedido = ?', [estado, id], (err) => {
          if (err) return res.status(500).json({ error: err.message });

          if (estado === "listo") {
              const sockets = getSockets(); // función en socketManager.js
              const mesa = results[0].id_mesa;
              const mensaje = `El pedido para la mesa ${mesa} está listo`;

              for (let socketId in sockets) {
                  sockets[socketId].emit('mensaje_cocinero', mensaje);
              }
          }

          res.json({ message: "Estado del pedido actualizado con éxito" });
      });
  });
};
//--------------------------------------------------------------------------------------------------------------------------------
