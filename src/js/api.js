/**
 * src/js/api.js
 * Módulo para comunicación con APIs externas (Google Sheets CSV y Webhook n8n)
 */

// URL del Google Sheets en formato CSV
export const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmY2cIdZKipZcic_s61HaLZ3IoPVPoPQORK9Xllap6fqnrpjr3vpXEqEkgEuVpgx034HhJvBXAmBeF/pub?gid=0&single=true&output=csv';

// URL del Webhook para guardar movimientos en n8n
export const MOVEMENT_WEBHOOK_URL = 'http://localhost:5678/webhook-test/nuevo-movimiento';

/**
 * Carga y parsea los datos CSV desde Google Sheets usando PapaParse.
 * Aplica una regla de exclusión global para descartar todos los movimientos no financieros.
 * @returns {Promise<Array>} Datos financieros estructurados.
 */
export function loadCSVData() {
    return new Promise((resolve, reject) => {
        if (typeof Papa === 'undefined') {
            reject(new Error('PapaParse no está cargado. Verifique las librerías CDN en index.html.'));
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

                const finanzasData = results.data
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
                    // REGLA DE EXCLUSIÓN GLOBAL: Descartar movimientos no financieros
                    .filter(item => {
                        const clasif = item.Clasificacion_Financiera.toLowerCase();
                        const tipoFin = item.Tipo_Financiero.toLowerCase();
                        return clasif !== 'no_financiero' && tipoFin !== 'no_financiero';
                    });

                resolve(finanzasData);
            },
            error: function (error) {
                reject(new Error('Error al leer el CSV: ' + error.message));
            }
        });
    });
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
