/**
 * src/api.js
 * Módulo para manejo de la comunicación con APIs externas (Google Sheets CSV y Webhook n8n)
 */

// URL del Google Sheets en formato CSV
export const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmY2cIdZKipZcic_s61HaLZ3IoPVPoPQORK9Xllap6fqnrpjr3vpXEqEkgEuVpgx034HhJvBXAmBeF/pub?gid=0&single=true&output=csv';

// URL del webhook para guardar movimientos
export const MOVEMENT_WEBHOOK_URL = 'http://localhost:5678/webhook-test/nuevo-movimiento';

/**
 * Carga y parsea el CSV desde Google Sheets utilizando PapaParse (global CDN).
 * @returns {Promise<Array>} Promesa que resuelve con los datos estructurados.
 */
export function loadCSVData() {
    return new Promise((resolve, reject) => {
        if (typeof Papa === 'undefined') {
            reject(new Error('PapaParse no está cargado. Asegúrate de incluir la librería PapaParse CDN.'));
            return;
        }

        Papa.parse(SHEET_CSV_URL, {
            download: true,
            header: true,
            complete: function (results) {
                if (!results.data) {
                    reject(new Error('No se recibieron datos del CSV'));
                    return;
                }

                // Mapear los datos del CSV a la estructura esperada
                const finanzasData = results.data
                    .filter(row => row.FechaHora || row.Monto_Numerico) // Filtrar filas vacías
                    .map(row => ({
                        Clasificacion_Financiera: row.Clasificacion_Financiera || '',
                        Tipo_Operacion: row.Tipo_Operacion || '',
                        Entidad_Bancaria: row.Entidad_Bancaria || '',
                        Monto_Numerico: parseFloat(row.Monto_Numerico) || 0,
                        Contraparte: row.Contraparte || '',
                        Descripcion: row.Descripcion || '',
                        FechaHora: row.FechaHora || '',
                        Tipo_Financiero: row.Tipo_Financiero || ''
                    }));

                resolve(finanzasData);
            },
            error: function (error) {
                reject(new Error('Error al leer el CSV: ' + error.message));
            }
        });
    });
}

/**
 * Envía un nuevo movimiento al Webhook de n8n mediante HTTP POST.
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
        throw new Error(`Error al guardar: ${response.statusText}`);
    }

    return response;
}
