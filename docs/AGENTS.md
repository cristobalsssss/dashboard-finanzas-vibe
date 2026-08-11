# CONSTITUCIÓN DEL PROYECTO: DASHBOARD FINANCIERO WEB

## 1. Misión
Construir una interfaz web responsiva, moderna y limpia (Dashboard Financiero BI) que visualice y gestione los datos de ingresos, egresos y balance provenientes de la planilla de Google Sheets ("Finanzas_Dashboard_Prueba") y permita el registro dinámico de nuevos movimientos vía automatización.

## 2. Stack Tecnológico Oficial
- **Frontend & Bundler**: Vite + HTML5 + JavaScript (ES Modules modularizado).
- **Despliegue Frontend**: **Vercel** (integrado mediante repositorio GitHub y `vercel.json`).
- **Backend & Webhooks**: **n8n en Render.com** + **Supabase (PostgreSQL)**.
- **Estilos**: Tailwind CSS (UI moderna y responsiva).
- **Visualización de Datos**: Chart.js (Distribución de Egresos y Evolución Mensual).
- **Carga de Datos**: PapaParse (Lectura de CSV público de Google Sheets).
- **Reportes & Exportación**: SheetJS (`xlsx`) y `html2pdf.js`.
- **Asistente Conversacional**: Widget de Chat flotante en el cliente conectado al Webhook de n8n/Render.
- **Servidor Local**: Vite Dev Server (`npm run dev` en `http://localhost:5173`).

## 3. Componentes Clave de la Interfaz
- **Header & Action Bar**: Título del Dashboard, indicador de estado de datos y botón destacado `+ Nuevo Movimiento`.
- **Barra de Filtros BI**: Rango de Fechas (Desde/Hasta), Entidad Bancaria, Clasificación Financiera, Tipo Operación, botón `Limpiar Filtros` y botones de exportación (`📊 Exportar Excel` / `📄 Descargar PDF`).
- **Tarjetas KPI**:
  - Total Ingresos (Filtro `Clasificacion_Financiera == "Ingreso"`).
  - Total Egresos (Filtro `Clasificacion_Financiera == "Egreso"`).
  - Balance Neto (`Total Ingresos - Total Egresos`).
- **Panel de Gráficos (Analytics)**:
  - Gráfico 1: Distribución de Egresos por Entidad Bancaria.
  - Gráfico 2: Evolución Temporal Comparativa (Ingresos vs. Egresos agrupados por Mes).
- **Tabla de Movimientos**:
  - Muestra columnas: `FechaHora`, `Entidad_Bancaria`, `Tipo_Operacion`, `Clasificacion_Financiera`, `Monto_Numerico`, `Contraparte` y `Descripcion`.
  - Paginación dinámica (10 registros por página) con contador ("Mostrando X a Y de Z resultados").

## 4. Arquitectura y Guardarraíles de Código
- **Arquitectura Bidireccional**:
  - *Lectura*: Conexión directa al feed CSV publicado de Google Sheets mediante `fetch` + PapaParse en `src/js/api.js`.
  - *Escritura*: Envío de nuevos movimientos vía `POST` al Webhook de n8n (`http://localhost:5678/webhook-test/nuevo-movimiento`).
- **Modularización Estricta (Vite)**:
  - `src/index.html`: Estructura HTML principal con contenedores de UI y modal.
  - `src/js/api.js`: Lógica de comunicación con Google Sheets (GET) y n8n Webhook (POST).
  - `src/js/ui.js`: Renderizado de tarjetas KPI, gráficos Chart.js, tabla, paginación y modal.
  - `src/js/app.js`: Punto de entrada y orquestador de eventos/filtros.
- **Reactividad de BI**: Todos los KPIs, gráficos y la tabla deben re-calcularse inmediatamente al cambiar cualquier filtro de fecha o criterio.
## 5. Regla de Negocio Global (Filtrado de Registros)**:
- **Endpoints de Producción (n8n en Render)**:
  - Registro de Movimientos: `https://<tu-servicio-n8n>.onrender.com/webhook/nuevo-movimiento`
  - Chatbot Conversacional: `https://<tu-servicio-n8n>.onrender.com/webhook/chat-financiero`
- **Widget de Chatbot AI Dual (CFO Personal Operativo)**:
  - Componente flotante en la esquina inferior derecha del Dashboard.
  - Responde consultas analíticas sobre el estado financiero **y ejecuta el registro de movimientos en lenguaje natural** (ej: "Anota un gasto de $10.000 en Santander por supermercado").
  - Envía la solicitud a la Rama 3 de n8n en Render y detona el refresco automático de las tarjetas y gráficos al completar una acción de escritura.
- **Filtrado Global Base**: Todo registro con `Clasificacion_Financiera == "no_financiero"` o `Tipo_Financiero == "No_Financiero"` se ignora automáticamente de tarjetas KPI, gráficos y tablas.

## 6. Estructura Oficial de Datos (Google Sheets / BD)
El sistema opera sobre 8 campos obligatorios:
1. `Clasificacion_Financiera`: "Ingreso | Egreso | no_financiero"
2. `Tipo_Operacion`: "Transferencia | Pago | Compra | Depósito | Desconocido"
3. `Entidad_Bancaria`: "Nombre del banco, pasarela o entidad"
4. `Monto_Numerico`: Valor numérico real
5. `Contraparte`: Nombre de la persona u organización
6. `Descripcion`: Detalle o glosa del movimiento
7. `FechaHora`: Formato "YYYY-MM-DD HH:mm"
8. `Tipo_Financiero`: "Financiero | No_Financiero | Error"