# PLAN DE TRABAJO - HITO 4C: DASHBOARD BI MODULAR EN VITE

## 📋 RESUMEN EJECUTIVO
Evolución de la plataforma financiera desde un prototipo monolítico en HTML hacia una arquitectura web modular con Vite (ES Modules), análisis de Business Intelligence en tiempo real, exportación de reportes y sincronización bidireccional entre Google Sheets y automatizaciones en n8n.

---

## 🏗️ ESTRUCTURA MODULAR DE ARCHIVOS (VITE)

3-Finanzas-web-vibe/
├── index.html             # Maquetación base UI, contenedores, modal y Chatbot Widget
├── docs/
│   ├── AGENTS.md          # Constitución y Reglas de Arquitectura
│   ├── web_spec.md        # Especificación Funcional PRD
│   └── task_plan.md       # Plan de Trabajo y Estado de Sprints
├── src/
│   ├── js/
│   │   ├── config.js      # Configuración centralizada y dinámica de Endpoints y Webhooks
│   │   ├── api.js         # Servicios de Fetch CSV Google Sheets y POST Webhooks n8n
│   │   ├── ui.js          # Render de KPIs, Chart.js, Tabla, Filtros y Modal
│   │   ├── chat.js        # Módulo conversacional del Chatbot CFO y reactividad
│   │   └── app.js         # Punto de entrada de Vite, listeners e inicialización
│   ├── data/
│   │   └── mock_finanzas.json # Resguardo local de prueba
│   └── main.js            # Entry point Vite
├── package.json           # Dependencias de npm y Scripts de Vite
└── vite.config.js         # Configuración del empaquetador Vite


---

## 📌 ESTADO DE SPRINTS / HITOS

- [x] **Hito 1**: Configuración de entorno local, Antigravity IDE y Tasks de Git.
- [x] **Hito 2**: Construcción del prototipo visual responsivo en Tailwind CSS con datos mock.
- [x] **Hito 3**: Conexión de lectura en vivo a Google Sheets publicado como CSV con PapaParse.
- [x] **Hito 4A**: Configuración de repositorio GitHub y despliegue continuo en Vercel (`vercel.json`).
- [x] **Hito 4B**: Implementación del Modal Webhook y sincronización de nuevos registros hacia n8n.
- [x] **Hito 4C**: Modularización completa en Vite (ES Modules) + Módulo de Business Intelligence (Filtros por Fecha, 2 Gráficos y Exportación Excel/PDF).
- [x] **Hito 5A (Nube Backend)**: Migración e infraestructura de n8n a Render.com enlazado a PostgreSQL en Supabase.
- [ ] **Hito 5B (Backend Chatbot v7 Full)**: Creación de la Rama 3 Bidireccional (Webhook + Clasificador de Intención + Sheets RAG/Append + Agente Gemini CFO) en n8n.
- [x] **Hito 5C (Frontend Chatbot Widget Dual)**: Construcción del widget flotante de chat en la interfaz web conectado al endpoint de n8n con auto-refresco de datos.
- [x] **Hito 5D (Resolución Dinámica de Endpoints)**: Configuración automática de URLs n8n según entorno de ejecución (Localhost vs Producción Vercel/Render).

---

## ✅ CRITERIOS DE ACEPTACIÓN (Definition of Done)
1. **Compilación Modular**: La aplicación corre en Vite (`npm run dev`) sin errores en la consola.
2. **Interactividad BI**: Tarjetas, Gráfico de Egresos y Gráfico de Tendencia Mensual se actualizan dinámicamente al aplicar filtros de fecha o dropdowns.
3. **Generación de Reportes**: Descarga correcta de archivos Excel (`.xlsx`) y PDF desde los botones de la interfaz.
4. **Ingreso Manual Sincronizado**: Formulario modal funcional con envío `POST` exitoso al Webhook de n8
5. **Filtrado Global No Financiero**: Implementar regla de exclusión base para ignorar registros `no_financiero` en KPIs, gráficos y tabla de movimientos.