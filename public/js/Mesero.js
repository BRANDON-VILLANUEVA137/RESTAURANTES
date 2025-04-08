const contenedor = document.getElementById("contenedor-botones");

        for (let i = 1; i <= 17; i++) {
            let boton = document.createElement("button"); 
            boton.textContent = `Mesa ${i}`;
            boton.classList.add("boton-mesa"); 
            boton.addEventListener("click", () => {
                window.location.href = `pedido.html?mesa=${i}`;
            });

            contenedor.appendChild(boton); 
        }
                    
                 // Conectar al servidor de Socket.IO
                 const socket = io("http://localhost:3000");
                 console.log("🧠 Socket conectado:", socket);
                    // Escuchar el mensaje de Socket.IO
                    socket.on('mensaje_cocinero', (mensaje) => {
                        console.log(mensaje); // Imprime en la consola

                        // Mostrar el mensaje en el div
                        const mensajeDiv = document.getElementById('mensaje-pedido');
                        mensajeDiv.innerHTML = `<p>${mensaje}</p>`;
                    });
                        
