/**
 * src/js/config.js
 * Configuración centralizada y dinámica de URLs y Endpoints de la aplicación.
 * Permite cambiar entre entorno local y producción mediante variables de entorno Vite (VITE_*)
 * o ajustando los valores por defecto sin alterar el código de los módulos.
 */

// Entorno activo ('local' | 'production')
const isProduction = import.meta.env?.PROD || false;

// Configuración de Webhooks n8n
export const CONFIG = {
    // URL del Google Sheets público en formato CSV
    SHEET_CSV_URL: import.meta.env?.VITE_SHEET_CSV_URL || 
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmY2cIdZKipZcic_s61HaLZ3IoPVPoPQORK9Xllap6fqnrpjr3vpXEqEkgEuVpgx034HhJvBXAmBeF/pub?output=csv',

    // Fallback de datos locales
    FALLBACK_JSON_URL: import.meta.env?.VITE_FALLBACK_JSON_URL || '/data/mock_finanzas.json',

    // Webhook para registro manual de movimientos
    MOVEMENT_WEBHOOK_URL: import.meta.env?.VITE_MOVEMENT_WEBHOOK_URL || 
        'https://n8n-backend-finanzas.onrender.com/webhook/nuevo-movimiento',

    // Webhook del Asistente Conversacional (Chatbot CFO)
    // Para pruebas locales: http://localhost:5678/webhook-test/chat-financiero (o /webhook/chat-financiero)
    // Para producción en Render: https://n8n-backend-finanzas.onrender.com/webhook/chat-financiero
    CHAT_WEBHOOK_URL: import.meta.env?.VITE_CHAT_WEBHOOK_URL || 
        'http://localhost:5678/webhook-test/chat-financiero',

    // Alternativas preparadas para intercambio rápido
    ENDPOINTS: {
        CHAT_LOCAL_TEST: 'http://localhost:5678/webhook-test/chat-financiero',
        CHAT_LOCAL_PROD: 'http://localhost:5678/webhook/chat-financiero',
        CHAT_RENDER_PROD: 'https://n8n-backend-finanzas.onrender.com/webhook/chat-financiero'
    }
};
