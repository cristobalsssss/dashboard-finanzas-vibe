/**
 * src/js/config.js
 * Configuración centralizada y dinámica de URLs y Endpoints de la aplicación.
 * 
 * Determina automáticamente el entorno de ejecución (Desarrollo Local vs Producción Vercel)
 * y resuelve los endpoints correspondientes de n8n para el Chatbot y el Registro de Movimientos.
 * También permite sobrescritura mediante variables de entorno de Vite (VITE_*).
 */

// 1. Detección dinámica de entorno
function detectIsLocal() {
    // Si se especifica explícitamente mediante variable de entorno
    if (import.meta.env?.VITE_APP_ENV) {
        return import.meta.env.VITE_APP_ENV === 'local' || import.meta.env.VITE_APP_ENV === 'development';
    }

    // Comprobación en navegador por hostname
    if (typeof window !== 'undefined' && window.location) {
        const hostname = window.location.hostname;
        const isLocalHostName = 
            hostname === 'localhost' || 
            hostname === '127.0.0.1' || 
            hostname === '[::1]' ||
            hostname.endsWith('.local') ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.startsWith('172.16.');
        
        if (isLocalHostName) return true;
        if (hostname.includes('vercel.app')) return false;
    }

    // Detección nativa de Vite
    return Boolean(import.meta.env?.DEV);
}

const isLocal = detectIsLocal();
const isProduction = !isLocal;
const environment = isLocal ? 'local' : 'production';

// 2. Diccionario de Endpoints por Entorno
const ENDPOINTS = {
    LOCAL: {
        BASE_WEBHOOK: 'http://localhost:5678/webhook/',
        BASE_WEBHOOK_TEST: 'http://localhost:5678/webhook-test/',
        CHAT_TEST: 'http://localhost:5678/webhook-test/chat-financiero',
        CHAT_PROD: 'http://localhost:5678/webhook/chat-financiero',
        MOVEMENT_TEST: 'http://localhost:5678/webhook-test/nuevo-movimiento',
        MOVEMENT_PROD: 'http://localhost:5678/webhook/nuevo-movimiento'
    },
    RENDER: {
        BASE_WEBHOOK: 'https://n8n-backend-finanzas.onrender.com/webhook/',
        CHAT_PROD: 'https://n8n-backend-finanzas.onrender.com/webhook/chat-financiero',
        MOVEMENT_PROD: 'https://n8n-backend-finanzas.onrender.com/webhook/nuevo-movimiento'
    }
};

// 3. Resolución Dinámica de URLs Activas
// Chatbot: En local apunta a webhook-test (con alternativa webhook) | En Render apunta al webhook de producción
const resolvedChatUrl = import.meta.env?.VITE_CHAT_WEBHOOK_URL || (
    isLocal ? ENDPOINTS.LOCAL.CHAT_TEST : ENDPOINTS.RENDER.CHAT_PROD
);

// Nuevo Movimiento: En local apunta a webhook-test (con alternativa webhook) | En Render apunta al webhook de producción
const resolvedMovementUrl = import.meta.env?.VITE_MOVEMENT_WEBHOOK_URL || (
    isLocal ? ENDPOINTS.LOCAL.MOVEMENT_TEST : ENDPOINTS.RENDER.MOVEMENT_PROD
);

export const CONFIG = {
    // Entorno activo
    isLocal,
    isProduction,
    environment,

    // URL del Google Sheets público en formato CSV
    SHEET_CSV_URL: import.meta.env?.VITE_SHEET_CSV_URL || 
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmY2cIdZKipZcic_s61HaLZ3IoPVPoPQORK9Xllap6fqnrpjr3vpXEqEkgEuVpgx034HhJvBXAmBeF/pub?output=csv',

    // Fallback de datos locales
    FALLBACK_JSON_URL: import.meta.env?.VITE_FALLBACK_JSON_URL || '/data/mock_finanzas.json',

    // Webhooks resueltos dinámicamente
    MOVEMENT_WEBHOOK_URL: resolvedMovementUrl,
    CHAT_WEBHOOK_URL: resolvedChatUrl,

    // Catálogo de endpoints estructurado
    ENDPOINTS
};

// Logging informativo al inicializar
console.log(`[Config] Entorno activo: %c${environment.toUpperCase()}`, 'color: #3b82f6; font-weight: bold;');
console.log(`[Config] Chatbot Webhook URL: ${CONFIG.CHAT_WEBHOOK_URL}`);
console.log(`[Config] Nuevo Movimiento Webhook URL: ${CONFIG.MOVEMENT_WEBHOOK_URL}`);
