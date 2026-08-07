# CONSTITUCIÓN DEL PROYECTO: DASHBOARD FINANCIERO WEB

## 1. Misión
Construir una interfaz web responsiva, moderna y limpia (Dashboard Financiero BI) que visualice y gestione los datos de ingresos, egresos y balance provenientes de la planilla de Google Sheets ("Finanzas_Dashboard_Prueba") y permita el registro dinámico de nuevos movimientos vía automatización.

## 2. Stack Tecnológico Oficial
- **Frontend & Bundler**: Vite + HTML5 + JavaScript (ES Modules modularizado).
- **Estilos**: Tailwind CSS (clases de utilidad responsivas).
- **Visualización de Datos**: Chart.js para gráficos de distribución y tendencias temporales.
- **Procesamiento de Datos**: PapaParse para lectura e interpretación de CSV público de Google Sheets.
- **Reportes & Exportación ($0 Costo)**: SheetJS (`xlsx`) para exportación a Excel y `html2pdf.js` para generación de reportes en PDF.
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
- **Regla de Negocio Global (Filtrado de Registros)**:
  - Todo registro cuyo campo `Clasificacion_Financiera` o `Tipo_Financiero` contenga la opción `No_Financiero` / `no_financiero` debe ser ignorado por completo desde la ingesta/procesamiento base de datos.
  - Ningún movimiento "no financiero" debe sumarse a las tarjetas KPI, ni dibujarse en los gráficos, ni listarse en la tabla de movimientos.

## 5. Estructura Oficial de Datos (Google Sheets / BD)
El sistema opera sobre 8 campos obligatorios:
1. `Clasificacion_Financiera`: "Ingreso | Egreso | no_financiero"
2. `Tipo_Operacion`: "Transferencia | Pago | Compra | Depósito | Desconocido"
3. `Entidad_Bancaria`: "Nombre del banco, pasarela o entidad"
4. `Monto_Numerico`: Valor numérico real
5. `Contraparte`: Nombre de la persona u organización
6. `Descripcion`: Detalle o glosa del movimiento
7. `FechaHora`: Formato "YYYY-MM-DD HH:mm"
8. `Tipo_Financiero`: "Financiero | No_Financiero | Error"