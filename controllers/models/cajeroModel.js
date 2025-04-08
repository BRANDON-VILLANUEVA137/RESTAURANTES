const db = require("../../config/db");

// Obtener todos los productos
exports.obtenerProductos = (callback) => {
    const query = "SELECT * FROM productos";
    db.query(query, callback);
};

// Agregar un nuevo producto
exports.agregarProducto = (nombre, tipo, precio, stock, callback) => {
    const query = "INSERT INTO productos (nombre, tipo, precio, stock) VALUES (?, ?, ?, ?)";
    db.query(query, [nombre, tipo, precio, stock], callback);
};

// Eliminar producto
exports.eliminarProducto = (id, callback) => {
    const query = "DELETE FROM productos WHERE id_producto = ?";
    db.query(query, [id], callback);
};

// Insertar factura
exports.generarFactura = (id_pedido, metodo_pago, total, callback) => {
    const query = "INSERT INTO facturas (id_pedido, metodo_pago, total) VALUES (?, ?, ?)";
    db.query(query, [id_pedido, metodo_pago, total], callback);
};

// Obtener facturas (por fecha si se pasa)
exports.obtenerFacturas = (fecha, callback) => {
    let query = "SELECT * FROM facturas";
    const params = [];

    if (fecha) {
        query += " WHERE DATE(fecha_hora) = ?";
        params.push(fecha);
    }

    db.query(query, params, callback);
};

exports.actualizarEstadoProducto = (id, columna, valor, callback) => {
    const query = `UPDATE productos SET ${columna} = ? WHERE id_producto = ?`;
    db.query(query, [valor, id], callback);
};