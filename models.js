const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // 🚀 IMPORTANTE: Acordate de hacer 'npm install bcrypt' en la terminal

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

// 🚀 ENCRIPTACIÓN AUTOMÁTICA: Se ejecuta justo antes de guardar el usuario en MongoDB
UsuarioSchema.pre('save', async function (next) {
    // Si la contraseña no se modificó (ej: si cambiaste el rol pero no la clave), salteamos
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10); // Genera la base aleatoria de seguridad
        this.password = await bcrypt.hash(this.password, salt); // Transforma la clave en el hash seguro
        next();
    } catch (err) {
        next(err);
    }
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
