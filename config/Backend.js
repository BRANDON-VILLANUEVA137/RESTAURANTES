const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const socketIo = require("socket.io");
const http = require('http');


const app = express();



// Crear servidor HTTP
const server = http.createServer(app);


const PORT = 3000;


app.use(cors());
app.use(express.json());


app.use(express.static('public')); // Sirve archivos estáticos como HTML, CSS, JS


const io = socketIo(server, {
    cors: {
        origin: "http://127.0.0.1:5501", // Permite solo este origen, ajusta si es necesario
        methods: ["GET", "POST"]
    }
});

// Usa CORS en el servidor para las peticiones HTTP si también es necesario
app.use(cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
    methods: ["GET", "POST", "PUT", "DELETE"]
}));

// Conexión de socket
let sockets = {}; // Objeto para almacenar las conexiones de los clientes

io.on('connection', (socket) => {
    console.log('Cliente conectado');
    
    // Guardar el socket en el objeto 'sockets'
    sockets[socket.id] = socket;

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
        // Eliminar el socket de la lista al desconectarse
        delete sockets[socket.id];
    });
});

server.listen(3001, () => {
    console.log('Servidor Socket.IO corriendo en puerto 3001');
});

// Configuración de la base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '2909Brandon', // Cambiar según la configuración
    database: 'restaurante'
});

db.connect(err => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
    } else {
        console.log('Conectado a la base de datos MySQL');
    }
});


// Obtener todos los productos
app.get('/productos', (req, res) => {
    db.query('SELECT * FROM productos', (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(results);
        }
    });
});

// Agregar un nuevo producto
app.post('/productos', (req, res) => {
    const { nombre, tipo, precio, stock } = req.body;
    const query = 'INSERT INTO productos (nombre, tipo, precio, stock) VALUES (?, ?, ?, ?)';
    db.query(query, [nombre, tipo, precio, stock], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Producto agregado con éxito', id: result.insertId });
        }
    });
});

// Actualizar un producto
app.put('/productos/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, tipo, precio, stock } = req.body;
    const query = 'UPDATE productos SET nombre = ?, tipo = ?, precio = ?, stock = ? WHERE id_producto = ?';
    db.query(query, [nombre, tipo, precio, stock, id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Producto actualizado con éxito' });
        }
    });
});

// Eliminar un producto
app.delete('/productos/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM productos WHERE id_producto = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Producto eliminado con éxito' });
        }
    });
});

// Obtener todos los pedidos
// Obtener todos los pedidos con productos detallados
app.get('/pedidos', (req, res) => {
    const query = 'SELECT * FROM pedidos';

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Parsear el campo productos
        const pedidosConDetalles = results.map(pedido => {
            try {
                if (typeof pedido.productos === 'string') {
                    pedido.productos = JSON.parse(pedido.productos);
                }
            } catch (e) {
                console.error('Error al parsear productos:', e);
            }
            return pedido;
        });

        // Extraemos los ids de los productos
        const productosIds = pedidosConDetalles
            .flatMap(pedido => pedido.productos)
            .map(prod => prod.id_producto);

        if (productosIds.length > 0) {
            // Consultamos los productos por los ids
            const productosQuery = 'SELECT * FROM productos WHERE id_producto IN (?)';

            db.query(productosQuery, [productosIds], (err, productos) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                // Asociamos los productos con los ids correspondientes
                pedidosConDetalles.forEach(pedido => {
                    pedido.productos = pedido.productos.map(prod => {
                        const productoDetalle = productos.find(p => p.id_producto === prod.id_producto);
                        return {
                            ...prod,
                            nombre: productoDetalle ? productoDetalle.nombre : 'Producto no encontrado',
                            precio: productoDetalle ? productoDetalle.precio : 0
                        };
                    });
                });

                // Devolvemos la respuesta solo después de completar ambas consultas
                res.json(pedidosConDetalles);
            });
        } else {
            // Si no hay productos, devolvemos los pedidos tal cual
            res.json(pedidosConDetalles);
        }
    });
});

// Crear un nuevo pedido
app.post('/pedidos', (req, res) => {
    console.log("Datos recibidos:", req.body); 

    let { id_mesa, total, descripcion, productos } = req.body; // Obtén los productos también

    if (!id_mesa || !total || !productos || productos.length === 0) {
        return res.status(400).json({ error: "Faltan datos en la solicitud" });
    }

    // Asegurar que total sea un número
    total = parseFloat(total);  
    if (isNaN(total)) {
        return res.status(400).json({ error: "El total debe ser un número válido" });
    }

    // Convertir productos a formato JSON
    const productosJson = JSON.stringify(productos);

    // Crear el pedido en la base de datos
    const query = 'INSERT INTO pedidos (id_mesa, total, descripcion, productos) VALUES (?, ?, ?, ?)';
    db.query(query, [id_mesa, total, descripcion, productosJson], (err, result) => {
        if (err) {
            console.error("Error al insertar pedido:", err);
            return res.status(500).json({ error: "Error en el servidor" });
        }

        const id_pedido = result.insertId;
        res.json({ message: 'Pedido creado con éxito', id: id_pedido });
    });
});



// Actualizar estado de un pedido
// Actualizar estado de un pedido
app.put('/pedidos/:id', (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
        return res.status(400).json({ error: "El estado es requerido" });
    }

    db.query('SELECT * FROM pedidos WHERE id_pedido = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Error en la base de datos" });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "Pedido no encontrado" });
        }

        // Si existe, actualizamos
        const query = 'UPDATE pedidos SET estado = ? WHERE id_pedido = ?';
        db.query(query, [estado, id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            db.query('SELECT * FROM pedidos WHERE estado = "listo"', (err, results) => {
                if (err) {
                    console.error(err);
                    return;
                }
            
                results.forEach(pedido => {
                    const mesa = pedido.id_mesa;
                    if (mesa) {
                        const mensaje = `El pedido para la mesa ${mesa} está listo`;
                        // Emitir el mensaje a todos los clientes conectados
                        for (let socketId in sockets) {
                            sockets[socketId].emit('mensaje_cocinero', mensaje);
                        }
                    }
                });
            });
            
            res.json({ message: "Estado del pedido actualizado con éxito" });
        });
    });
});


// Editar un pedido (cambiar descripción y total)
app.put('/pedidos/editar/:id', (req, res) => {
    const { id } = req.params;
    const { descripcion, total } = req.body;

    if (!descripcion || isNaN(parseFloat(total))) {
        return res.status(400).json({ error: "Datos inválidos para actualizar el pedido" });
    }

    // Solo permitir editar si el pedido no está en proceso
    const query = 'UPDATE pedidos SET descripcion = ?, total = ? WHERE id_pedido = ? AND estado != "En proceso"';

    db.query(query, [descripcion, total, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Error en la base de datos" });
        }

        if (result.affectedRows > 0) {
            res.json({ message: "Pedido actualizado correctamente" });
        } else {
            res.status(400).json({ error: "No se pudo actualizar el pedido. Asegúrate de que no está en proceso" });
        }
    });
});



// Eliminar un pedido
app.delete('/pedidos/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM pedidos WHERE id_pedido = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Pedido eliminado con éxito' });
        }
    });
});

// Generar factura
app.post('/facturas', (req, res) => {
    const { id_pedido, metodo_pago, total } = req.body;
    const query = 'INSERT INTO facturas (id_pedido, metodo_pago, total) VALUES (?, ?, ?)';

    db.query(query, [id_pedido, metodo_pago, total], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            const facturaXML = `<?xml version="1.0" encoding="UTF-8"?>
<factura>
    <id_pedido>${id_pedido}</id_pedido>
    <metodo_pago>${metodo_pago}</metodo_pago>
    <total>${total}</total>
    <id_factura>${result.insertId}</id_factura>
</factura>`;

            res.setHeader("Content-Type", "application/xml");
            res.send(facturaXML);
        }
    });
});


const accountSid = 'ACd78a0fe2840ddfb14b8801925f33ff5f';
const authToken = 'a0f54f7b585d0baf6c774070293e3c8d';
const client = require('twilio')(accountSid, authToken);

client.messages
    .create({
        body: 'Soy el restaurante, y gasto dinero para decir que son muy pobres',
        from: '+18583306724',  // Reemplaza con tu número de Twilio
        to: '+573212509640'    // Número de destino
    })
    .then(message => console.log('Mensaje enviado con SID:', message.sid))
    .catch(error => console.error('Error enviando mensaje:', error));


// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'grupouniversidad99@gmail.com',  // Reemplázalo con tu correo real
        pass: 'tqrb cwwh pihm ysrg'         // Usa la contraseña de aplicación de Google
    }
});

const mailOptions = {
    from: 'grupouniversidad99@gmail.com',
    to: 'bvillanueva@ucundinamarca.edu.co',  // Cambia esto por el correo del cliente
    subject: 'Factura del Restaurante',
    text: 'Aquí está tu factura por xml.'
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('Error enviando correo:', error);
    } else {
        console.log('Correo enviado:', info.response);
    }
});


/*

// Twilio Config
const accountSid = "ACd78a0fe2840ddfb14b8801925f33ff5f";
const authToken = "a0f54f7b585d0baf6c774070293e3c8d";
const twilioClient = twilio(accountSid, authToken);

// Nodemailer Config
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "grupouniversidad99@gmail.com",
        pass: "tqrb cwwh pihm ysrg"
    }
});

// Generar Factura
app.post("/facturas", (req, res) => {
    const { id_pedido, metodo_pago, total, telefono, correo } = req.body;

    if (!id_pedido || !metodo_pago || !total || !telefono || !correo) {
        return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    const query = "INSERT INTO facturas (id_pedido, metodo_pago, total) VALUES (?, ?, ?)";
    
    db.query(query, [id_pedido, metodo_pago, total], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const facturaXML = `<?xml version="1.0" encoding="UTF-8"?>
<factura>
    <id_pedido>${id_pedido}</id_pedido>
    <metodo_pago>${metodo_pago}</metodo_pago>
    <total>${total}</total>
    <id_factura>${result.insertId}</id_factura>
</factura>`;

        // Enviar SMS con Twilio
        twilioClient.messages
            .create({
                body: `Tu pedido (${id_pedido}) ha sido confirmado con pago en ${metodo_pago}. Total: $${total}.`,
                from: "+18583306724", 
                to: telefono
            })
            .then(message => console.log("SMS enviado con SID:", message.sid))
            .catch(error => console.error("Error enviando SMS:", error));

        // Enviar Correo con Nodemailer
        const mailOptions = {
            from: "grupouniversidad99@gmail.com",
            to: correo,
            subject: "Factura de tu pedido",
            text: `Adjunto encontrarás tu factura en formato XML. Gracias por tu compra.`,
            attachments: [{
                filename: `factura_${id_pedido}.xml`,
                content: facturaXML
            }]
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error enviando correo:", error);
            } else {
                console.log("Correo enviado:", info.response);
            }
        });

        res.setHeader("Content-Type", "application/xml");
        res.send(facturaXML);
    });
});

*/
// Obtener todas las facturas
app.get('/facturas', (req, res) => {
    db.query('SELECT * FROM facturas', (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(results);
        }
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});