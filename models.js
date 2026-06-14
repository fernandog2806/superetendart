const mongoose = require('mongoose');

// Esquema de Usuarios Avanzado (Compatible con tu nuevo registro y login)
const UsuarioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rol: { type: String, default: 'fan' }, // 'fan' o 'dueño'

    // CAMPOS EXCLUSIVOS PARA EL LINK DE RECUPERAR CONTRASEÑA
    resetPasswordToken: String,  // Guarda el token secreto temporal que viaja en el link del mail
    resetPasswordExpires: Date   // Define la fecha de vencimiento de ese link (1 hora)
});

// Esquema de las Fotos de la Galería estilo Instagram
const FotoSchema = new mongoose.Schema({
    url: { type: String, required: true },
    fecha: { type: Date, default: Date.now },
    reacciones: [{ type: String }] // Guarda los IDs de los fans que dieron Me Gusta
});

const Usuario = mongoose.model('Usuario', UsuarioSchema);
const Foto = mongoose.model('Foto', FotoSchema);

module.exports = { Usuario, Foto };
