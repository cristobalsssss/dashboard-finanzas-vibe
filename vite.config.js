import { defineConfig } from 'vite';

export default defineConfig({
    // Raíz del proyecto: index.html en la raíz
    root: '.',

    // Archivos estáticos (public/data/mock_finanzas.json se sirve como /data/mock_finanzas.json)
    publicDir: 'public',

    build: {
        // Directorio de salida del build de producción
        outDir: 'dist',
        emptyOutDir: true
    },

    server: {
        // Puerto de desarrollo local
        port: 5173
    }
});
