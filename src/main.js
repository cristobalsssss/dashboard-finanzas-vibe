/**
 * src/main.js
 * Punto de entrada principal de la aplicación.
 * Importa api.js y ui.js, maneja el estado global y configura los event listeners.
 */

import { loadCSVData, sendMovementWebhook } from './api.js';
import {
    calculateKPIs,
    updateKPIs,
    filterAndSortData,
    renderDashboard,
    populateEntityFilter,
    populateTypeFilter,
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
 * Aplica los filtros seleccionados a los datos y actualiza la UI.
 */
function handleFilters(searchQuery, entityFilterVal, typeFilterVal) {
    filteredData = filterAndSortData(finanzasData, searchQuery, entityFilterVal, typeFilterVal);
    totalFilteredData = filteredData.length;

    currentPage = 1; // Reiniciar a página 1 al cambiar filtros

    renderCurrentPage();

    const totalMovementsEl = document.getElementById('total-movements');
    if (totalMovementsEl) totalMovementsEl.textContent = filteredData.length;
}

/**
 * Renderiza la página actual de transacciones paginadas y actualiza el dashboard.
 */
function renderCurrentPage() {
    renderDashboard(filteredData, currentPage, itemsPerPage);
}

/**
 * Refresca el dashboard tras la adición exitosa de un movimiento.
 */
function refreshDashboardData(newMovement) {
    finanzasData.unshift(newMovement);

    populateEntityFilter(finanzasData);
    populateTypeFilter(finanzasData);

    const totalMovementsEl = document.getElementById('total-movements');
    if (totalMovementsEl) totalMovementsEl.textContent = finanzasData.length;

    const searchInput = document.getElementById('searchInput');
    const entityFilter = document.getElementById('entityFilter');
    const typeFilter = document.getElementById('typeFilter');

    handleFilters(
        searchInput ? searchInput.value : '',
        entityFilter ? entityFilter.value : '',
        typeFilter ? typeFilter.value : ''
    );
}

/**
 * Manejador del envío del formulario de nuevo movimiento.
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
 * Registra todos los event listeners de controles e interactividad.
 */
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const entityFilter = document.getElementById('entityFilter');
    const typeFilter = document.getElementById('typeFilter');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => handleFilters(
            e.target.value,
            entityFilter ? entityFilter.value : '',
            typeFilter ? typeFilter.value : ''
        ));
    }

    if (entityFilter) {
        entityFilter.addEventListener('change', (e) => handleFilters(
            searchInput ? searchInput.value : '',
            e.target.value,
            typeFilter ? typeFilter.value : ''
        ));
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', (e) => handleFilters(
            searchInput ? searchInput.value : '',
            entityFilter ? entityFilter.value : '',
            e.target.value
        ));
    }

    const prevPageBtn = document.getElementById('prevPage');
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderCurrentPage();
            }
        });
        prevPageBtn.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && currentPage > 1) {
                currentPage--;
                renderCurrentPage();
            }
        });
    }

    const nextPageBtn = document.getElementById('nextPage');
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(totalFilteredData / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderCurrentPage();
            }
        });
        nextPageBtn.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                const totalPages = Math.ceil(totalFilteredData / itemsPerPage);
                if (currentPage < totalPages) {
                    currentPage++;
                    renderCurrentPage();
                }
            }
        });
    }

    // Listeners del Modal
    const newMovementBtn = document.getElementById('newMovementBtn');
    if (newMovementBtn) {
        newMovementBtn.addEventListener('click', openNewMovementModal);
    }

    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => closeNewMovementModal(isSaving));
    }

    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => closeNewMovementModal(isSaving));
    }

    const modalOverlay = document.getElementById('newMovementModal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeNewMovementModal(isSaving);
            }
        });
    }

    const newMovementForm = document.getElementById('newMovementForm');
    if (newMovementForm) {
        newMovementForm.addEventListener('submit', handleSaveNewMovement);
    }
}

/**
 * Inicialización principal del Dashboard Financiero.
 */
async function initDashboard() {
    try {
        finanzasData = await loadCSVData();

        if (finanzasData && finanzasData.length > 0) {
            populateEntityFilter(finanzasData);
            populateTypeFilter(finanzasData);

            handleFilters('', '', '');
            setupEventListeners();
        } else {
            throw new Error('No se encontraron datos en el CSV');
        }
    } catch (error) {
        console.error('Error al cargar el dashboard:', error);
        showErrorNotification('Error al cargar los datos: ' + error.message);
    }
}

// Inicializar cuando el DOM esté completamente cargado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}
