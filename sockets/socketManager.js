let sockets = {}; // Aquí se guardarán todos los sockets conectados

function registerSocket(socket) {
    sockets[socket.id] = socket;

    socket.on('disconnect', () => {
        delete sockets[socket.id];
        console.log(`Socket desconectado: ${socket.id}`);
    });
}

function getSockets() {
    return sockets;
}

module.exports = {
    registerSocket,
    getSockets
};
