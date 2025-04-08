const { Server } = require("socket.io");
const { registerSocket } = require("../sockets/socketManager");

function initWebSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
            methods: ["GET", "POST", "PUT"]
        }
    });

    io.on('connection', (socket) => {
        console.log('🔌 Cliente conectado:', socket.id);
        registerSocket(socket); //  Aquí es donde se guarda en socketManager
    });
}

module.exports = initWebSocket;
