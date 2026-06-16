const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || process.env.RAW_MONGO_URI || '';
if (!uri) {
    console.error('No hay MONGODB_URI en el entorno. Ejemplo de uso:\n\n$env:MONGODB_URI="mongodb+srv://user:pass@cluster0..."; node scripts/test-mongo.js');
    process.exit(1);
}

(async () => {
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('Conexión a MongoDB exitosa.');
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error conectando a MongoDB:', err && err.message ? err.message : err);
        process.exit(2);
    }
})();
