const express = require('express');
const app = express();
const path = require('path');

// Configurar EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Servir archivos multimedia y CSS desde public
app.use(express.static(path.join(__dirname, 'public')));

// DATA LOCAL DE LA BANDA
const enlacesNav = [
    { texto: "Historia", url: "/historia", clase: "" },
    { texto: "Álbum", url: "/album", clase: "" },
    { texto: "Integrantes", url: "/integrantes", clase: "" },
    { texto: "Videos", url: "/video", clase: "" },
    { texto: "Spotify | SUPER ETENDART", url: "https://spotify.com", clase: "spotify-link" },
    { texto: "YouTube | SUPERETENDART", url: "https://youtube.com", clase: "youtube-link" },
    { texto: "Instagram | SUPER ETENDART", url: "https://instagram.com", clase: "instagram-link" },
    { texto: "Facebook | SUPERETENDART", url: "https://facebook.com", clase: "facebook-link" }
];



const integrantes = [
    {
        nombre: "Luis Insaurralde",
        foto: "fotos/luis.jpg",
        silueta: "silueta/guitarra.jpg",
        alt: "Silueta Guitarra",
        rol: "Voz y Guitarra",
        desc: "Voz principal y guitarrista, fundador de la banda. Luis impulsa el paso de covers a canciones propias, destacándose en el escenario y letras profundas. 'Nos sorprendió darnos cuenta de que podíamos hacer algo propio', dice sobre el proceso creativo. Siempre busca innovar y conectar con el público.",
        instagram: "https://instagram.com"
    },
    {
        nombre: 'Fernanando Gomez "Poli"',
        foto: "fotos/poli.jpg",
        silueta: "silueta/bateria.jpg",
        alt: "Silueta Batería",
        rol: "Batería",
        desc: "Baterista y cofundador, amigo de Luis desde la infancia. Poli fue el motor rítmico en el salto a temas originales y sueña con llevar a Super Etendard a escenarios internacionales como Lollapalooza. 'Llegar al 2026 con cuatro álbumes más y seguir creciendo', afirma, siendo clave en el desarrollo del grupo.",
        instagram: "https://instagram.com"
    },
    {
        nombre: "Manuel Teodoroff",
        foto: "fotos/manu.jpg",
        silueta: "silueta/bajo.jpg",
        alt: "Silueta Bajo",
        rol: "Bajista",
        desc: "Se sumó en 2023 para potenciar el sonido en vivo de la banda. Manuel aporta frescura y solidez en el bajo, completando el trío y permitiendo que Super Etendard tenga una base rítmica potente en cada show. Su llegada marcó una nueva etapa para el grupo.",
        instagram: "https://instagram.com"
    }
];

const listaVideos = [
    { titulo: "SUPER ETENDART - Primer Vivo", idYoutube: "lSJ5Y0sB2z0" },
    { titulo: "SUPER ETENDART - Alto", idYoutube: "epiNyJ0ijYQ" },
    { titulo: "SUPER ETENDART - Horizontes", idYoutube: "80mnkuVfA14" },
    { titulo: "SUPER ETENDART - Ficciones", idYoutube: "giFDYRROir8" },
    { titulo: "SUPER ETENDART - Teledirigidos", idYoutube: "mvT8rdN0KOI" }
];

// Middleware para inyectar datos del menú a todas las páginas automáticamente
app.use((req, res, next) => {
    res.locals.enlacesNav = enlacesNav;
    res.locals.paginaActual = req.path;
    next();
});

// DEFINICIÓN DE RUTAS
app.get('/', (req, res) => res.render('index', { integrantes }));
app.get('/historia', (req, res) => res.render('historia'));
app.get('/album', (req, res) => res.render('album'));
app.get('/integrantes', (req, res) => res.render('integrantes', { integrantes }));
app.get('/video', (req, res) => res.render('video', { listaVideos }));

// Encender Servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor de Super Etendart corriendo en http://localhost:${PORT}`);
});
