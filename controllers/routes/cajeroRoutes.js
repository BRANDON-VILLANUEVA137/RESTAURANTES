const express = require("express");
const router = express.Router();

const cajeroController = require("../cajeroController");

// Ruta para obtener productos
router.get("/productos", cajeroController.getProductos);

// Ruta para agregar producto
router.post("/productos", cajeroController.postProducto);

// Ruta para eliminar producto
router.delete("/productos/:id", cajeroController.deleteProducto);

// Ruta para obtener pedidos
router.get("/pedidos", cajeroController.getPedidos);

// Ruta para facturas
router.get('/caja', cajeroController.mostrarCaja)

// Ruta para generar factura
router.post("/facturas", cajeroController.postFactura);
router.get('/facturas', cajeroController.getFacturas);

// Ruta para cambiar tipo de menun o carta
router.put('/productos/:id/estado', cajeroController.actualizarEstadoProducto);


module.exports = router;
