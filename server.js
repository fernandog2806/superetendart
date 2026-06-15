const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const mongoose = require('mongoose');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const { put, del } = require('@vercel/blob');
const multer = require('multer');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { Usuario, Foto } = require('./models');

const app = express();
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'super-etendart-secret-key-2026';

const MONGO_URI = process.env.MONGO_URL || process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/superetendart';
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_TOKEN || process.env.VERCEL_OIDC_TOKEN;
const BLOB_STORE_ID = process.env.BLOB_STORE_ID;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const blobConfigured = Boolean(BLOB_TOKEN || BLOB_STORE_ID);
const mailConfigured = Boolean(EMAIL_USER && EMAIL_PASS);
const localUploadDir = process.env.VERCEL ? path.join(os.tmpdir(), 'uploads') : path.join(__dirname, 'public', 'uploads');

if (process.env.VERCEL && !process.env.MONGO_URL && !process.env.MONGODB_URI && !process.env.DATABASE_URL) {
    console.warn('⚠️ No se encontró variable de conexión MongoDB en Vercel. Define MONGODB_URI o DATABASE_URL.');
}

mongoose.connect(MONGO_URI)
    .then(() => console.log('🚀 MongoDB conectado con éxito'))
    .catch((err) => console.error('Error Mongo:', err));

if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
}

if (!blobConfigured) {
    console.warn('⚠️ Vercel Blob no está configurado. Las fotos se guardarán localmente en:', localUploadDir);
}

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});

if (!mailConfigured) {
    console.warn('⚠️ EMAIL_USER y/o EMAIL_PASS no están definidos. No se enviarán correos.');
} else {
    transporter.verify((error) => {
        if (error) {
            console.error('⚠️ Error al verificar nodemailer:', error);
        } else {
            console.log('✅ Servicio de correo listo para enviar mensajes.');
        }
    });
}

app.set('strict routing', false);
app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGO_URI,
        ttl: 14 * 24 * 60 * 60
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax'
    },
    proxy: true
}));

// =============================================================================
// 🔑 TU CÓDIGO FIJO MAESTRO (El que le pasás a los integrantes de la banda)
// =============================================================================
const CODIGO_SECRETO_BANDA = 'ETENDART_BANDA_2026';

const enlacesNav = [
    { texto: "Historia", url: "/historia", clase: "" },
    { texto: "Álbum", url: "/album", clase: "" },
    { texto: "Integrantes", url: "/integrantes", clase: "" },
    { texto: "Videos", url: "/video", clase: "" },
    { texto: "Fotos", url: "/fotos", clase: "" },
    { texto: "Spotify | SUPER ETENDART", url: "https://spotify.com", clase: "spotify-link" },
    { texto: "YouTube | SUPERETENDART", url: "https://youtube.com", clase: "youtube-link" },
    { texto: "Instagram | SUPER ETENDART", url: "https://instagram.com", clase: "instagram-link" },
    { texto: "Facebook | SUPERETENDART", url: "https://facebook.com", clase: "facebook-link" }
];

const integrantes = [
    { nombre: "Luis Insaurralde", foto: "fotos/luis.jpg", silueta: "silueta/guitarra.jpg", alt: "Silueta Guitarra", rol: "Voz y Guitarra", desc: "Voz principal y guitarrista, fundador de la banda...", instagram: "https://instagram.com" },
    { nombre: 'Fernanando Gomez "Poli"', foto: "fotos/poli.jpg", silueta: "silueta/bateria.jpg", alt: "Silueta Batería", rol: "Batería", desc: "Baterista y cofundador, amigo de Luis desde la infancia...", instagram: "https://instagram.com" },
    { nombre: "Manuel Teodoroff", foto: "fotos/manu.jpg", silueta: "silueta/bajo.jpg", alt: "Silueta Bajo", rol: "Bajista", desc: "Se sumó en 2023 para potenciar el sonido en vivo...", instagram: "https://instagram.com" }
];

const listaVideos = [
    { titulo: "SUPER ETENDART - Primer Vivo", idYoutube: "lSJ5Y0sB2z0" },
    { titulo: "SUPER ETENDART - Alto", idYoutube: "epiNyJ0ijYQ" },
    { titulo: "SUPER ETENDART - Horizontes", idYoutube: "80mnkuVfA14" },
    { titulo: "SUPER ETENDART - Ficciones", idYoutube: "giFDYRROir8" },
    { titulo: "SUPER ETENDART - Teledirigidos", idYoutube: "mvT8rdN0KOI" }
];

const upload = multer({ storage: multer.memoryStorage() });

app.use((req, res, next) => {
    res.locals.enlacesNav = enlacesNav;
    res.locals.paginaActual = req.path.replace(/\/$/, "");
    res.locals.usuarioLogueado = req.session.usuario || null;
    next();
});

// RUTAS TRADICIONALES
app.get('/', (req, res) => res.render('index', { integrantes }));
app.get('/historia', (req, res) => res.render('historia'));
app.get('/album', (req, res) => res.render('album'));
app.get('/integrantes', (req, res) => res.render('integrantes', { integrantes }));
app.get('/video', (req, res) => res.render('video', { listaVideos }));

// ================= AUTENTICACIÓN AVANZADA (LOGIN / REGISTRO) =================

app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));

// Procesar Registro Completo y Blindado contra errores de Nodemailer en localhost
app.post('/register', async (req, res) => {
    const { nombre, apellido, username, email, password, esDueñoCheck, codigoBanda } = req.body;
    try {
        const existeUser = await Usuario.findOne({ $or: [{ username }, { email }] });
        if (existeUser) return res.send('El usuario o el correo electrónico ya están registrados.');

        let rolAsignado = 'fan';

        // Si tildó que es músico, comparamos contra tu constante fija
        if (esDueñoCheck) {
            if (codigoBanda === CODIGO_SECRETO_BANDA) {
                rolAsignado = 'dueño';
            } else {
                return res.send('Código secreto de la banda incorrecto. No podés registrarte como dueño.');
            }
        }

        const nuevoUsuario = new Usuario({ nombre, apellido, username, email, password, rol: rolAsignado });
        await nuevoUsuario.save();

        // Envío de mail de bienvenida encapsulado para que no rompa el flujo si falla en local
        const mailOptions = {
            from: '"SUPER ETENDART" <no-reply@superetendart.com>',
            to: email,
            subject: '🎸 ¡Bienvenido a la comunidad de SUPER ETENDART!',
            html: `<h3>¡Hola ${nombre}!</h3><p>Tu cuenta fue creada con éxito como <b>${rolAsignado}</b>.</p><br><p>Abrazo rockero.</p>`
        };

        if (!mailConfigured) {
            console.warn('⚠️ Registro completado pero el correo no se envió porque EMAIL_USER/EMAIL_PASS no están configurados.');
        } else {
            await transporter.sendMail(mailOptions)
                .then(() => console.log('✅ Mail enviado con éxito.'))
                .catch(err => {
                    console.error('⚠️ Error enviando mail de registro:', err);
                });
        }

        res.redirect('/login');
    } catch (err) {
        console.error('Error registro usuario:', err);
        if (err.code === 11000) {
            return res.status(400).send('El usuario o el correo ya están registrados.');
        }
        const mensaje = err.message || 'Error interno en el servidor durante el registro.';
        res.status(500).send(`Error en el proceso de registro: ${mensaje}`);
    }
});

// Procesar Inicio de Sesión
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const cuenta = await Usuario.findOne({ username });
        if (cuenta && cuenta.password === password) {
            req.session.usuario = { id: cuenta._id, username: cuenta.username, rol: cuenta.rol };
            return res.redirect('/fotos');
        }
        res.send('Usuario o contraseña incorrectos.');
    } catch (err) {
        res.status(500).send('Error al iniciar sesión.');
    }
});

// ================= RECUPERO DE CONTRASEÑA POR LINK DE EMAIL =================

app.get('/forgot', (req, res) => res.render('forgot'));

app.post('/forgot', async (req, res) => {
    const { email } = req.body;
    try {
        const usuario = await Usuario.findOne({ email });
        if (!usuario) return res.send('No existe ninguna cuenta asociada a ese correo electrónico.');

        const token = crypto.randomBytes(20).toString('hex');
        usuario.resetPasswordToken = token;
        usuario.resetPasswordExpires = Date.now() + 3600000; // 1 hora de validez
        await usuario.save();

        const URL_BASE = req.headers.host.includes('localhost') ? `http://${req.headers.host}` : `https://${req.headers.host}`;
        const linkRecupero = `${URL_BASE}/reset/${token}`;

        const mailOptions = {
            from: '"SUPER ETENDART" <no-reply@superetendart.com>',
            to: email,
            subject: '🔒 Restablecer tu contraseña - SUPER ETENDART',
            html: `<h3>Solicitud de cambio de clave</h3><p>Hacé clic en el siguiente enlace para definir una nueva contraseña sin necesidad de colocar la vieja:</p><a href="${linkRecupero}">${linkRecupero}</a>`
        };

        await transporter.sendMail(mailOptions);
        res.send('¡Enlace enviado! Revisá tu casilla de correo electrónico.');
    } catch (err) {
        res.status(500).send('Error al procesar el recupero.');
    }
});

app.get('/reset/:token', async (req, res) => {
    try {
        const usuario = await Usuario.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!usuario) return res.send('El link de recuperación es inválido o ya expiró.');
        res.render('reset', { token: req.params.token });
    } catch (err) {
        res.status(500).send('Error en el servidor.');
    }
});

app.post('/reset/:token', async (req, res) => {
    try {
        const usuario = await Usuario.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!usuario) return res.send('Token inválido o expirado.');

        usuario.password = req.body.password;
        usuario.resetPasswordToken = undefined;
        usuario.resetPasswordExpires = undefined;
        await usuario.save();

        res.send('¡Contraseña actualizada con éxito! Ya podés iniciar sesión con tu nueva clave.');
    } catch (err) {
        res.status(500).send('Error al cambiar la clave.');
    }
});

// ================= CONTROL INTERACTIVO DEL FEED (FASE 2 DEFINITIVA) =================

// 1. Mostrar la galería leyendo los datos reales de MongoDB Atlas
app.get('/fotos', async (req, res) => {
    try {
        const fotosDb = await Foto.find().sort({ fecha: -1 });
        res.render('fotos', { fotosDb }); // Pasa el array completo de objetos de la base de datos
    } catch (err) {
        res.status(500).send('Error al cargar la galería.');
    }
});

// 2. Procesar la subida de fotos (Exclusivo Dueño)
app.post('/subir-foto', upload.single('archivoFoto'), async (req, res) => {
    if (!req.session.usuario || req.session.usuario.rol !== 'dueño') {
        return res.status(403).send('No autorizado.');
    }
    if (!req.file) return res.redirect('/fotos');

    try {
        // Algoritmo inteligente para cuidar el espacio gratuito (Capa gratis: máximo 1000 fotos)
        const totalFotos = await Foto.countDocuments();
        if (totalFotos >= 1000) {
            const fotoVieja = await Foto.findOne().sort({ fecha: 1 });
            if (fotoVieja) {
                if (blobConfigured && !fotoVieja.url.startsWith('/uploads/')) {
                    await del(fotoVieja.url);
                } else {
                    const localFile = path.join(localUploadDir, path.basename(fotoVieja.url));
                    if (fs.existsSync(localFile)) {
                        fs.unlinkSync(localFile);
                    }
                }
                await Foto.deleteOne({ _id: fotoVieja._id });
            }
        }

        const nombreUnico = `${Date.now()}-${req.file.originalname}`;
        let fileUrl;
        if (blobConfigured) {
            const blob = await put(`galeria/${nombreUnico}`, req.file.buffer, {
                access: 'public',
                token: BLOB_TOKEN,
                storeId: BLOB_STORE_ID
            });
            fileUrl = blob.url;
        } else {
            const localPath = path.join(localUploadDir, nombreUnico);
            fs.writeFileSync(localPath, req.file.buffer);
            fileUrl = `/uploads/${nombreUnico}`;
        }

        const nuevaFoto = new Foto({ url: fileUrl });
        await nuevaFoto.save();

        res.redirect('/fotos');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al subir la imagen.');
    }
});

// 3. Procesar los Me Gusta de forma asíncrona (Fans registrados)
app.post('/fotos/:id/like', async (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({ error: "Tenés que iniciar sesión." });
    }

    const userId = req.session.usuario.id;
    try {
        const foto = await Foto.findById(req.params.id);
        if (!foto) return res.status(404).json({ error: "Foto no encontrada." });

        // Evaluamos si el ID del usuario ya existe dentro de la lista de reacciones
        const index = foto.reacciones.indexOf(userId);
        let yaDioLike = false;

        if (index === -1) {
            foto.reacciones.push(userId); // Si no existía, suma el Me Gusta
            yaDioLike = true;
        } else {
            foto.reacciones.splice(index, 1); // Si ya existía, remueve el Me Gusta (Quitar Like)
        }

        await foto.save();
        res.json({ totalLikes: foto.reacciones.length, yaDioLike });
    } catch (err) {
        res.status(500).json({ error: "Error en el servidor." });
    }
});

// 4. Procesar la eliminación de fotos de la grilla (Exclusivo Dueño)
app.post('/borrar-foto', async (req, res) => {
    if (!req.session.usuario || req.session.usuario.rol !== 'dueño') {
        return res.status(403).send('No autorizado.');
    }
    try {
        const foto = await Foto.findById(req.body.id);
        if (!foto) return res.status(404).send('No encontrada.');

        if (!blobConfigured || foto.url.startsWith('/uploads/')) {
            const localFile = path.join(__dirname, 'public', foto.url.replace(/^\//, ''));
            if (fs.existsSync(localFile)) {
                fs.unlinkSync(localFile);
            }
        } else {
            await del(foto.url, {
                token: BLOB_TOKEN,
                storeId: BLOB_STORE_ID
            });
        }

        await Foto.deleteOne({ _id: foto._id });
        return res.sendStatus(200);
    } catch (err) {
        console.error('Error al eliminar foto:', err);
        res.status(500).send('Error al eliminar.');
    }
});


// Cerrar Sesión
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Encender servidor localmente, pero no en Vercel serverless
if (!process.env.VERCEL) {
    app.listen(PORT, () => console.log(`🚀 Servidor de Super Etendart corriendo en http://localhost:${PORT}`));
}

module.exports = app;
