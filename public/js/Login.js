// public/js/login.js
document.getElementById('btnLogin').addEventListener('click', () => {
    const usuario = document.getElementById('usuario').value;
    const contraseña = document.getElementById('contraseña').value;
  
    fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, contraseña })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert('Login exitoso');
          // Redirigir a la vista de rol (ajústalo según tu estructura)
          window.location.href = '/views/Rol.html';
        } else {
          alert(data.mensaje || 'Credenciales Incorrectas');
        }
      })
      .catch(err => console.error(err));
  });
  