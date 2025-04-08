// models/pedidoModel.js
const db = require('../../config/db');

const Pedido = {
    obtenerProductos: (callback) => {
        const sql = 'SELECT id_producto, nombre, precio, stock FROM restaurante.productos'; 
        db.query(sql, callback);
    },

    obtenerPedidosPorMesa: (mesa, callback) => {
        const sql = 'SELECT * FROM pedidos WHERE id_mesa = ?';
        db.query(sql, [mesa], callback);
    },

    obtenerCartaYMenu: (callback) => {
        const sql = 'SELECT id_producto, nombre, precio, stock, activo_carta, menu_dia FROM productos WHERE stock > 0';
    
        db.query(sql, (err, results) => {
            if (err) return callback(err);
    
            const carta = results.filter(p => p.activo_carta === 1);
            const menuDia = results.filter(p => p.menu_dia === 1);
    
            callback(null, { carta, menuDia });
        });
    },
    
    crearPedido: (pedido, callback) => {
        const { id_mesa, total, descripcion, productos } = pedido;
        const productosJson = JSON.stringify(productos);
    
        const sql = 'INSERT INTO pedidos (id_mesa, total, descripcion, productos) VALUES (?, ?, ?, ?)';
        db.query(sql, [id_mesa, total, descripcion, productosJson], (err, result) => {
            if (err) return callback(err);
    
            //  Restar stock para cada producto 
            productos.forEach(producto => {
                const { id_producto, cantidad } = producto;
    
                const sqlUpdateStock = 'UPDATE productos SET stock = stock - ? WHERE id_producto = ?';
                db.query(sqlUpdateStock, [cantidad || 1, id_producto], (err) => {
                    if (err) console.error(`Error actualizando stock del producto ${id_producto}:`, err);
                });
            });
    
            // Fin del proceso
            callback(null, result);
        });
    },
    

    editarPedido: (id, descripcion, total, callback) => {
        const sql = 'UPDATE pedidos SET descripcion = ?, total = ? WHERE id_pedido = ?';
        db.query(sql, [descripcion, total, id], callback);
    },

    eliminarPedido: (id, callback) => {
        db.query('DELETE FROM pedidos WHERE id_pedido = ?', [id], callback);
    },

    listarPedidosCocinero: async (callback) => {
        try {
            const [results] = await db.promise().query(`
                SELECT id_pedido, id_mesa, descripcion, estado, total, productos 
                FROM pedidos 
                WHERE estado != 'listo'
                ORDER BY id_pedido DESC
            `);
    
            const pedidosProcesados = [];
    
            for (let pedido of results) {
                let productosParsed;
    
                try {
                    productosParsed = JSON.parse(pedido.productos || '[]');
                } catch (e) {
                    productosParsed = [];
                }
    
                const productosConInfo = await Promise.all(
                    productosParsed.map(prod => {
                        return db.promise().query(
                            'SELECT id_producto, nombre, precio FROM productos WHERE id_producto = ?',
                            [prod.id_producto]
                        ).then(([rows]) => rows[0]).catch(() => null);
                    })
                );
    
                pedidosProcesados.push({
                    id_pedido: pedido.id_pedido,
                    id_mesa: pedido.id_mesa,
                    descripcion: pedido.descripcion,
                    estado: pedido.estado,
                    total: pedido.total,
                    productos: productosConInfo.filter(p => p !== null)
                });
            }
    
            callback(null, pedidosProcesados);
    
        } catch (err) {
            console.error("❌ Error en listarPedidosCocinero:", err);
            callback(err);
        }
    }
    


};

module.exports = Pedido;
