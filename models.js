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

// 🚀 ENCRIPTACIÓN AUTOMÁTICA (Versión moderna compatible con Mongoose 9)
UsuarioSchema.pre('save', async function () {
    // Si la contraseña no se modificó, salteamos el proceso
    if (!this.isModified('password')) return;

    try {
        const salt = await bcrypt.genSalt(10); // Genera la base aleatoria de seguridad
        this.password = await bcrypt.hash(this.password, salt); // Transforma la clave en el hash seguro
    } catch (err) {
        throw err; // Lanza el error para que lo ataje el catch de tu ruta
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
