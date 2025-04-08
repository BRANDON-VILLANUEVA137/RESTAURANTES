const Login = require('../controllers/models/loginModel');

exports.verificarLogin = (req, res) => {
    const { usuario, contraseña } = req.body;

    if (!usuario || !contraseña) {
        return res.status(400).json({ success: false, mensaje: 'Faltan datos' });
    }

    Login.verificarUsuario(usuario, contraseña, (err, results) => {
        if (err) return res.status(500).json({ success: false, mensaje: 'Error en el servidor' });

        if (results.length > 0) {
            res.json({ success: true });
        } else {
            res.json({ success: false, mensaje: 'Usuario o contraseña incorrectos' });
        }
    });
};