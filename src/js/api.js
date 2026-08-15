/**
 * src/js/api.js
 * Módulo para comunicación con APIs externas (Google Sheets CSV y Webhooks n8n)
 */

import { CONFIG } from './config.js';

// Re-exportar URLs desde la configuración centralizada
export const SHEET_CSV_URL = CONFIG.SHEET_CSV_URL;
export const FALLBACK_JSON_URL = CONFIG.FALLBACK_JSON_URL;
export const MOVEMENT_WEBHOOK_URL = CONFIG.MOVEMENT_WEBHOOK_URL;
export const CHAT_WEBHOOK_URL = CONFIG.CHAT_WEBHOOK_URL;

/**
 * Aplica la regla de exclusión global: descarta movimientos no financieros.
 * @param {Array} rows Filas crudas del CSV o JSON.
 * @returns {Array} Datos financieros limpios.
 */
function parseAndFilterRows(rows) {
    return rows
        .filter(row => row.FechaHora || row.Monto_Numerico || row.Entidad_Bancaria)
        .map(row => ({
            Clasificacion_Financiera: (row.Clasificacion_Financiera || '').trim(),
            Tipo_Operacion: (row.Tipo_Operacion || '').trim(),
            Entidad_Bancaria: (row.Entidad_Bancaria || '').trim(),
            Monto_Numerico: parseFloat(row.Monto_Numerico) || 0,
            Contraparte: (row.Contraparte || '').trim(),
            Descripcion: (row.Descripcion || '').trim(),
            FechaHora: (row.FechaHora || '').trim(),
            Tipo_Financiero: (row.Tipo_Financiero || '').trim()
        }))
        // REGLA DE EXCLUSIÓN GLOBAL: descartar registros no financieros
        .filter(item => {
            const clasif = item.Clasificacion_Financiera.toLowerCase();
            const tipoFin = item.Tipo_Financiero.toLowerCase();
            return clasif !== 'no_financiero' && tipoFin !== 'no_financiero';
        });
}

/**
 * Carga datos financieros desde Google Sheets CSV (PapaParse).
 * Si falla, hace fallback a datos locales en /public/data/mock_finanzas.json.
 * @returns {Promise<Array>} Datos financieros estructurados y filtrados.
 */
export function loadCSVData() {
    return new Promise((resolve, reject) => {
        console.log('[Dashboard Financiero] Iniciando carga de datos desde:', SHEET_CSV_URL);

        if (typeof Papa === 'undefined') {
            reject(new Error('PapaParse no está cargado. Verifique las librerías CDN en index.html.'));
            return;
        }

        Papa.parse(SHEET_CSV_URL, {
            download: true,
            header: true,
            complete: function (results) {
                if (!results.data || results.data.length === 0) {
                    console.warn('[Dashboard Financiero] Google Sheets devolvió datos vacíos. Cargando fallback local...');
                    loadFallbackData().then(resolve).catch(reject);
                    return;
                }

                const finanzasData = parseAndFilterRows(results.data);

                if (finanzasData.length === 0) {
                    console.warn('[Dashboard Financiero] CSV procesado pero sin registros financieros válidos. Cargando fallback...');
                    loadFallbackData().then(resolve).catch(reject);
                    return;
                }

                console.log(`[Dashboard Financiero] ${finanzasData.length} registros financieros cargados desde Google Sheets.`);
                resolve(finanzasData);
            },
            error: function (error) {
                console.error('[Dashboard Financiero] Error al leer el CSV de Google Sheets:', error.message);
                console.log('[Dashboard Financiero] Intentando fallback local:', FALLBACK_JSON_URL);
                loadFallbackData().then(resolve).catch(reject);
            }
        });
    });
}

/**
 * Carga datos de respaldo desde /public/data/mock_finanzas.json.
 * Funciona en local (Vite dev) y en producción (Vercel) sin devolver 404.
 * @returns {Promise<Array>} Datos del JSON de fallback.
 */
async function loadFallbackData() {
    console.log('[Dashboard Financiero] Cargando fallback desde:', FALLBACK_JSON_URL);

    const response = await fetch(FALLBACK_JSON_URL);

    if (!response.ok) {
        throw new Error(`Fallback no disponible (${response.status}): ${FALLBACK_JSON_URL}`);
    }

    const jsonData = await response.json();
    const filtered = parseAndFilterRows(jsonData);

    console.log(`[Dashboard Financiero] ${filtered.length} registros cargados desde datos locales de respaldo.`);
    return filtered;
}

/**
 * Envía un nuevo movimiento mediante HTTP POST al Webhook de n8n.
 * Resuelve automáticamente entre localhost y producción Render según el entorno.
 * @param {Object} formData Datos del nuevo movimiento.
 * @returns {Promise<Response>} Respuesta de la petición HTTP fetch.
 */
export async function sendMovementWebhook(formData) {
    const url = CONFIG.MOVEMENT_WEBHOOK_URL;
    console.log(`[API Movimientos] Enviando nuevo movimiento a [${CONFIG.environment.toUpperCase()}]:`, url);

    let response;
    try {
        response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
    } catch (fetchErr) {
        console.error(`[API Movimientos] Error de conexión con ${url}:`, fetchErr);
        throw fetchErr;
    }

    // Fallback inteligente en desarrollo local: si el webhook de prueba devuelve 404, reintentar con el webhook de producción local
    if (!response.ok && response.status === 404 && CONFIG.isLocal && url === CONFIG.ENDPOINTS.LOCAL.MOVEMENT_TEST) {
        console.warn('[API Movimientos] Webhook de test 404 (inactivo en n8n). Probando webhook local de producción:', CONFIG.ENDPOINTS.LOCAL.MOVEMENT_PROD);
        try {
            const fallbackResponse = await fetch(CONFIG.ENDPOINTS.LOCAL.MOVEMENT_PROD, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (fallbackResponse.ok) {
                return fallbackResponse;
            }
        } catch (fallbackErr) {
            console.warn('[API Movimientos] Reintento de fallback local no disponible:', fallbackErr);
        }
    }

    if (!response.ok) {
        throw new Error(`Error al guardar en Webhook (${response.status}): ${response.statusText}`);
    }

    return response;
}

/**
 * Envía un mensaje en lenguaje natural al Webhook de Chatbot de n8n.
 * Soporta respuestas JSON, texto plano y detección de registros financieros para reactividad.
 * 
 * @param {string} userMessage Mensaje ingresado por el usuario.
 * @param {string} [customUrl] URL opcional para sobreescribir el endpoint por defecto.
 * @returns {Promise<{text: string, movementRegistered: boolean, raw: any}>} Respuesta procesada.
 */
export async function sendChatMessage(userMessage, customUrl = null) {
    const url = customUrl || CONFIG.CHAT_WEBHOOK_URL;
    console.log(`[Chatbot AI] Enviando mensaje a [${CONFIG.environment.toUpperCase()}]:`, url);

    const payload = {
        question: userMessage,
        chatInput: userMessage,
        message: userMessage,
        timestamp: new Date().toISOString()
    };

    let response;
    try {
        response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    } catch (fetchErr) {
        console.error(`[Chatbot AI] Error de conexión con ${url}:`, fetchErr);
        throw fetchErr;
    }

    // Fallback inteligente en desarrollo local: si el webhook de prueba devuelve 404, reintentar con el webhook de producción local
    if (!response.ok && response.status === 404 && CONFIG.isLocal && !customUrl && url === CONFIG.ENDPOINTS.LOCAL.CHAT_TEST) {
        console.warn('[Chatbot AI] Webhook de test 404 (inactivo en n8n). Probando webhook local de producción:', CONFIG.ENDPOINTS.LOCAL.CHAT_PROD);
        try {
            const fallbackResponse = await fetch(CONFIG.ENDPOINTS.LOCAL.CHAT_PROD, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (fallbackResponse.ok) {
                response = fallbackResponse;
            }
        } catch (fallbackErr) {
            console.warn('[Chatbot AI] Reintento de fallback local no disponible:', fallbackErr);
        }
    }

    if (!response.ok) {
        throw new Error(`Error del servidor n8n (${response.status}): ${response.statusText}`);
    }

    // Procesar cuerpo de la respuesta (JSON o Texto plano)
    const contentType = response.headers.get('content-type') || '';
    let rawData = null;
    let replyText = '';
    let movementRegistered = false;

    if (contentType.includes('application/json')) {
        rawData = await response.json();

        // Extraer texto conversacional según el formato de respuesta del nodo n8n
        if (typeof rawData === 'string') {
            replyText = rawData;
        } else if (Array.isArray(rawData) && rawData.length > 0) {
            const firstItem = rawData[0];
            replyText = firstItem.output || firstItem.text || firstItem.message || firstItem.response || JSON.stringify(firstItem);
            movementRegistered = Boolean(
                firstItem.action_performed === 'append_row' ||
                firstItem.registered === true ||
                firstItem.movement_created === true ||
                firstItem.action === 'append'
            );
        } else if (typeof rawData === 'object' && rawData !== null) {
            replyText = rawData.output || rawData.text || rawData.message || rawData.response || rawData.reply || JSON.stringify(rawData);
            movementRegistered = Boolean(
                rawData.action_performed === 'append_row' ||
                rawData.registered === true ||
                rawData.movement_created === true ||
                rawData.action === 'append'
            );
        }
    } else {
        replyText = await response.text();
        rawData = replyText;
    }

    // Regla de detección heurística si el backend devuelve un texto confirmando el registro
    const lowerReply = (replyText || '').toLowerCase();
    const indicatesRegistration = 
        lowerReply.includes('he registrado') || 
        lowerReply.includes('se ha registrado') || 
        lowerReply.includes('movimiento registrado') ||
        lowerReply.includes('gasto registrado') ||
        lowerReply.includes('ingreso registrado') ||
        lowerReply.includes('guardado exitosamente') ||
        lowerReply.includes('anotado exitosamente') ||
        lowerReply.includes('fila agregada');

    if (indicatesRegistration) {
        movementRegistered = true;
    }

    return {
        text: replyText || 'El CFO procesó la consulta sin respuesta de texto.',
        movementRegistered,
        raw: rawData
    };
}
