/**
 * src/js/app.js
 * Punto de entrada principal para Vite y orquestador del Dashboard BI.
 */

import { loadCSVData, sendMovementWebhook } from './api.js';
import {
    filterAndSortData,
    renderDashboard,
    populateEntityFilter,
    populateClassificationFilter,
    populateTypeFilter,
    exportToExcel,
    exportToPDF,
    openNewMovementModal,
    closeNewMovementModal,
    setSaveButtonState,
    showSuccessNotification,
    showErrorNotification
} from './ui.js';

// Estado global de la aplicación
let finanzasData = [];
let filteredData = [];
let totalFilteredData = 0;
const itemsPerPage = 10;
let currentPage = 1;
let isSaving = false;

/**
 * Obtiene el objeto de filtros BI activos desde los controles del DOM.
 * @returns {Object} Filtros seleccionados.
 */
function getActiveFilters() {
    return {
        searchQuery: document.getElementById('searchInput')?.value || '',
        startDate: document.getElementById('startDate')?.value || '',
        endDate: document.getElementById('endDate')?.value || '',
        entityFilter: document.getElementById('entityFilter')?.value || '',
        classificationFilter: document.getElementById('classificationFilter')?.value || '',
        typeFilter: document.getElementById('typeFilter')?.value || ''
    };
}

/**
 * Aplica los filtros activos, recalcula los datos y actualiza la vista.
 */
function handleFilters() {
    const filters = getActiveFilters();
    filteredData = filterAndSortData(finanzasData, filters);
    totalFilteredData = filteredData.length;
    currentPage = 1; // Reiniciar a primera página al filtrar

    renderCurrentPage();
}

/**
 * Restablece todos los filtros al estado original y recarga la vista global.
 */
function resetFilters() {
    const searchInput = document.getElementById('searchInput');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const entityFilter = document.getElementById('entityFilter');
    const classificationFilter = document.getElementById('classificationFilter');
    const typeFilter = document.getElementById('typeFilter');

    if (searchInput) searchInput.value = '';
    if (startDate) startDate.value = '';
    if (endDate) endDate.value = '';
    if (entityFilter) entityFilter.value = '';
    if (classificationFilter) classificationFilter.value = '';
    if (typeFilter) typeFilter.value = '';

    handleFilters();
}

/**
 * Renderiza la página actual de resultados.
 */
function renderCurrentPage() {
    renderDashboard(filteredData, currentPage, itemsPerPage);
}

/**
 * Refresca el dashboard al ingresar un nuevo movimiento.
 * Descarta movimientos no financieros según la regla de negocio global.
 * @param {Object} newMovement Nuevo objeto movimiento.
 */
function refreshDashboardData(newMovement) {
    const clasif = (newMovement.Clasificacion_Financiera || '').toLowerCase();
    const tipoFin = (newMovement.Tipo_Financiero || '').toLowerCase();

    // Regla de Negocio Global: Solo integrar movimientos financieros
    if (clasif !== 'no_financiero' && tipoFin !== 'no_financiero') {
        finanzasData.unshift(newMovement);
    }

    populateEntityFilter(finanzasData);
    populateClassificationFilter(finanzasData);
    populateTypeFilter(finanzasData);

    handleFilters();
}

/**
 * Maneja el envío del formulario de nuevo movimiento.
 */
async function handleSaveNewMovement(event) {
    event.preventDefault();

    if (isSaving) return;
    isSaving = true;
    setSaveButtonState(true);

    try {
        const formData = {
            Clasificacion_Financiera: document.getElementById('classification').value,
            Tipo_Operacion: document.getElementById('operationType').value,
            Entidad_Bancaria: document.getElementById('entityBank').value,
            Monto_Numerico: parseFloat(document.getElementById('amount').value),
            Contraparte: document.getElementById('counterparty').value,
            Descripcion: document.getElementById('description').value,
            FechaHora: document.getElementById('dateHour').value,
            Tipo_Financiero: document.getElementById('financialType').value
        };

        await sendMovementWebhook(formData);

        closeNewMovementModal(false);
        showSuccessNotification('Movimiento guardado correctamente');
        refreshDashboardData(formData);
    } catch (error) {
        console.error('Error al guardar movimiento:', error);
        showErrorNotification('Error al guardar el movimiento: ' + error.message);
    } finally {
        isSaving = false;
        setSaveButtonState(false);
    }
}

/**
 * Configura los event listeners para controles BI, paginación, exportación y modal.
 */
function setupEventListeners() {
    // Filtros de búsqueda y desplegables BI
    const searchInput = document.getElementById('searchInput');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const entityFilter = document.getElementById('entityFilter');
    const classificationFilter = document.getElementById('classificationFilter');
    const typeFilter = document.getElementById('typeFilter');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');

    if (searchInput) searchInput.addEventListener('input', handleFilters);
    if (startDate) startDate.addEventListener('change', handleFilters);
    if (endDate) endDate.addEventListener('change', handleFilters);
    if (entityFilter) entityFilter.addEventListener('change', handleFilters);
    if (classificationFilter) classificationFilter.addEventListener('change', handleFilters);
    if (typeFilter) typeFilter.addEventListener('change', handleFilters);
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetFilters);

    // Botones de exportación ($0 costo)
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');

    if (exportExcelBtn) exportExcelBtn.addEventListener('click', () => exportToExcel(filteredData));
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportToPDF);

    // Paginación
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderCurrentPage();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(totalFilteredData / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderCurrentPage();
            }
        });
    }

    // Modal para nuevo movimiento
    const newMovementBtn = document.getElementById('newMovementBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const modalOverlay = document.getElementById('newMovementModal');
    const newMovementForm = document.getElementById('newMovementForm');

    if (newMovementBtn) newMovementBtn.addEventListener('click', openNewMovementModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => closeNewMovementModal(isSaving));
    if (cancelBtn) cancelBtn.addEventListener('click', () => closeNewMovementModal(isSaving));
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeNewMovementModal(isSaving);
        });
    }
    if (newMovementForm) newMovementForm.addEventListener('submit', handleSaveNewMovement);
}

/**
 * Inicialización principal del Dashboard Financiero.
 */
async function initDashboard() {
    try {
        finanzasData = await loadCSVData();

        if (finanzasData && finanzasData.length > 0) {
            populateEntityFilter(finanzasData);
            populateClassificationFilter(finanzasData);
            populateTypeFilter(finanzasData);

            handleFilters();
            setupEventListeners();
        } else {
            throw new Error('No se encontraron datos financieros en el CSV.');
        }
    } catch (error) {
        console.error('Error al cargar el dashboard:', error);
        showErrorNotification('Error al cargar los datos: ' + error.message);
    }
}

// Inicializar cuando el DOM esté cargado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}
