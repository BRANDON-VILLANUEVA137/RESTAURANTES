const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// 1. Crear el servidor HTTP a partir de Express
const server = http.createServer(app);


// -------------------------------------
// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------------
// Rutas
const loginRoutes = require('../controllers/routes/loginRoutes');
app.use('/login', loginRoutes);

const pedidoRoutes = require('../controllers/routes/pedidoRoutes');
app.use('/pedidos', pedidoRoutes);

const cajeroRoutes = require("../controllers/routes/cajeroRoutes");
app.use('/', cajeroRoutes);

const facturaRoutes = require('../controllers/routes/facturaRoutes');
app.use('/facturas', facturaRoutes);




// Página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'Login.html'));
});

// -------------------------------------
// Iniciar el servidor (rutas + sockets en uno)
const PORT = 3000;

const initWebSocket = require('../sockets/serverSocket');
initWebSocket(server); // ✅ ahora sí se usa el buen socketManager

server.listen(PORT, () => {
    console.log(` Servidor corriendo en http://localhost:${PORT}`);
});
