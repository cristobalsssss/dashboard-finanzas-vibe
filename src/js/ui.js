/**
 * src/js/ui.js
 * Módulo para manejo de la interfaz de usuario: tarjetas KPI, gráficos Chart.js,
 * tabla paginada, filtros BI, exportaciones (Excel / PDF) y modal.
 */

// Instancias de los gráficos Chart.js
let expenseChartInstance = null;
let monthlyChartInstance = null;

/**
 * Formatea un monto numérico a formato moneda chilena (CLP).
 * @param {number} amount Monto a formatear.
 * @returns {string} Texto formateado en CLP.
 */
export function formatCLP(amount) {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount || 0);
}

/**
 * Obtiene clases CSS Tailwind para badges según el tipo de operación.
 * @param {string} type Tipo de operación.
 * @returns {string} Clases CSS.
 */
export function getOperationBadgeColor(type) {
    const colors = {
        'Transferencia': 'bg-blue-100 text-blue-700 border-blue-200',
        'Pago': 'bg-purple-100 text-purple-700 border-purple-200',
        'Compra': 'bg-orange-100 text-orange-700 border-orange-200',
        'Depósito': 'bg-teal-100 text-teal-700 border-teal-200',
        'Desconocido': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[type] || colors['Desconocido'];
}

/**
 * Obtiene clases CSS Tailwind para badges según la clasificación financiera.
 * @param {string} classification Clasificación financiera.
 * @returns {string} Clases CSS.
 */
export function getClassificationBadgeColor(classification) {
    const colors = {
        'Ingreso': 'bg-green-100 text-green-700 border-green-200',
        'Egreso': 'bg-red-100 text-red-700 border-red-200',
        'No_Financiero': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[classification] || colors['No_Financiero'];
}

/**
 * Calcula los totales KPI (Ingresos, Egresos, Balance Neto, Movimientos y Rango de Fechas).
 * Omite cualquier registro no financiero.
 * @param {Array} data Lista de transacciones.
 * @returns {Object} Totales calculados.
 */
export function calculateKPIs(data = []) {
    const validData = data.filter(item => {
        const clasif = (item.Clasificacion_Financiera || '').toLowerCase();
        const tipoFin = (item.Tipo_Financiero || '').toLowerCase();
        return clasif !== 'no_financiero' && tipoFin !== 'no_financiero';
    });

    const ingresos = validData.filter(item => item.Clasificacion_Financiera === 'Ingreso');
    const egresos = validData.filter(item => item.Clasificacion_Financiera === 'Egreso');

    const totalIngresos = ingresos.reduce((sum, item) => sum + (item.Monto_Numerico || 0), 0);
    const totalEgresos = egresos.reduce((sum, item) => sum + (item.Monto_Numerico || 0), 0);

    let fechaDesde = '-';
    let fechaHasta = '-';

    if (validData.length > 0) {
        const dates = validData.map(item => (item.FechaHora || '').slice(0, 10)).filter(Boolean).sort();
        if (dates.length > 0) {
            fechaDesde = dates[0];
            fechaHasta = dates[dates.length - 1];
        }
    }

    return {
        totalIngresos,
        totalEgresos,
        balanceNeto: totalIngresos - totalEgresos,
        movimientosCount: validData.length,
        fechaDesde,
        fechaHasta
    };
}

/**
 * Aplica estilos al card del balance neto manipulando de forma segura elementos SVG.
 * @param {number} balance Valor del balance.
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
 * Actualiza las tarjetas KPI en el DOM sin lanzar errores con SVGs.
 * @param {Object} kpiData Datos de KPIs.
 */
export function updateKPIs(kpiData) {
    if (!kpiData) return;

    const totalIngresosEl = document.getElementById('total-ingresos');
    const totalEgresosEl = document.getElementById('total-egresos');
    const balanceNetoEl = document.getElementById('balance-neto');
    const totalMovimientosEl = document.getElementById('total-movimientos');
    const rangoFechasKpiEl = document.getElementById('rango-fechas-kpi');

    if (totalIngresosEl) totalIngresosEl.textContent = formatCLP(kpiData.totalIngresos);
    if (totalEgresosEl) totalEgresosEl.textContent = formatCLP(kpiData.totalEgresos);
    if (balanceNetoEl) balanceNetoEl.textContent = formatCLP(kpiData.balanceNeto);
    if (totalMovimientosEl) totalMovimientosEl.textContent = kpiData.movimientosCount;

    if (rangoFechasKpiEl) {
        if (kpiData.movimientosCount > 0) {
            rangoFechasKpiEl.textContent = `Desde ${kpiData.fechaDesde} hasta ${kpiData.fechaHasta}`;
        } else {
            rangoFechasKpiEl.textContent = 'Sin registros en el rango';
        }
    }

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
 * Filtra los datos según múltiples criterios de Business Intelligence (Fechas, Entidad, Clasificación, Tipo, Búsqueda).
 * Garantiza la regla de exclusión global descartando todos los registros no financieros.
 * @param {Array} data Lista completa de movimientos.
 * @param {Object} filters Criterios de filtrado.
 * @returns {Array} Datos filtrados y ordenados.
 */
export function filterAndSortData(data = [], filters = {}) {
    const { searchQuery = '', startDate = '', endDate = '', entityFilter = '', classificationFilter = '', typeFilter = '' } = filters;

    // REGLA DE EXCLUSIÓN GLOBAL: Descartar todo movimiento no financiero
    let filtered = data.filter(item => {
        const clasif = (item.Clasificacion_Financiera || '').toLowerCase();
        const tipoFin = (item.Tipo_Financiero || '').toLowerCase();
        return clasif !== 'no_financiero' && tipoFin !== 'no_financiero';
    });

    // Filtro por búsqueda textual (Descripción o Contraparte)
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(item =>
            (item.Descripcion || '').toLowerCase().includes(query) ||
            (item.Contraparte || '').toLowerCase().includes(query)
        );
    }

    // Filtro por Rango de Fechas
    if (startDate) {
        filtered = filtered.filter(item => {
            const itemDate = (item.FechaHora || '').slice(0, 10);
            return itemDate >= startDate;
        });
    }

    if (endDate) {
        filtered = filtered.filter(item => {
            const itemDate = (item.FechaHora || '').slice(0, 10);
            return itemDate <= endDate;
        });
    }

    // Filtro por Entidad Bancaria
    if (entityFilter && entityFilter !== '') {
        filtered = filtered.filter(item => item.Entidad_Bancaria === entityFilter);
    }

    // Filtro por Clasificación Financiera
    if (classificationFilter && classificationFilter !== '') {
        filtered = filtered.filter(item => item.Clasificacion_Financiera === classificationFilter);
    }

    // Filtro por Tipo de Operación
    if (typeFilter && typeFilter !== '') {
        filtered = filtered.filter(item => item.Tipo_Operacion === typeFilter);
    }

    // Ordenar cronológicamente (más reciente primero)
    return filtered.sort((a, b) => new Date(b.FechaHora) - new Date(a.FechaHora));
}

/**
 * Paginación de datos.
 * @param {Array} data Datos filtrados.
 * @param {number} currentPage Página actual.
 * @param {number} itemsPerPage Elementos por página.
 * @returns {Object} Subconjunto de datos y total.
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
 * Renderiza la tabla de transacciones.
 * @param {Array} data Transacciones a mostrar.
 */
export function renderTransactions(data = []) {
    const tbody = document.getElementById('transactions-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-8 text-center text-sm text-gray-500">
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
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="badge inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getClassificationBadgeColor(item.Clasificacion_Financiera)}">${item.Clasificacion_Financiera || '-'}</span>
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
 * Agrupa los egresos por entidad bancaria para el gráfico de rosca.
 * @param {Array} data Movimientos.
 * @returns {Object} Etiquetas y valores.
 */
export function buildExpenseChartData(data = []) {
    const egresos = data.filter(item => item.Clasificacion_Financiera === 'Egreso');

    const expenseByEntity = {};
    let totalExpenses = 0;

    egresos.forEach(item => {
        const entity = item.Entidad_Bancaria || 'Sin Entidad';
        if (!expenseByEntity[entity]) {
            expenseByEntity[entity] = 0;
        }
        expenseByEntity[entity] += item.Monto_Numerico || 0;
        totalExpenses += item.Monto_Numerico || 0;
    });

    return {
        labels: Object.keys(expenseByEntity),
        dataPoints: Object.values(expenseByEntity),
        totalExpenses
    };
}

/**
 * Agrupa los movimientos por mes (YYYY-MM) para la evolución temporal comparativa.
 * @param {Array} data Movimientos.
 * @returns {Object} Etiquetas de meses, arreglo de ingresos y egresos.
 */
export function buildMonthlyChartData(data = []) {
    const monthlySummary = {};

    data.forEach(item => {
        if (!item.FechaHora) return;
        const monthKey = item.FechaHora.slice(0, 7); // Formato "YYYY-MM"
        if (!monthKey || monthKey.length < 7) return;

        if (!monthlySummary[monthKey]) {
            monthlySummary[monthKey] = { ingresos: 0, egresos: 0 };
        }

        if (item.Clasificacion_Financiera === 'Ingreso') {
            monthlySummary[monthKey].ingresos += item.Monto_Numerico || 0;
        } else if (item.Clasificacion_Financiera === 'Egreso') {
            monthlySummary[monthKey].egresos += item.Monto_Numerico || 0;
        }
    });

    const sortedMonths = Object.keys(monthlySummary).sort();
    const ingresosData = sortedMonths.map(m => monthlySummary[m].ingresos);
    const egresosData = sortedMonths.map(m => monthlySummary[m].egresos);

    return {
        labels: sortedMonths,
        ingresosData,
        egresosData
    };
}

/**
 * Inicializa el Gráfico 1: Distribución por Entidad Bancaria (Doughnut).
 */
export function initExpenseChart(labels = [], dataPoints = []) {
    if (typeof Chart === 'undefined') return;

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
                labels: labels.length > 0 ? labels : ['Sin datos'],
                datasets: [{
                    label: 'Egresos (CLP)',
                    data: dataPoints.length > 0 ? dataPoints : [0],
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
                        labels: { padding: 15, font: { size: 12 }, color: '#6B7280' }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `${context.label || ''}: ${formatCLP(context.raw)}`;
                            }
                        },
                        backgroundColor: 'rgba(31, 41, 55, 0.9)',
                        padding: 12
                    }
                }
            }
        });
    } catch (err) {
        console.error('Error al renderizar expenseChart:', err);
    }
}

/**
 * Inicializa el Gráfico 2: Evolución Temporal Comparativa (Ingresos vs Egresos por Mes).
 */
export function initMonthlyChart(labels = [], ingresosData = [], egresosData = []) {
    if (typeof Chart === 'undefined') return;

    try {
        if (monthlyChartInstance) {
            monthlyChartInstance.destroy();
            monthlyChartInstance = null;
        }

        const canvas = document.getElementById('monthlyChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        monthlyChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Ingresos',
                        data: ingresosData,
                        backgroundColor: '#10B981',
                        borderRadius: 6
                    },
                    {
                        label: 'Egresos',
                        data: egresosData,
                        backgroundColor: '#EF4444',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 15, font: { size: 12 }, color: '#6B7280' }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `${context.dataset.label}: ${formatCLP(context.raw)}`;
                            }
                        },
                        backgroundColor: 'rgba(31, 41, 55, 0.9)',
                        padding: 12
                    }
                },
                scales: {
                    x: {
                        grid: { display: false }
                    },
                    y: {
                        ticks: {
                            callback: function (value) {
                                return '$' + value.toLocaleString('es-CL');
                            }
                        }
                    }
                }
            }
        });
    } catch (err) {
        console.error('Error al renderizar monthlyChart:', err);
    }
}

/**
 * Actualiza ambos gráficos con los datos filtrados actuales.
 * @param {Array} data Movimientos filtrados.
 */
export function updateCharts(data = []) {
    const expenseData = buildExpenseChartData(data);
    initExpenseChart(expenseData.labels, expenseData.dataPoints);

    const monthlyData = buildMonthlyChartData(data);
    initMonthlyChart(monthlyData.labels, monthlyData.ingresosData, monthlyData.egresosData);
}

/**
 * Llena el selector de Entidad Bancaria.
 * @param {Array} data Datos completos.
 */
export function populateEntityFilter(data = []) {
    const entitySelect = document.getElementById('entityFilter');
    if (!entitySelect) return;

    const currentVal = entitySelect.value;
    entitySelect.innerHTML = '<option value="">Todas las entidades</option>';

    const uniqueEntities = [...new Set(data.map(item => item.Entidad_Bancaria).filter(Boolean))].sort();

    uniqueEntities.forEach(entity => {
        const option = document.createElement('option');
        option.value = entity;
        option.textContent = entity;
        entitySelect.appendChild(option);
    });

    if (uniqueEntities.includes(currentVal)) {
        entitySelect.value = currentVal;
    }
}

/**
 * Llena el selector de Clasificación Financiera.
 * Opciones estrictamente financieras (Ingreso, Egreso).
 * @param {Array} data Datos completos.
 */
export function populateClassificationFilter(data = []) {
    const classSelect = document.getElementById('classificationFilter');
    if (!classSelect) return;

    const currentVal = classSelect.value;
    classSelect.innerHTML = `
        <option value="">Todas las clasificaciones</option>
        <option value="Ingreso">Ingreso</option>
        <option value="Egreso">Egreso</option>
    `;

    if (currentVal && currentVal !== 'No_Financiero' && currentVal !== 'no_financiero') {
        classSelect.value = currentVal;
    }
}

/**
 * Llena el selector de Tipo de Operación.
 * @param {Array} data Datos completos.
 */
export function populateTypeFilter(data = []) {
    const typeSelect = document.getElementById('typeFilter');
    if (!typeSelect) return;

    const currentVal = typeSelect.value;
    typeSelect.innerHTML = '<option value="">Todos los tipos</option>';

    const uniqueTypes = [...new Set(data.map(item => item.Tipo_Operacion).filter(Boolean))].sort();

    uniqueTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeSelect.appendChild(option);
    });

    if (uniqueTypes.includes(currentVal)) {
        typeSelect.value = currentVal;
    }
}

/**
 * Actualiza la leyenda de paginación.
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
 * Genera y descarga un reporte en formato Excel (.xlsx) usando SheetJS ($0 costo).
 * @param {Array} data Movimientos a exportar.
 */
export function exportToExcel(data = []) {
    if (typeof XLSX === 'undefined') {
        alert('Librería SheetJS (XLSX) no disponible.');
        return;
    }

    if (data.length === 0) {
        alert('No hay datos visibles para exportar.');
        return;
    }

    const exportData = data.map(item => ({
        'FechaHora': item.FechaHora || '',
        'Entidad Bancaria': item.Entidad_Bancaria || '',
        'Tipo Operación': item.Tipo_Operacion || '',
        'Clasificación Financiera': item.Clasificacion_Financiera || '',
        'Monto (CLP)': item.Monto_Numerico || 0,
        'Contraparte': item.Contraparte || '',
        'Descripción': item.Descripcion || '',
        'Tipo Financiero': item.Tipo_Financiero || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte Financiero');

    const fileName = `Reporte_Financiero_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}

/**
 * Genera y descarga un reporte en formato PDF usando html2pdf.js ($0 costo).
 */
export function exportToPDF() {
    if (typeof html2pdf === 'undefined') {
        alert('Librería html2pdf no disponible.');
        return;
    }

    const element = document.getElementById('dashboard-content') || document.body;

    const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: `Reporte_Dashboard_Financiero_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save();
}

/**
 * Renderiza el dashboard completo.
 */
export function renderDashboard(data = [], currentPage = 1, itemsPerPage = 10) {
    try {
        const kpiData = calculateKPIs(data);
        updateKPIs(kpiData);
    } catch (err) {
        console.error('Error al actualizar KPIs:', err);
    }

    try {
        const paginated = paginateData(data, currentPage, itemsPerPage);
        renderTransactions(paginated.data);
        updatePaginationDisplay(currentPage, data.length, itemsPerPage);
    } catch (err) {
        console.error('Error al renderizar tabla:', err);
    }

    try {
        updateCharts(data);
    } catch (err) {
        console.error('Error al refrescar gráficos:', err);
    }
}

/**
 * Abre el modal de nuevo movimiento.
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
 * Cierra el modal de nuevo movimiento.
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
 * Cambia el estado visual del botón guardar.
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
 * Notificación de éxito.
 */
export function showSuccessNotification(message) {
    const existing = document.querySelectorAll('.notification-success');
    existing.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.setAttribute('class', 'notification-success fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in');
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) notification.remove();
    }, 3000);
}

/**
 * Notificación de error.
 */
export function showErrorNotification(message) {
    const existing = document.querySelectorAll('.notification-error');
    existing.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.setAttribute('class', 'notification-error fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in');
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) notification.remove();
    }, 5000);
}
