/**
 * src/js/api.js
 * Módulo para comunicación con APIs externas (Google Sheets CSV y Webhook n8n)
 */

// URL pública del Google Sheets en formato CSV (fuente de datos principal)
export const SHEET_CSV_URL =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmY2cIdZKipZcic_s61HaLZ3IoPVPoPQORK9Xllap6fqnrpjr3vpXEqEkgEuVpgx034HhJvBXAmBeF/pub?output=csv';

// URL del fallback de datos locales (sirve tanto en dev como en Vercel desde /public)
export const FALLBACK_JSON_URL = './data/mock_finanzas.json';

// URL del Webhook para guardar movimientos en n8n
export const MOVEMENT_WEBHOOK_URL = 'http://localhost:5678/webhook-test/nuevo-movimiento';

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
 * @param {Object} formData Datos del nuevo movimiento.
 * @returns {Promise<Response>} Respuesta de la petición HTTP fetch.
 */
export async function sendMovementWebhook(formData) {
    const response = await fetch(MOVEMENT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    });

    if (!response.ok) {
        throw new Error(`Error al guardar en Webhook: ${response.statusText}`);
    }

    return response;
}
