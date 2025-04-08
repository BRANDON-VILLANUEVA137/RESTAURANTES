document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mesaNumero = urlParams.get("mesa");
    document.getElementById("mesa-numero").textContent = mesaNumero;
    console.log("🧠 Mesa obtenida de la URL:", mesaNumero);


    const menuDiv = document.getElementById("menu");
    const pedidoActualLista = document.getElementById("pedido-actual");
    const totalSpan = document.getElementById("total");
    const descripcionInto = document.getElementById("pedido-descripcion");
    
    
    let pedido = [];
    let total = 0;

    async function cargarMenu() {
        const res = await fetch('http://localhost:3000/pedidos/productos') // ✅ Llama al backend real

        const data = await res.json();
    
        const menuDiaDiv = document.getElementById("menuDia");
        const cartaDiv = document.getElementById("menu");
    
        if (data.menuDia.length === 0) {
            menuDiaDiv.textContent = "⚠️ No hay productos en el menú del día actualmente.";
        } else {
            data.menuDia.forEach(producto => {
                const btn = document.createElement("button");
                btn.textContent = `🍽️ ${producto.nombre} - $${producto.precio} - Stock: ${producto.stock}`;
                btn.onclick = () => agregarAlPedido(producto);
                menuDiaDiv.appendChild(btn);
            });
        }
        
        data.carta.forEach(producto => {
            const btn = document.createElement("button");
            btn.textContent = `📖 ${producto.nombre} - $${producto.precio} - Stock: ${producto.stock}`;
            btn.onclick = () => agregarAlPedido(producto);
            cartaDiv.appendChild(btn);
        });
        
    }

    async function cargarPedidosExistentes() {
        try {
            const response = await fetch(`http://localhost:3000/pedidos/mesa/${mesaNumero}`);
            const pedidos = await response.json();
    
            const pedidosExistentesLista = document.getElementById("pedidos-existentes");
            pedidosExistentesLista.innerHTML = ""; // Limpia la lista de pedidos anteriores
    
            pedidos
                .filter(pedido => pedido.id_mesa == mesaNumero && pedido.estado !== "En proceso")
                .forEach(pedido => {
                    const pedidoItem = document.createElement("li");
                    pedidoItem.textContent = `Pedido ${pedido.id_pedido} - Estado: ${pedido.estado} - Total: $${pedido.total}`;
    
                    const editarBtn = document.createElement("button");
                    editarBtn.textContent = "Editar";
                    editarBtn.onclick = () => editarPedido(pedido);
    
                    const eliminarBtn = document.createElement("button");
                    eliminarBtn.textContent = "Eliminar";
                    eliminarBtn.onclick = () => eliminarPedido(pedido.id_pedido);
    
                    pedidoItem.appendChild(editarBtn);
                    pedidoItem.appendChild(eliminarBtn);
                    pedidosExistentesLista.appendChild(pedidoItem);
                });
        } catch (error) {
            console.error("Error cargando pedidos existentes:", error);
        }
    }
    
    
    
   
   //--------------------------------------------------------------------------------------------------------------------------------


function agregarAlPedido(producto) {
    console.log("Producto recibido:", producto); // 👈 Añade esto

    // Busca si ya está el producto en el pedido
    const productoExistente = pedido.find(p => p.id_producto === producto.id_producto);

    if (productoExistente) {
        productoExistente.cantidad += 1;
    } else {
        // Agregamos el producto con cantidad inicial
        pedido.push({ ...producto, cantidad: 1 });
    }

    actualizarPedidoUI();
}

function actualizarPedidoUI() {
    pedidoActualLista.innerHTML = "";
    total = 0;

    pedido.forEach(producto => {
        const subtotal = producto.precio * producto.cantidad;
        total += subtotal;

        const li = document.createElement("li");
        li.textContent = `${producto.nombre} x${producto.cantidad} - $${subtotal.toFixed(2)}`;

        const btnEliminar = document.createElement("button");
        btnEliminar.textContent = "➖";
        btnEliminar.onclick = () => {
            producto.cantidad--;
            if (producto.cantidad === 0) {
                pedido = pedido.filter(p => p.id_producto !== producto.id_producto);
            }
            actualizarPedidoUI();
        };

        li.appendChild(btnEliminar);
        pedidoActualLista.appendChild(li);
    });

    totalSpan.textContent = total.toFixed(2);
}

    
//--------------------------------------------------------------------------------------------------------------------------------
    async function editarPedido(pedido) {
        descripcionInto.value = pedido.descripcion;
        totalSpan.textContent = pedido.total;
    
        // Eliminar cualquier botón anterior para evitar duplicados
        const actualizarBtnExistente = document.getElementById("actualizarBtn");
        if (actualizarBtnExistente) {
            actualizarBtnExistente.remove();
        }
    
        const actualizarBtn = document.createElement("button");
        actualizarBtn.textContent = "Guardar Cambios";
        actualizarBtn.id = "actualizarBtn"; // Añadir un ID único para evitar duplicados
    
        actualizarBtn.onclick = async () => {
            const nuevaDescripcion = descripcionInto.value.trim();
            const nuevoTotal = parseFloat(totalSpan.textContent);
    
            try {
                // Asegurarse de usar interpolación de cadenas para insertar correctamente el id_pedido
                const response = await fetch(`http://localhost:3000/pedidos/editar/${pedido.id_pedido}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ descripcion: nuevaDescripcion, total: nuevoTotal })
                });
    
                const data = await response.json();
                if (response.ok) {
                    alert(data.message || "Pedido actualizado con éxito");
                    window.location.reload(); // Recargar la página para ver los cambios
                } else {
                    alert(data.message || "Error al actualizar el pedido.");
                }
            } catch (error) {
                console.error("Error actualizando pedido:", error);
                alert("Hubo un error al actualizar el pedido.");
            }
        };
    
        pedidoActualLista.appendChild(actualizarBtn);
    }
    

    //Eliminar el pedido
    async function eliminarPedido(idPedido) {
        try {
            const response = await fetch(`http://localhost:3000/pedidos/eliminar/${idPedido}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            });

            const data = await response.json();
            alert(data.message);
            window.location.reload();
        } catch (error) {
            console.error("Error eliminando pedido:", error);
        }
    }

    // Evento para enviar el pedido al server
    document.getElementById("enviar-pedido").addEventListener("click", async () => {
        if (pedido.length === 0) {
            alert("El pedido está vacío.");
            return;
        }
    
        const pedidoData = {
            id_mesa: mesaNumero,
            total: total.toFixed(2),
            descripcion: descripcionInto.value.trim(),
            productos: pedido.map(producto => ({
                id_producto: producto.id_producto,
                cantidad: producto.cantidad
            }))
        };
    
    
        try {
            const response = await fetch("http://localhost:3000/pedidos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pedidoData)
            });
    
            const data = await response.json();
            alert(data.message);
            window.location.reload();
        } catch (error) {
            console.error("Error enviando pedido:", error);
        }
    });

    cargarMenu();
    cargarPedidosExistentes();
});


//----------------------------------------------------------------------------

   /* const urlParams = new URLSearchParams(window.location.search);
    const mesa = urlParams.get('mesa');
    console.log(mesa);
    document.getElementById('mesa-numero').textContent = mesa;

    const menuDiv = document.getElementById('menu');

    async function cargarProductos() {
        const res = await fetch("http://localhost:3000/pedidos"); // porque todo lo manejas con pedidos
        const data = await res.json();
        console.log("Productos cargados:", data);
        
        // ejemplo de mostrar en pantalla
        data.forEach(producto => {
            const item = document.createElement("button");
            item.textContent = `${producto.nombre} - $${producto.precio}`;
            menuDiv.appendChild(item);
        });
        
      }
      
      cargarProductos();  
    document.getElementById("menu").textContent 
     */