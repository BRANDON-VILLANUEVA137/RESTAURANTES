
document.addEventListener("DOMContentLoaded", async () => {
    const pedidosContainer = document.getElementById("pedidos-container");
    const socket = io("http://localhost:3000");


    async function cargarPedidos() {
        pedidosContainer.innerHTML = ""; // Limpiar antes de recargar
        try {
            const response = await fetch("http://localhost:3000/pedidos/cocinero");
            const pedidos = await response.json();
            
            console.log("Pedidos cargados:", pedidos);

            pedidos.forEach(pedido => {
                if (pedido.estado !== "listo") {
                    const pedidoDiv = document.createElement("div");
                    pedidoDiv.classList.add("pedido");

                    let productosHtml = "";

                    productosHtml = `
                    <ul>
                        ${(pedido.productos || []).map(producto => `
                            <li><strong>Producto ID:</strong> ${producto.id_producto}</li>
                            <li><strong>Nombre:</strong> ${producto.nombre}</li>
                            <li><strong>Precio:</strong> $${producto.precio}</li>
                        `).join('')}
                    </ul>
                `;
                
                    pedidoDiv.innerHTML = `
                        <p><strong>Mesa ${pedido.id_mesa}</strong></p>
                        <p>Detalles ${pedido.descripcion}</p>
                        <p><strong>Estado:</strong> ${pedido.estado}</p>
                        <p><strong>Total:</strong> $${pedido.total}</p>
                        ${productosHtml}
                        <button onclick="actualizarEstado(${pedido.id_pedido}, 'En proceso')">En Proceso</button>
                        <button onclick="actualizarEstado(${pedido.id_pedido}, 'Finalizado')">Finalizado</button>
                    `;

                    pedidosContainer.appendChild(pedidoDiv);
                }
            });
        } catch (error) {
            console.error("Error cargando pedidos:", error);
        }
    }

    window.actualizarEstado = async (id, estado) => {
        console.log("Intentando actualizar pedido:", id, estado);

        if (estado === "Finalizado") {
            estado = "listo"; 
        }

        if (!id || !estado) {
            console.error("Error: ID o estado inválidos", { id, estado });
            alert("Error: ID o estado inválidos.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/pedidos/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ estado })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Error en la actualización:", data);
                alert("Error al actualizar el pedido: " + (data.error || "Error desconocido"));
                return;
            }

            alert(data.message);
            cargarPedidos();


            // Si el estado es 'listo', emitir el mensaje a través de WebSocket
            if (estado === "listo") {
                
                socket.emit("mensaje_cocinero", `El pedido ${id} está listo. ¡Por favor, recójalo!`);
            }
        } catch (error) {
            console.error("Error en la solicitud:", error);
            alert("Error en la solicitud al servidor.");
        }
    };

    cargarPedidos();
});
