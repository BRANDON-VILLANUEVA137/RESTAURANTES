class CajeroService {
    constructor() {
      this.baseUrl = 'http://localhost:3000';
    }
  
    async obtenerPedidos() {
      const response = await fetch(`${this.baseUrl}/pedidos`);
      return await response.json();
    }
  
    async obtenerProductos() {
      const response = await fetch(`${this.baseUrl}/productos`);
      return await response.json();
    }
  
    async agregarProducto(producto) {
      const response = await fetch(`${this.baseUrl}/productos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(producto)
      });
      return await response.json();
    }
  
    async generarFactura(facturaData) {
      const response = await fetch(`${this.baseUrl}/facturas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(facturaData)
      });
      return await response.text(); // Para el XML
    }
  
    async obtenerFacturasPorFecha(fecha) {
      const response = await fetch(`${this.baseUrl}/facturas?fecha=${fecha}`);
      return await response.json();
    }
  }
  
  export default new CajeroService();