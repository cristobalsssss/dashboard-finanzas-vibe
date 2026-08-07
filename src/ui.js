/**
 * src/ui.js
 * Módulo para manejo de la interfaz de usuario: renderizado de tarjetas KPI,
 * tabla de transacciones, gráficos con Chart.js y modal de nuevos movimientos.
 */

// Instancia global del gráfico Chart.js dentro del módulo
let expenseChartInstance = null;

/**
 * Formatea un número como moneda chilena (CLP).
 * @param {number} amount Monto a formatear.
 * @returns {string} Texto formateado en CLP.
 */
export function formatCLP(amount) {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount || 0);
}

/**
 * Obtiene la clase de color Tailwind para el badge según el tipo de operación.
 * @param {string} type Tipo de operación.
 * @returns {string} Clases CSS Tailwind.
 */
export function getOperationBadgeColor(type) {
    const colors = {
        'Transferencia': 'bg-blue-100 text-blue-700 border-blue-200',
        'Pago': 'bg-purple-100 text-purple-700 border-purple-200',
        'Compra': 'bg-orange-100 text-orange-700 border-orange-200',
        'Desconocido': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[type] || colors['Desconocido'];
}

/**
 * Calcula los totales para los KPIs del Dashboard.
 * @param {Array} data Lista de movimientos.
 * @returns {Object} Totales calculados.
 */
export function calculateKPIs(data = []) {
    const ingresos = data.filter(item => item.Clasificacion_Financiera === 'Ingreso');
    const egresos = data.filter(item => item.Clasificacion_Financiera === 'Egreso');

    const totalIngresos = ingresos.reduce((sum, item) => sum + (item.Monto_Numerico || 0), 0);
    const totalEgresos = egresos.reduce((sum, item) => sum + (item.Monto_Numerico || 0), 0);

    return {
        totalIngresos,
        totalEgresos,
        balanceNeto: totalIngresos - totalEgresos,
        movimientosCount: data.length
    };
}

/**
 * Aplica estilos visuales a la tarjeta de balance neto según su valor.
 * Utiliza setAttribute('class', ...) para manipular elementos SVG sin lanzar TypeError.
 * @param {number} balance Monto del balance neto.
 */
export function setBalanceCardColor(balance) {
    const card = document.getElementById('balance-card');
    if (!card) return;

    const svg = card.querySelector('.flex.items-center.justify-between.mb-4 svg');

    if (balance >= 0) {
        card.classList.remove('border-red-200', 'hover:border-red-300');
        card.classList.add('border-green-100', 'hover:border-green-300');
        if (svg) svg.setAttribute('class', 'w-8 h-8 text-ingreso fill-current');
    } else {
        card.classList.remove('border-green-100', 'hover:border-green-300');
        card.classList.add('border-red-200', 'hover:border-red-300');
        if (svg) svg.setAttribute('class', 'w-8 h-8 text-egresos fill-current');
    }
}

/**
 * Actualiza las tarjetas de KPIs en el DOM.
 * Utiliza setAttribute('class', ...) para modificar clases de los SVG de KPI de forma segura.
 * @param {Object} kpiData Datos calculados por calculateKPIs.
 */
export function updateKPIs(kpiData) {
    if (!kpiData) return;

    const totalIngresosEl = document.getElementById('total-ingresos');
    const totalEgresosEl = document.getElementById('total-egresos');
    const balanceNetoEl = document.getElementById('balance-neto');

    if (totalIngresosEl) totalIngresosEl.textContent = formatCLP(kpiData.totalIngresos);
    if (totalEgresosEl) totalEgresosEl.textContent = formatCLP(kpiData.totalEgresos);
    if (balanceNetoEl) balanceNetoEl.textContent = formatCLP(kpiData.balanceNeto);

    setBalanceCardColor(kpiData.balanceNeto);

    const kpi1Svg = document.querySelector('#kpi-section article:nth-child(1) .flex.items-center.justify-between.mb-4 svg');
    if (kpi1Svg) {
        kpi1Svg.setAttribute('class', kpiData.totalIngresos > 0 ? 'w-8 h-8 text-green-500 fill-current' : 'w-8 h-8 text-gray-400 fill-current');
    }

    const kpi2Svg = document.querySelector('#kpi-section article:nth-child(2) .flex.items-center.justify-between.mb-4 svg');
    if (kpi2Svg) {
        kpi2Svg.setAttribute('class', kpiData.totalEgresos > 0 ? 'w-8 h-8 text-red-500 fill-current' : 'w-8 h-8 text-gray-400 fill-current');
    }
}

/**
 * Filtra y ordena los datos según búsqueda textual y desplegables.
 * @param {Array} data Lista de datos.
 * @param {string} searchQuery Término de búsqueda.
 * @param {string} entityFilter Entidad seleccionada.
 * @param {string} typeFilter Tipo de operación seleccionado.
 * @returns {Array} Datos filtrados y ordenados por fecha descendente.
 */
export function filterAndSortData(data = [], searchQuery = '', entityFilter = '', typeFilter = '') {
    let filtered = [...data];

    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(item =>
            (item.Descripcion || '').toLowerCase().includes(query) ||
            (item.Contraparte || '').toLowerCase().includes(query)
        );
    }

    if (entityFilter && entityFilter !== '') {
        filtered = filtered.filter(item => item.Entidad_Bancaria === entityFilter);
    }

    if (typeFilter && typeFilter !== '') {
        filtered = filtered.filter(item => item.Tipo_Operacion === typeFilter);
    }

    return filtered.sort((a, b) => new Date(b.FechaHora) - new Date(a.FechaHora));
}

/**
 * Obtiene la porción paginada de datos.
 * @param {Array} data Lista de datos.
 * @param {number} currentPage Página actual.
 * @param {number} itemsPerPage Elementos por página.
 * @returns {Object} Subconjunto de datos y total filtrado.
 */
export function paginateData(data = [], currentPage = 1, itemsPerPage = 10) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
        data: data.slice(startIndex, endIndex),
        totalFiltered: data.length
    };
}

/**
 * Renderiza las filas de la tabla de transacciones de forma segura.
 * @param {Array} data Lista de transacciones a renderizar.
 */
export function renderTransactions(data = []) {
    const tbody = document.getElementById('transactions-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-sm text-gray-500">
                    No se encontraron movimientos que coincidan con los filtros aplicados.
                </td>
            </tr>
        `;
        return;
    }

    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.setAttribute('class', 'hover:bg-gray-50 transition-colors duration-150');

        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${item.FechaHora || '-'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                <span class="badge inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors cursor-pointer">${item.Entidad_Bancaria || '-'}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="badge inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getOperationBadgeColor(item.Tipo_Operacion)} hover:scale-105 transition-transform cursor-pointer">${item.Tipo_Operacion || 'Desconocido'}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${item.Clasificacion_Financiera === 'Ingreso' ? 'text-green-600' : 'text-gray-900'}">
                ${formatCLP(item.Monto_Numerico)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title="${item.Descripcion || ''}">
                ${item.Descripcion || '-'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-[200px] truncate" title="${item.Contraparte || ''}">
                ${item.Contraparte || '-'}
            </td>
        `;

        tbody.appendChild(tr);
    });
}

/**
 * Agrupa los egresos por entidad bancaria para alimentar el gráfico.
 * @param {Array} data Lista de movimientos.
 * @returns {Object} Etiquetas, puntos de datos y total.
 */
export function buildExpenseChartData(data = []) {
    const egresos = data.filter(item => item.Clasificacion_Financiera === 'Egreso');

    const expenseByEntity = {};
    let totalExpenses = 0;

    egresos.forEach(item => {
        if (!expenseByEntity[item.Entidad_Bancaria]) {
            expenseByEntity[item.Entidad_Bancaria] = 0;
        }
        expenseByEntity[item.Entidad_Bancaria] += item.Monto_Numerico || 0;
        totalExpenses += item.Monto_Numerico || 0;
    });

    const labels = Object.keys(expenseByEntity);
    const dataPoints = Object.values(expenseByEntity);

    return { labels, dataPoints, totalExpenses };
}

/**
 * Inicializa o re-renderiza el gráfico Chart.js de egresos de forma segura.
 * @param {Array<string>} labels Etiquetas.
 * @param {Array<number>} dataPoints Valores numéricos.
 */
export function initChart(labels = [], dataPoints = []) {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js no está cargado.');
        return;
    }

    try {
        if (expenseChartInstance) {
            expenseChartInstance.destroy();
            expenseChartInstance = null;
        }

        const canvas = document.getElementById('expenseChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        expenseChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Egresos por Entidad Bancaria (CLP)',
                    data: dataPoints,
                    backgroundColor: [
                        '#EF4444', '#F97316', '#FB923C', '#FDBA74',
                        '#84CC16', '#10B981', '#34D399', '#0EA5E9',
                        '#3B82F6', '#60A5FA', '#A78BFA', '#8B5CF6'
                    ],
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: { size: 12 },
                            color: '#6B7280'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const entity = context.label || '';
                                const value = context.raw;
                                return `${entity}: ${formatCLP(value)}`;
                            }
                        },
                        backgroundColor: 'rgba(31, 41, 55, 0.9)',
                        padding: 12,
                        titleFont: { size: 13 },
                        bodyFont: { size: 12 }
                    }
                }
            }
        });
    } catch (err) {
        console.error('Error al inicializar Chart.js:', err);
    }
}

/**
 * Actualiza el gráfico con los datos filtrados.
 * @param {Array} data Datos actuales.
 */
export function updateCharts(data = []) {
    const chartData = buildExpenseChartData(data);
    initChart(chartData.labels, chartData.dataPoints);
}

/**
 * Llena el selector de entidad bancaria con opciones únicas.
 * @param {Array} data Lista completa de movimientos.
 */
export function populateEntityFilter(data = []) {
    const entitySelect = document.getElementById('entityFilter');
    if (!entitySelect) return;

    entitySelect.innerHTML = '<option value="">Todas las entidades</option>';

    const uniqueEntities = [...new Set(data.map(item => item.Entidad_Bancaria).filter(Boolean))].sort();

    uniqueEntities.forEach(entity => {
        const option = document.createElement('option');
        option.value = entity;
        option.textContent = entity;
        entitySelect.appendChild(option);
    });
}

/**
 * Llena el selector de tipo de operación con opciones únicas.
 * @param {Array} data Lista completa de movimientos.
 */
export function populateTypeFilter(data = []) {
    const typeSelect = document.getElementById('typeFilter');
    if (!typeSelect) return;

    typeSelect.innerHTML = '<option value="">Todos los tipos</option>';

    const uniqueTypes = [...new Set(data.map(item => item.Tipo_Operacion).filter(Boolean))].sort();

    uniqueTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeSelect.appendChild(option);
    });
}

/**
 * Actualiza la información de la paginación en el DOM.
 * @param {number} currentPage Página actual.
 * @param {number} totalFilteredData Cantidad de elementos filtrados.
 * @param {number} itemsPerPage Elementos por página.
 */
export function updatePaginationDisplay(currentPage = 1, totalFilteredData = 0, itemsPerPage = 10) {
    const currentPageEl = document.getElementById('current-page');
    if (currentPageEl) currentPageEl.textContent = currentPage;

    const totalPages = Math.max(1, Math.ceil(totalFilteredData / itemsPerPage));
    const totalPagesEl = document.getElementById('total-pages');
    if (totalPagesEl) totalPagesEl.textContent = totalPages;

    const start = totalFilteredData > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const end = Math.min(currentPage * itemsPerPage, totalFilteredData);

    const startEl = document.getElementById('display-start');
    const endEl = document.getElementById('display-end');
    const totalEl = document.getElementById('total-results');

    if (startEl) startEl.textContent = start;
    if (endEl) endEl.textContent = end;
    if (totalEl) totalEl.textContent = totalFilteredData;

    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');

    if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages || totalPages <= 1;
}

/**
 * Procesa la visualización completa del Dashboard (KPIs, Tabla y Gráficos).
 * Garantiza que ninguna falla detenga la ejecución de JavaScript.
 * @param {Array} data Lista completa o filtrada de transacciones.
 * @param {number} currentPage Página actual.
 * @param {number} itemsPerPage Elementos por página.
 */
export function renderDashboard(data = [], currentPage = 1, itemsPerPage = 10) {
    try {
        const kpiData = calculateKPIs(data);
        updateKPIs(kpiData);
    } catch (err) {
        console.error('Error al actualizar KPIs en renderDashboard:', err);
    }

    try {
        const paginated = paginateData(data, currentPage, itemsPerPage);
        renderTransactions(paginated.data);
        updatePaginationDisplay(currentPage, data.length, itemsPerPage);
    } catch (err) {
        console.error('Error al renderizar tabla en renderDashboard:', err);
    }

    try {
        updateCharts(data);
    } catch (err) {
        console.error('Error al refrescar gráficos en renderDashboard:', err);
    }
}

/**
 * Abre el modal de nuevo movimiento y asigna la fecha actual.
 */
export function openNewMovementModal() {
    const modal = document.getElementById('newMovementModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const dateHourInput = document.getElementById('dateHour');
    if (dateHourInput) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        dateHourInput.value = now.toISOString().slice(0, 16);
    }
}

/**
 * Cierra el modal de nuevo movimiento y reinicia el formulario.
 * @param {boolean} isSaving Indica si actualmente se está procesando un guardado.
 */
export function closeNewMovementModal(isSaving = false) {
    if (isSaving) return;

    const modal = document.getElementById('newMovementModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');

    const form = document.getElementById('newMovementForm');
    if (form) form.reset();
}

/**
 * Cambia el estado visual del botón Guardar durante peticiones asíncronas.
 * @param {boolean} isLoading True si está cargando/guardando.
 */
export function setSaveButtonState(isLoading) {
    const saveBtn = document.getElementById('saveBtn');
    const saveText = document.getElementById('saveText');
    const saveIcon = document.getElementById('saveIcon');

    if (!saveBtn || !saveText || !saveIcon) return;

    if (isLoading) {
        saveBtn.disabled = true;
        saveText.textContent = 'Guardando...';
        saveIcon.classList.add('animate-spin');
    } else {
        saveBtn.disabled = false;
        saveText.textContent = 'Guardar Movimiento';
        saveIcon.classList.remove('animate-spin');
    }
}

/**
 * Muestra un mensaje flotante de éxito.
 * @param {string} message Texto a mostrar.
 */
export function showSuccessNotification(message) {
    const existingNotifications = document.querySelectorAll('.notification-success');
    existingNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.setAttribute('class', 'notification-success fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in');
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

/**
 * Muestra un mensaje flotante de error.
 * @param {string} message Texto a mostrar.
 */
export function showErrorNotification(message) {
    const existingNotifications = document.querySelectorAll('.notification-error');
    existingNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.setAttribute('class', 'notification-error fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in');
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}
