# 🎸 SUPER ETENDART - Plataforma Web Full-Stack para Bandas

Plataforma web real e institucional desarrollada para la banda de rock emergente **SUPER ETENDART**. El proyecto combina un sitio web de alta estética responsive con un backend robusto para la gestión de contenidos y una comunidad de fanáticos.

## 🛠️ Tecnologías Utilizadas

- **Backend:** Node.js, Express.js
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla), EJS (Embedded JavaScript Templates)
- **Base de Datos:** MongoDB & Mongoose ORM
- **Almacenamiento de Medios:** Vercel Blob (Cloud Storage permanente)
- **Seguridad y Autenticación:** Express-Session, Connect-Mongo, Bcrypt
- **Pruebas y Calidad de Código:** Jest, Supertest, Istanbul nyc (Code Coverage)
- **Servicios Cloud & Automatización:** Nodemailer (Integración con Gmail), Dotenv

---

## 🗺️ Hoja de Ruta del Proyecto (Roadmap)

### 🚀 Fase 1: Base Actual (Hecho)
* **Estado**: Implementado y funcional en producción.
* **Características**:
  * Sitio web institucional de la banda con diseño oscuro y estético.
  * Secciones informativas y optimización para visualización en Vercel.

### 📸 Fase 2: Galería Dinámica e Interacciones (Hecho)
* **Objetivo**: Añadir el feed estilo Instagram y el control de accesos.
* **Desarrollo**:
  * Integración de base de datos con **Mongoose (MongoDB)** y almacenamiento en **Vercel Blob**.
  * Sistema de inicio de sesión simplificado por códigos de invitación separados y protegidos por variables de entorno con normalización automática a mayúsculas (UX).
  * **Acceso Admin (Dueño)**: Panel secreto para subir, ordenar y eliminar fotos con límite gratuito automatizado.
  * **Acceso Fan (Usuario)**: Habilitación del feed con scroll infinito (Lazy Loading) y sistema de reacciones (Me gusta) persistentes.

### 🛒 Fase 3: E-commerce y Expansión (Futuro)
* **Objetivo**: Monetizar y fidelizar la comunidad de la banda.
* **Posibilidades**:
  * **Banda Market**: Catálogo de productos (remeras, discos, gorras) gestionado por el administrador.
  * **Carrito de Compras**: Aprovechar las sesiones ya divididas de los fans para gestionar productos seleccionados.
  * **Venta de Entradas**: Integración de pasarelas de pago (Mercado Pago / PayPal) para shows en vivo.
  * **Nuevas Ideas**: Apertura a funciones dinámicas que surjan según las necesidades de la banda.

---

## 🧪 Ingeniería de Calidad (Testing Automatizado)

El entorno local cuenta con una infraestructura de pruebas automatizadas configurada para garantizar la estabilidad de las rutas críticas del backend:
- **Pruebas de Integración:** Uso de **Supertest** para simular peticiones HTTP (`POST /register`, `POST /login`) y validar respuestas del servidor en memoria sin levantar puertos físicos.
- **Reporte de Cobertura:** Configuración nativa de **Jest** con reporte de Cobertura de Código (Code Coverage estilo JaCoCo mediante Istanbul) ejecutable directamente desde la consola mediante el script `npm test`.

---

## 🔒 Buenas Prácticas de Ingeniería Implementadas

1. **Seguridad en Producción:** Configuración de cookies de sesión con atributos `secure: true` (HTTPS forzado en Vercel) y `sameSite: 'lax'` para mitigar ataques CSRF. Todas las credenciales críticas están blindadas en variables de entorno seguras.
2. **Manejo de Fallbacks:** Lógica adaptativa en la subida de archivos; la aplicación detecta el entorno de ejecución y conmuta automáticamente entre almacenamiento local y en la nube sin interrumpir el servicio.
