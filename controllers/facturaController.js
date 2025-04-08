const PDFDocument = require('pdfkit');
const db = require("../config/db");
const nodemailer = require("nodemailer");
const twilio = require("twilio");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const generarFacturaPDF = async (req, res) => {
    try {
        const { id_pedido, metodo_pago, total, telefono, correo } = req.body;

        db.query("SELECT productos FROM pedidos WHERE id_pedido = ?", [id_pedido], (err, results) => {
            if (err) return res.status(500).send("Error consultando pedido.");
            if (results.length === 0) return res.status(404).send("Pedido no encontrado.");

            let productos = results[0].productos;

            if (typeof productos === 'string') {
                try {
                    productos = JSON.parse(productos);
                } catch (parseErr) {
                    return res.status(500).send("Error procesando productos.");
                }
            }

            const ids = productos.map(p => p.id_producto);
            const placeholders = ids.map(() => '?').join(',');

            db.query(`SELECT id_producto, nombre, precio FROM productos WHERE id_producto IN (${placeholders})`, ids, (err, detalles) => {
                if (err) return res.status(500).send("Error consultando detalles.");

                const productosCompletos = productos.map(p => {
                    const info = detalles.find(d => d.id_producto == p.id_producto);
                    return {
                        cantidad: p.cantidad,
                        nombre: info?.nombre || "Desconocido",
                        precio: info?.precio || 0
                    };
                });

                const doc = new PDFDocument();
                let buffers = [];

                doc.on("data", buffers.push.bind(buffers));
                doc.on("end", async () => {
                    const pdfData = Buffer.concat(buffers);

                    // 📧 Enviar por correo
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PASS,
                        }
                    });

                    const mailOptions = {
                        from: process.env.EMAIL_USER,
                        to: correo,
                        subject: `Factura del Pedido #${id_pedido}`,
                        text: `Adjunto encontrará la factura del pedido realizado. Gracias por su compra.`,
                        attachments: [
                            {
                                filename: `factura_${id_pedido}.pdf`,
                                content: pdfData
                            }
                        ]
                    };

                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.error('❌ Error enviando correo:', error);
                        } else {
                            console.log('📧 Correo enviado:', info.response);
                        }
                    });

                    // ☁️ Subir PDF a Cloudinary
                    const uploadStream = cloudinary.uploader.upload_stream(
                        {
                            resource_type: "raw",
                            folder: "facturas",
                            public_id: `factura_${id_pedido}`
                        },
                        async (error, result) => {
                            if (error) {
                                console.error("❌ Error subiendo a Cloudinary:", error);
                                return;
                            }

                            // 📲 Enviar por WhatsApp con URL válida
                            const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
                            try {
                                await client.messages.create({
                                    from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER,
                                    to: `whatsapp:${telefono}`,
                                    body: `📄 Factura del Pedido #${id_pedido}. Gracias por su compra.`,
                                    mediaUrl: [result.secure_url]
                                });
                                console.log("📲 Mensaje enviado por WhatsApp");
                            } catch (whatsappError) {
                                console.error("❌ Error enviando WhatsApp:", whatsappError);
                            }
                        }
                    );

                    uploadStream.write(pdfData);
                    uploadStream.end();

                    // 📥 Descargar también desde navegador
                    res.setHeader("Content-Type", "application/pdf");
                    res.setHeader("Content-Disposition", `attachment; filename=factura_${id_pedido}.pdf`);
                    res.send(pdfData);
                });

                // ✍️ Crear PDF
                doc.fontSize(18).text("Recibo del Pedido", { align: "center" });
                doc.moveDown();
                doc.fontSize(12).text(`ID Pedido: ${id_pedido}`);
                doc.text(`Método de Pago: ${metodo_pago}`);
                doc.text(`Teléfono: ${telefono}`);
                doc.text(`Correo: ${correo}`);
                doc.moveDown();
                doc.fontSize(14).text("Productos:");
                productosCompletos.forEach(p => {
                    doc.fontSize(12).text(`- ${p.nombre} x${p.cantidad} - $${p.precio}`);
                });
                doc.moveDown();
                doc.fontSize(14).text(`Total a Pagar: $${total}`, { align: "right" });
                doc.end();
            });
        });
    } catch (error) {
        console.error("❌ Error generando PDF:", error);
        res.status(500).send("Error generando factura.");
    }
};

module.exports = { generarFacturaPDF };
