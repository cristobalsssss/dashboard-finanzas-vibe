/**
 * src/js/chat.js
 * Módulo de interfaz y lógica para el Widget de Chatbot Financiero (CFO Personal AI).
 * Maneja estados de conversación, animación de carga, renderizado de mensajes y reactividad del Dashboard.
 */

import { sendChatMessage } from './api.js';
import { CONFIG } from './config.js';

let isChatOpen = false;
let isProcessing = false;
let onMovementCallback = null;

/**
 * Inicializa el Widget de Chatbot y sus listeners.
 * @param {Function} onMovementRegistered Callback ejecutado cuando se registra un movimiento vía chat.
 */
export function initChatWidget(onMovementRegistered = null) {
    onMovementCallback = onMovementRegistered;

    const chatToggleBtn = document.getElementById('chatToggleBtn');
    const chatCloseBtn = document.getElementById('chatCloseBtn');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const clearChatBtn = document.getElementById('clearChatBtn');
    const quickChips = document.querySelectorAll('.chat-quick-chip');

    if (chatToggleBtn) {
        chatToggleBtn.addEventListener('click', toggleChatWidget);
    }

    if (chatCloseBtn) {
        chatCloseBtn.addEventListener('click', closeChatWidget);
    }

    if (chatForm) {
        chatForm.addEventListener('submit', handleSendMessage);
    }

    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', resetChatConversation);
    }

    // Chips de preguntas sugeridas
    quickChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const promptText = chip.getAttribute('data-prompt') || chip.textContent.trim();
            if (chatInput && !isProcessing) {
                chatInput.value = promptText;
                chatForm.dispatchEvent(new Event('submit'));
            }
        });
    });

    // Enviar con Enter (sin Shift)
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                chatForm.dispatchEvent(new Event('submit'));
            }
        });
    }

    console.log('[Chatbot AI] Widget inicializado correctamente con endpoint:', CONFIG.CHAT_WEBHOOK_URL);
}

/**
 * Alterna la visibilidad del widget de chat.
 */
export function toggleChatWidget() {
    if (isChatOpen) {
        closeChatWidget();
    } else {
        openChatWidget();
    }
}

/**
 * Abre el widget de chat y enfoca el input.
 */
export function openChatWidget() {
    const widget = document.getElementById('chatWidget');
    const toggleIconChat = document.getElementById('chatIconOpen');
    const toggleIconClose = document.getElementById('chatIconClose');
    const badge = document.getElementById('chatNotificationBadge');
    const input = document.getElementById('chatInput');

    if (!widget) return;

    widget.classList.remove('hidden', 'scale-95', 'opacity-0', 'pointer-events-none');
    widget.classList.add('scale-100', 'opacity-100', 'pointer-events-auto');
    isChatOpen = true;

    if (toggleIconChat) toggleIconChat.classList.add('hidden');
    if (toggleIconClose) toggleIconClose.classList.remove('hidden');
    if (badge) badge.classList.add('hidden');

    if (input) {
        setTimeout(() => input.focus(), 150);
    }

    scrollChatToBottom();
}

/**
 * Cierra el widget de chat.
 */
export function closeChatWidget() {
    const widget = document.getElementById('chatWidget');
    const toggleIconChat = document.getElementById('chatIconOpen');
    const toggleIconClose = document.getElementById('chatIconClose');

    if (!widget) return;

    widget.classList.add('scale-95', 'opacity-0', 'pointer-events-none');
    widget.classList.remove('scale-100', 'opacity-100', 'pointer-events-auto');
    setTimeout(() => {
        if (!isChatOpen) widget.classList.add('hidden');
    }, 200);

    isChatOpen = false;

    if (toggleIconChat) toggleIconChat.classList.remove('hidden');
    if (toggleIconClose) toggleIconClose.classList.add('hidden');
}

/**
 * Maneja el envío del mensaje del usuario.
 */
async function handleSendMessage(event) {
    event.preventDefault();

    if (isProcessing) return;

    const input = document.getElementById('chatInput');
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    // Limpiar input
    input.value = '';

    // Renderizar mensaje del usuario
    appendUserMessage(message);

    // Activar estado de procesamiento "CFO procesando..."
    setChatLoading(true);

    try {
        const response = await sendChatMessage(message);

        setChatLoading(false);
        appendAssistantMessage(response.text, response.movementRegistered);

        // REGLA DE NEGOCIO: Si n8n confirmó registro de nuevo movimiento, recargar Dashboard
        if (response.movementRegistered && typeof onMovementCallback === 'function') {
            console.log('[Chatbot AI] ¡Nuevo movimiento detectado! Gatillando recarga del Dashboard...');
            showChatMovementNotice();
            onMovementCallback();
        }
    } catch (error) {
        console.error('[Chatbot AI] Error al procesar mensaje:', error);
        setChatLoading(false);
        appendErrorMessage(`No se pudo conectar con el CFO en n8n: ${error.message}. Verifica que el flujo esté activo en localhost:5678.`);
    }
}

/**
 * Agrega un mensaje del usuario al contenedor de chat.
 * @param {string} text Texto del mensaje.
 */
function appendUserMessage(text) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const msgDiv = document.createElement('div');
    msgDiv.className = 'flex flex-col items-end mb-4 fade-in';
    msgDiv.innerHTML = `
        <div class="max-w-[85%] bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-none px-4 py-2.5 shadow-md shadow-blue-500/10 text-sm leading-relaxed break-words">
            ${escapeHtml(text)}
        </div>
        <span class="text-[10px] text-gray-400 mt-1 mr-1">${timeString}</span>
    `;

    messagesContainer.appendChild(msgDiv);
    scrollChatToBottom();
}

/**
 * Agrega un mensaje de respuesta del CFO AI.
 * @param {string} text Texto conversacional devuelto.
 * @param {boolean} hasMovement Si el mensaje incluye confirmación de registro de movimiento.
 */
function appendAssistantMessage(text, hasMovement = false) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedText = formatChatMessageText(text);

    const msgDiv = document.createElement('div');
    msgDiv.className = 'flex items-start gap-2.5 mb-4 fade-in';
    msgDiv.innerHTML = `
        <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
        </div>
        <div class="flex flex-col max-w-[85%]">
            <div class="bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm text-sm leading-relaxed break-words">
                ${formattedText}
                ${hasMovement ? `
                    <div class="mt-2.5 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-xs text-green-600 font-medium">
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                        <span>Movimiento registrado y reflejado en el Dashboard</span>
                    </div>
                ` : ''}
            </div>
            <span class="text-[10px] text-gray-400 mt-1 ml-1">${timeString} • CFO AI</span>
        </div>
    `;

    messagesContainer.appendChild(msgDiv);
    scrollChatToBottom();
}

/**
 * Agrega un mensaje de error visual en el chat.
 * @param {string} errorText 
 */
function appendErrorMessage(errorText) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'flex items-start gap-2.5 mb-4 fade-in';
    msgDiv.innerHTML = `
        <div class="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
        </div>
        <div class="max-w-[85%] bg-red-50 border border-red-100 text-red-700 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs shadow-sm">
            ${escapeHtml(errorText)}
        </div>
    `;

    messagesContainer.appendChild(msgDiv);
    scrollChatToBottom();
}

/**
 * Muestra el aviso sutil de recarga reactiva de datos.
 */
function showChatMovementNotice() {
    const badge = document.createElement('div');
    badge.className = 'fade-in flex items-center justify-center my-3';
    badge.innerHTML = `
        <span class="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium flex items-center gap-1.5 shadow-sm">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Dashboard actualizado en vivo
        </span>
    `;
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
        messagesContainer.appendChild(badge);
        scrollChatToBottom();
    }
}

/**
 * Controla el indicador animado de procesamiento "CFO procesando...".
 * @param {boolean} isLoading 
 */
function setChatLoading(isLoading) {
    isProcessing = isLoading;
    const loadingEl = document.getElementById('chatLoading');
    const sendBtn = document.getElementById('chatSendBtn');
    const input = document.getElementById('chatInput');

    if (loadingEl) {
        if (isLoading) {
            loadingEl.classList.remove('hidden');
        } else {
            loadingEl.classList.add('hidden');
        }
    }

    if (sendBtn) {
        sendBtn.disabled = isLoading;
        if (isLoading) {
            sendBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            sendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    if (input) {
        input.disabled = isLoading;
        if (!isLoading) {
            input.focus();
        }
    }

    if (isLoading) {
        scrollChatToBottom();
    }
}

/**
 * Desplaza automáticamente el contenedor de mensajes al fondo.
 */
function scrollChatToBottom() {
    const container = document.getElementById('chatMessages');
    if (container) {
        requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
        });
    }
}

/**
 * Reinicia la conversación del chat al estado inicial.
 */
function resetChatConversation() {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    messagesContainer.innerHTML = `
        <!-- Mensaje de Bienvenida del CFO -->
        <div class="flex items-start gap-2.5 mb-4 fade-in">
            <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
            </div>
            <div class="flex flex-col max-w-[85%]">
                <div class="bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm text-sm leading-relaxed">
                    <p class="font-medium text-gray-900 mb-1">¡Hola! Soy tu CFO Personal AI 💼</p>
                    <p class="text-gray-600 text-xs mb-2">Puedo responder dudas sobre tus finanzas o registrar nuevos movimientos en tu planilla con lenguaje natural.</p>
                    <div class="text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        💡 <strong>Ejemplos:</strong><br>
                        • <em>"¿Cuál es mi balance neto actual?"</em><br>
                        • <em>"Anota un gasto de $15.000 en Santander por supermercado"</em>
                    </div>
                </div>
                <span class="text-[10px] text-gray-400 mt-1 ml-1">En línea • CFO AI</span>
            </div>
        </div>
    `;
    scrollChatToBottom();
}

/**
 * Escapa caracteres HTML para evitar inyecciones.
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Formatea el texto de la respuesta (saltos de línea, negritas simples).
 */
function formatChatMessageText(text) {
    if (!text) return '';
    let formatted = escapeHtml(text);
    // Convertir markdown básico **texto** a <strong>texto</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Convertir saltos de línea a <br>
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
}
