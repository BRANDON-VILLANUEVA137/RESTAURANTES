


document.addEventListener("DOMContentLoaded", async () => {
    const ordenesContainer = document.getElementById("ordenes-container");
    const formMenu = document.getElementById("formMenu");

    
    async function cargarOrdenes() {
        ordenesContainer.innerHTML = "<p>Cargando órdenes...</p>"; // Indicador de carga
        try {
            const response = await fetch("http://localhost:3000/pedidos");
            const pedidos = await response.json();
            ordenesContainer.innerHTML = ""; // Limpiar el contenedor después de obtener los datos

            if (pedidos.length === 0) {
                ordenesContainer.innerHTML = "<p>No hay órdenes disponibles.</p>"; // Mensaje cuando no hay órdenes
                return;
            }

            pedidos.forEach(pedido => {
                let productosHtml = "";
                    
                // Aquí agregamos los productos del pedido
                productosHtml = `
                    <ul class="productos-lista">
                        ${pedido.productos.map(producto => `
                            <li class="producto-item">
                                <strong>Producto ID:</strong> ${producto.id_producto}<br>
                                <strong>Nombre:</strong> ${producto.nombre}<br>
                                <strong>Precio:</strong> $${producto.precio}
                            </li>
                        `).join('')}
                    </ul>
                `;

                if (pedido.estado !== "Finalizado") {
                    const ordenDiv = document.createElement("div");
                    ordenDiv.classList.add("orden");
                    ordenDiv.innerHTML = `
                        <p><strong>Mesa ${pedido.id_mesa}</strong></p>
                        <p>Total: $${pedido.total}</p>
                        <p>Estado: <span class="estado-${pedido.estado}">${pedido.estado}</span></p>
                        <div class="productos-info">${productosHtml}</div>
                        
                        <button onclick="window.location.href='/views/metodo_pago.html?id_pedido=${pedido.id_pedido}&total=${pedido.total}&mesa=${pedido.id_mesa}&productos=${encodeURIComponent(JSON.stringify(pedido.productos))}'">Pagar</button>
                    `;
                    ordenesContainer.appendChild(ordenDiv);
                }
            });
        } catch (error) {
            ordenesContainer.innerHTML = "<p>Error cargando las órdenes.</p>"; // Mensaje de error
            console.error("Error cargando órdenes:", error);
        }
    }

    window.generarFactura = async (id_pedido, total) => {
        const metodoPago = document.getElementById(`metodo-${id_pedido}`).value;
        try {
            const response = await fetch("http://localhost:3000/facturas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_pedido, metodo_pago: metodoPago, total })
            });
            const data = await response.json();
            alert(data.message);
            cargarOrdenes(); // Recargar las órdenes después de generar la factura
        } catch (error) {
            alert("Error generando factura. Inténtalo de nuevo.");
            console.error("Error generando factura:", error);
        }
    };

    window.generarReporte = async () => {
        const fecha = document.getElementById("fecha-reporte").value;
        if (!fecha) {
            alert("Seleccione una fecha para generar el reporte.");
            return;
        }
        try {
            const response = await fetch(`http://localhost:3000/facturas?fecha=${fecha}`);
            const data = await response.json();
            const facturas = data; // Ajuste aquí
    
            if (!Array.isArray(facturas)) {
                alert("La respuesta del servidor no es válida.");
                return;
            }
    
            const reporteContainer = document.getElementById("reporte-container");
            reporteContainer.innerHTML = `<h3>Reporte de Ventas - ${fecha}</h3>`;
    
            if (facturas.length === 0) {
                reporteContainer.innerHTML += "<p>No se encontraron facturas para esta fecha.</p>";
            } else {
                facturas.forEach(factura => {
                    const facturaDiv = document.createElement("div");
                    facturaDiv.classList.add("factura-item");
                    facturaDiv.innerHTML = `
                        <p><strong>📄Factura #${factura.id_factura}</strong> - Pedido #${factura.id_pedido}</p>
                        <p>💳Método de Pago: ${factura.metodo_pago}</p>
                        <p>🤑Total: $${factura.total}</p>
                        <p>----------------------------------------------------------------------------------------</p>
                    `;
                    reporteContainer.appendChild(facturaDiv);
                });
            }
        } catch (error) {
            alert("Error generando reporte. Inténtalo de nuevo.");
            console.error("Error generando reporte:", error);
        }
    };
     
    cargarOrdenes();
    cargarMenuDelDia(); 

});

// Evento para agregar un nuevo producto al menú

async function cargarMenuDelDia() {
    try {
        const response = await fetch("http://localhost:3000/productos");
        const productos = await response.json();
        const menuContainer = document.getElementById("menu-container");
        menuContainer.innerHTML = "<p>Cargando productos...</p>"; // Indicador de carga

        if (productos.length === 0) {
            menuContainer.innerHTML = "<p>No hay productos disponibles.</p>"; // Mensaje si no hay productos
            return;
        }

        menuContainer.innerHTML = ""; // Limpiar el contenedor

        productos.forEach(producto => {
            const productoDiv = document.createElement("div");
            productoDiv.classList.add("producto");
            productoDiv.innerHTML = `
            <p><strong>${producto.nombre}</strong></p>
            <p>Tipo: ${producto.tipo}</p>
            <p>Precio: $${producto.precio}</p>
            <p>Stock: ${producto.stock}</p>
            <label>
                <input type="checkbox" onchange="cambiarEstado(${producto.id_producto}, 'activo_carta', this.checked)" ${producto.activo_carta ? 'checked' : ''}>
                Mostrar en Carta
            </label><br>
            <label>
                <input type="checkbox" onchange="cambiarEstado(${producto.id_producto}, 'menu_dia', this.checked)" ${producto.menu_dia ? 'checked' : ''}>
                Menú del Día
            </label>
        `;
        
            menuContainer.appendChild(productoDiv);
        });
    } catch (error) {
        alert("Error cargando los productos.");
        console.error("Error cargando productos:", error);
    }
}



formMenu.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre-producto").value.trim();
    const tipo = document.getElementById("tipo-producto").value;
    const precio = parseFloat(document.getElementById("precio-producto").value);
    const stock = parseInt(document.getElementById("stock-producto").value);

    if (!nombre || !tipo || isNaN(precio) || isNaN(stock)) {
        alert("Por favor, complete todos los campos correctamente.");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/productos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ nombre, tipo, precio, stock })
        });

        const data = await response.json();
        if (response.ok) {
            alert("Producto agregado con éxito.");
            cargarMenuDelDia(); // Recargar menú
        } else {
            alert(data.error || "Error al agregar el producto.");
        }
    } catch (error) {
        alert("Error al agregar el producto. Inténtalo de nuevo.");
        console.error("Error:", error);
    }
});

//Esto forma parte del xml

window.generarFactura = async (id_pedido, total) => {
    const metodoPago = document.getElementById(`metodo-${id_pedido}`).value;

    try {
        const response = await fetch("http://localhost:3000/facturas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_pedido, metodo_pago: metodoPago, total })
        });

        // ✅ Verifica si la respuesta es exitosa
        if (!response.ok) {
            throw new Error(`Error en la respuesta del servidor: ${response.status}`);
        }

        const xmlText = await response.text();
        console.log("Contenido del XML recibido:", xmlText);

        // ✅ Verificar el Content-Type para evitar errores
        const contentType = response.headers.get("Content-Type");
        if (!contentType || !contentType.includes("application/xml")) {
            alert("El servidor no devolvió un XML válido.");
            console.error("Encabezado Content-Type incorrecto:", contentType);
            return;
        }

        // ✅ Crear un archivo XML para descargar
        const blob = new Blob([xmlText], { type: "application/xml" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = `factura_${id_pedido}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert("Factura generada y descargada correctamente.");
        cargarOrdenes(); // Recargar las órdenes después de generar la factura

    } catch (error) {
        alert("Error generando factura. Inténtalo de nuevo.");
        console.error("Error generando factura:", error);
    }
};

function cambiarEstado(id_producto, columna, valor) {
    fetch(`http://localhost:3000/productos/${id_producto}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columna, valor: valor ? 1 : 0 })
    })
    .then(res => res.json())
    .then(data => {
        console.log("✅ Estado actualizado:", data);
    })
    .catch(err => {
        alert("Error actualizando estado del producto.");
        console.error("❌", err);
    });
}
