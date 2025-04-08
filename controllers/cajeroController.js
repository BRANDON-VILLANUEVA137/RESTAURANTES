const db = require('../config/db');

const cajeroModel = require("../controllers/models/cajeroModel");

// Obtener productos
exports.getProductos = (req, res) => {
    cajeroModel.obtenerProductos((err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// Agregar producto
exports.postProducto = (req, res) => {
    const { nombre, tipo, precio, stock } = req.body;
    cajeroModel.agregarProducto(nombre, tipo, precio, stock, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Producto agregado con éxito", id: result.insertId });
    });
};

// Eliminar producto
exports.deleteProducto = (req, res) => {
    const { id } = req.params;
    cajeroModel.eliminarProducto(id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Producto eliminado con éxito" });
    });
};

// Generar factura
exports.postFactura = (req, res) => {
    const { id_pedido, metodo_pago, total } = req.body;
    cajeroModel.generarFactura(id_pedido, metodo_pago, total, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        const facturaXML = `<?xml version="1.0" encoding="UTF-8"?>
<factura>
    <id_pedido>${id_pedido}</id_pedido>
    <metodo_pago>${metodo_pago}</metodo_pago>
    <total>${total}</total>
    <id_factura>${result.insertId}</id_factura>
</factura>`;

        res.setHeader("Content-Type", "application/xml");
        res.send(facturaXML);
    });
};


exports.getPedidos = (req, res) => {
    db.query("SELECT * FROM pedidos", async (error, resultados) => {
        if (error) {
            console.error("Error al obtener pedidos:", error);
            return res.status(500).json({ error: "Error al obtener los pedidos." });
        }

        const pedidos = await Promise.all(resultados.map(async pedido => {
            let productosPedido = [];
        
            // ✅ Detecta si ya es objeto o si es un string JSON
            if (typeof pedido.productos === "string") {
                try {
                    productosPedido = JSON.parse(pedido.productos);
                } catch (err) {
                    console.error("❌ Error al parsear productos:", err);
                    productosPedido = []; // por si falla el parseo
                }
            } else if (Array.isArray(pedido.productos)) {
                productosPedido = pedido.productos;
            }
        
            // Obtener información detallada de cada producto
            const productosDetallados = await Promise.all(productosPedido.map(async prod => {
                return new Promise((resolve, reject) => {
                    db.query("SELECT nombre, precio FROM productos WHERE id_producto = ?", [prod.id_producto], (err, rows) => {
                        if (err || rows.length === 0) return resolve({ ...prod, nombre: "Desconocido", precio: 0 });
                        resolve({
                            ...prod,
                            nombre: rows[0].nombre,
                            precio: rows[0].precio
                        });
                    });
                });
            }));
        
            return {
                id_pedido: pedido.id_pedido,
                id_mesa: pedido.id_mesa,
                productos: productosDetallados,
                estado: pedido.estado,
                total: pedido.total
            };
        }));
        
        res.json(pedidos);
    });
};


// Obtener facturas
exports.getFacturas = (req, res) => {
    const { fecha } = req.query;
    cajeroModel.obtenerFacturas(fecha, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.mostrarCaja = (req, res) => {
    res.sendFile(path.join(__dirname, '../../views/Caja.html'));
};

// Cambiar estado de producto (activo_carta o menu_dia)
exports.actualizarEstadoProducto = (req, res) => {
    const { id } = req.params;
    const { columna, valor } = req.body;

    if (!['activo_carta', 'menu_dia'].includes(columna)) {
        return res.status(400).json({ error: "Columna inválida" });
    }

    cajeroModel.actualizarEstadoProducto(id, columna, valor, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Estado actualizado correctamente" });
    });
};
