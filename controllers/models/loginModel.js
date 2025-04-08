// models/loginModel.js
const db = require('../../config/db');

const Login = {
    verificarUsuario: (usuario,contraseña, callback) => {
        const sql = 'select * from usuarios where usuario = ? AND contraseña  = ?';
        db.query(sql,[usuario, contraseña], callback);
    }
}

module.exports =  Login;