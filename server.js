require('dotenv').config();
const express = require('express');
const app = express();
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

// CONFIGURACIÓN CLAVE: Evita el error de la barra final (Cannot GET /fotos/)
app.set('strict routing', false);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));


// CADENA DE CONEXIÓN DINÁMICA (Si estás en tu PC, usa tu base local fija; en internet lee Vercel)
const MONGO_URI = process.env.MONGO_URL || 'mongodb://localhost:27017/superetendart';

// 1. Borrá tu viejo mongoose.connect y pegá todo esto en su lugar:
let cachedConnection = null;

async function conectarBaseDeDatos() {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return cachedConnection;
    }

    console.log('🔄 Conectando a MongoDB Atlas...');
    cachedConnection = await mongoose.connect("mongodb+srv://fernandogonzalez_db_user:superetendart@cluster0.e6ufwoz.mongodb.net/superetendart?retryWrites=true&w=majority", {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10
    });
    console.log('🚀 MongoDB Conectado con Éxito');
    return cachedConnection;
}

// Arranca la conexión apenas se levanta el servidor
conectarBaseDeDatos().catch(err => console.error('⚠️ Error al conectar MongoDB:', err));


const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_TOKEN || process.env.VERCEL_OIDC_TOKEN;
const BLOB_STORE_ID = process.env.BLOB_STORE_ID;
const blobConfigured = Boolean(BLOB_TOKEN || BLOB_STORE_ID);
const localUploadDir = process.env.VERCEL ? path.join(os.tmpdir(), 'uploads') : path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
}
if (!blobConfigured) {
    console.warn('⚠️ Vercel Blob no está configurado. Las fotos se guardarán localmente en:', localUploadDir);
}

// Configuración de Sesiones guardadas directamente en MongoDB
app.use(session({
    secret: 'super-etendart-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongoUrl: MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 día activo
}));

// =============================================================================
// 🔑 TU CÓDIGO FIJO MAESTRO (El que le pasás a los integrantes de la banda)
// =============================================================================
const CODIGO_SECRETO_BANDA = "ETENDART_BANDA_2026";

// CONFIGURACIÓN DE NODEMAILER (Para envío de correos reales)
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const mailConfigured = Boolean(EMAIL_USER && EMAIL_PASS);

// =============================================================================
// 📧 CONFIGURACIÓN MAESTRA DE CORREO (GMAIL)
// =============================================================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'fernando.gonzalez28061991@gmail.com', // Reemplazá esto por tu cuenta de Gmail de envío
        pass: 'hpwqlkqdjedynzid'           // Poné acá tu clave de aplicación de 16 letras limpia
    }
});


// Verificación automática del canal de correos al arrancar
const tieneClavesMail = process.env.EMAIL_USER || 'fernandogonzalez28061991@gmail.com';
if (!tieneClavesMail) {
    console.warn('⚠️ EMAIL_USER y/o EMAIL_PASS no están definidos. No se enviarán correos.');
} else {
    transporter.verify((error, success) => {
        if (error) {
            console.error('⚠️ Error al conectar con el servidor de correos:', error.message);
        } else {
            console.log('✅ ¡Servicio de correo de SUPERETENDART listo y conectado!');
        }
    });
}


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
        // 🚀 OBLIGAMOS A ESPERAR LA CONEXIÓN: Evita que Mongoose tire el timeout en Vercel
        await conectarBaseDeDatos();

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

        // Envío de mail de bienvenida encapsulado
        const mailOptions = {
            from: '"SUPER ETENDART" <fernando.gonzalez28061991@gmail.com>', // 🎸 Tu correo configurado con éxito
            to: email,
            subject: '🎸 ¡Bienvenido a la comunidad de SUPER ETENDART!',
            html: `<h3>¡Hola ${nombre}!</h3><p>Tu cuenta fue creada con éxito como <b>${rolAsignado}</b>.</p><br><p>Abrazo rockero.</p>`
        };

        // Forzamos el envío de Nodemailer con los datos fijos del código
        await transporter.sendMail(mailOptions)
            .then(() => console.log('✅ Mail enviado con éxito.'))
            .catch(err => {
                console.error('⚠️ Error enviando mail de registro:', err);
            });

        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el proceso de registro.');
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
const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
    app.listen(PORT, () => console.log(`🚀 Servidor de Super Etendart corriendo en http://localhost:${PORT}`));
}

module.exports = app;
