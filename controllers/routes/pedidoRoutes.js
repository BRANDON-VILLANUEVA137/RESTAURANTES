const express = require('express');
const router = express.Router();
const pedidoController = require('../pedidoController');

router.get('/productos', pedidoController.obtenerProductos); // más claro
router.get("/mesa/:id_mesa", pedidoController.obtenerPedidosPorMesa);
router.post("/", pedidoController.crearPedido);
router.put('/editar/:id', pedidoController.editarPedido);
router.delete('/eliminar/:id', pedidoController.eliminarPedido);
router.get('/cocinero', pedidoController.listarPedidosCocinero); // ✅ la nueva ruta
router.put('/:id', pedidoController.actualizarEstadoPedido); 

module.exports = router;
