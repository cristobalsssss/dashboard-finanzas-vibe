# ESPECIFICACIÓN DE PRODUCTO (PRD): DASHBOARD FINANCIERO WEB BI

## 1. Visión General del Producto
Proporcionar una plataforma web moderna, modular e interactiva para el monitoreo y gestión de finanzas personales o de negocio. La aplicación consume datos en tiempo real desde la planilla Google Sheets ("Finanzas_Dashboard_Prueba") y permite ingresar nuevos registros sincronizados bidireccionalmente mediante automatización en n8n.

---

## 2. Requerimientos Funcionales y de Interfaz (UI/UX)

### A0. Regla Global de Filtrado Base (Exclusión de No Financieros)
- **Criterio de Negocio**: Las transacciones catalogadas con `Clasificacion_Financiera == "no_financiero"` o `Tipo_Financiero == "No_Financiero"` no forman parte de la analítica financiera del Dashboard.
- **Alcance**:
  1. **Tarjetas KPI**: Excluidos del cálculo de Total Ingresos, Total Egresos, Balance Neto y Contador de Total Movimientos.
  2. **Gráficos**: Excluidos del Gráfico de Egresos por Banco y del Gráfico de Evolución Temporal.
  3. **Tabla de Movimientos**: No deben mostrarse en el listado ni afectar la paginación.

### A. Encabezado (Header)
- Título principal: **Dashboard Financiero**
- Subtítulo: **Business Intelligence & Gestor de Movimientos**
- Estado visual de carga (cargando datos / datos actualizados).
- Botón de Acción Principal: `+ Nuevo Movimiento` (Abre el modal de ingreso manual).

### B. Barra de Filtros & Business Intelligence (BI)
Panel superior interactivo compuesto por:
1. **Filtro Rango de Fechas**:
   - Campo `Fecha Desde` (input date).
   - Campo `Fecha Hasta` (input date).
2. **Filtros Selectivos (Dropdowns)**:
   - `Entidad Bancaria`: Menú autogenerado con los valores únicos del conjunto de datos.
   - `Clasificación Financiera`: Opciones (Todos, Ingreso, Egreso, No_Financiero).
   - `Tipo Operación`: Opciones (Todos, Transferencia, Pago, Compra, Depósito).
3. **Acciones de Filtro**:
   - Botón `Limpiar Filtros`: Restablece todos los campos a su estado por defecto y recarga la vista global.
4. **Módulo de Exportación de Reportes ($0 Costo)**:
   - Botón `📊 Exportar Excel`: Genera y descarga un archivo `.xlsx` con los datos filtrados actualmente en la tabla mediante SheetJS.
   - Botón `📄 Descargar PDF`: Genera un informe en PDF con la vista actual de tarjetas, gráficos y tabla utilizando `html2pdf.js`.



### C. Tarjetas de Resumen (KPI Cards)
Cuadrícula de 3 columnas responsivas:
1. **Total Ingresos**: Suma acumulada de movimientos con `Clasificacion_Financiera == "Ingreso"`. Color verde positivo.
2. **Total Egresos**: Suma acumulada de movimientos con `Clasificacion_Financiera == "Egreso"`. Color rojo/naranja de alerta.
3. **Balance Neto**: Cálculo de `(Total Ingresos - Total Egresos)`. Destacado visualmente (verde si es mayor o igual a 0, rojo si es negativo).
4. **Total Movimientos**: Suma acumulada de todos los movimientos. Agregando la fecha desde y hasta

### D. Panel de Gráficos (Analytics Avanzado)
1. **Gráfico 1 (Torta/Donut - Distribución de Egresos)**: Agrupa el total de egresos por cada `Entidad_Bancaria`.
2. **Gráfico 2 (Barras/Líneas - Evolución Temporal)**: Compara la evolución de *Ingresos vs. Egresos* agrupados por mes cronológico.

### E. Tabla de Movimientos y Paginación
- Muestra el listado detallado de transacciones ordenado en forma cronológica inversa.
- **Columnas**: Fecha, Entidad Bancaria, Tipo Operación, Clasificación, Monto ($), Contraparte y Descripción.
- **Paginación**: Límite estricto de 10 filas por página con botones `Anterior` y `Siguiente`.
- **Contador Dinámico**: Leyenda informativa con el formato `"Mostrando X a Y de Z resultados"`.

### F. Modal de Ingreso Manual de Movimientos
Ventana emergente gatillada por el botón `+ Nuevo Movimiento`:
- **Formulario**: Contiene los 8 campos requeridos (`Clasificacion_Financiera`, `Tipo_Operacion`, `Entidad_Bancaria`, `Monto_Numerico`, `Contraparte`, `Descripcion`, `FechaHora`, `Tipo_Financiero`).
- **Acción Guardar**: Al presionar `Guardar Movimiento`:
  1. Cambia el botón a estado "Guardando...".
  2. Ejecuta una petición `POST` al Webhook de n8n: `http://localhost:5678/webhook-test/nuevo-movimiento`.
  3. Maneja errores con `try/catch` (evitando bloqueos por `Failed to fetch`).
  4. Al confirmar éxito, cierra el modal, limpia los campos, muestra notificación y refresca los datos del Dashboard.


### G. Widget Flotante de Chatbot Conversacional (CFO Personal AI)
- **Ubicación UI**: Botón circular flotante e interactivo posicionado en la esquina inferior derecha del Dashboard.
- **Interfaz de Chat**:
  - Ventana emergente tipo Messenger/WhatsApp con encabezado "CFO Personal AI".
  - Área de mensajes con scroll automático que diferencia burbujas de usuario y de la IA.
  - Campo de texto para redactar preguntas y botón "Enviar".
  - Indicador visual de estado ("El CFO está analizando tus finanzas...") mientras espera la respuesta.
- **Flujo de Integración Dual (Lectura + Acción)**:
  1. Captura el mensaje ingresado por el usuario (ya sea una consulta o una instrucción para registrar un movimiento).
  2. Realiza una petición `POST` en formato JSON `{ "question": "..." }` al webhook `/webhook/chat-financiero` en Render.
  3. Despliega la respuesta conversacional procesada por Gemini en la ventana de chat.
  4. **Reactividad Visual en Tiempo Real**: Si la respuesta confirma la creación de un nuevo registro (`action_performed == "append_row"`), el widget de chat gatilla automáticamente la recarga de los datos del Dashboard (tarjetas KPI, gráficos y tabla) sin refrescar toda la página.