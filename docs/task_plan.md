# PLAN DE TRABAJO - HITO 2: DASHBOARD FINANCIERO WEB

## 📋 RESUMEN EJECUTIVO

Este documento define el plan detallado para construir un Dashboard Financiero Web responsivo, moderno y limpio que visualice datos de ingresos, egresos y balance provenientes de una fuente de datos externa (Google Sheets o API).

---

## 🎯 OBJETIVOS DEL HITO 2

1. Construir una interfaz web funcional que muestre KPIs financieros en tiempo real
2. Implementar visualización gráfica de distribución de egresos por entidad bancaria
3. Mostrar tabla de últimos movimientos con información detallada
4. Asegurar diseño responsive (Mobile-First) con Tailwind CSS

---

## 🏗️ ESTRUCTURA DE ARCHIVOS PROPUESTA

```
3-Finanzas-web-vibe/
├── docs/
│   ├── AGENTS.md              # Constitución del proyecto
│   ├── web_spec.md            # Especificación de producto
│   └── task_plan.md           # Este plan de trabajo
├── src/
│   ├── components/
│   │   ├── Header.tsx         # Componente de encabezado
│   │   ├── KPICards.tsx       # Tarjetas de resumen (Ingresos, Egresos, Balance)
│   │   ├── ExpenseChart.tsx   # Gráfico de distribución de egresos
│   │   └── RecentTransactionsTable.tsx  # Tabla de últimos movimientos
│   ├── data/
│   │   └── mock_finanzas.json # Datos simulados para pruebas
│   ├── App.tsx                # Componente principal
│   └── main.tsx               # Punto de entrada
├── index.html                 # Archivo HTML principal
├── tailwind.config.js         # Configuración de Tailwind
├── vite.config.js             # Configuración de Vite
└── package.json               # Dependencias del proyecto
```

---

## 📊 REQUERIMIENTOS FUNCIONALES DETALLADOS

### Componente 1: Header (Encabezado)
- **Título**: "Dashboard Financiero"
- **Subtítulo**: "Control y visualización de movimientos"
- **Estado**: Indicador visual de actualización de datos

### Componente 2: Tarjetas KPI (Key Performance Indicators)
1. **Total Ingresos**
   - Filtrado: `Clasificacion_Financiera == "Ingreso"`
   - Color: Verde (#10B981 en Tailwind)
   
2. **Total Egresos**
   - Filtrado: `Clasificacion_Financiera == "Egreso"`
   - Color: Rojo/Naranja (#EF4444 o #F97316 en Tailwind)

3. **Balance Neto**
   - Fórmula: `(Total Ingresos - Total Egresos)`
   - Formato destacado con indicador visual (positivo/neutro = verde, negativo = rojo)

### Componente 3: Gráfico de Distribución de Egresos
- **Tipo**: Doughnut Chart (Recharts) o Pie Chart (Chart.js)
- **Datos**: Agrupación por `Entidad_Bancaria` considerando solo registros "Egreso"
- **Interactividad**: Tooltip con entidad y monto

### Componente 4: Tabla de Últimos Movimientos
| Columna | Datos | Formato |
|---------|-------|---------|
| FechaHora | YYYY-MM-DD HH:mm | - |
| Entidad_Bancaria | Nombre del banco/pasarela | Badge |
| Tipo_Operacion | Transferencia/Pago/Compra/Desconocido | Badge |
| Monto_Numerico | Valor de transacción | Moneda ($) |
| Descripcion | Concepto/glosa | Texto |

**Ordenamiento**: Más reciente → más antiguo por `FechaHora`

---

## 🗄️ MODELO DE DATOS (Google Sheets Structure)

| Campo | Tipo | Valores permitidos / Descripción |
|-------|------|-----------------------------------|
| Clasificacion_Financiera | String | "Ingreso" \| "Egreso" \| "no_financiero" |
| Tipo_Operacion | String | "Transferencia" \| "Pago" \| "Compra" \| "Desconocido" |
| Entidad_Bancaria | String | Nombre del banco, pasarela o entidad |
| Monto_Numerico | Number | Valor monetario de la transacción |
| Contraparte | String | Persona u organización origen/destino |
| Descripcion | String | Detalle/concepto del movimiento |
| FechaHora | DateTime | Formato "YYYY-MM-DD HH:mm" |
| Tipo_Financiero | String | "Financiero" \| "No_Financiero" \| "Error" |

---

## 🛠️ STACK TECNOLÓGICO

### Frontend
- **HTML5** - Estructura semántica
- **Tailwind CSS v3+** (CDN o Vite plugin) - Estilos responsive
- **JavaScript / React** - Lógica de aplicación
- **Recharts** - Gráficos de visualización (recomendado sobre Chart.js para integración con React)

### Herramientas de Desarrollo
- **Vite** - Servidor local y bundler (preferido sobre Live Server)

---

## 📅 CRONOGRAMA DE IMPLEMENTACIÓN

### Fase 1: Configuración del Proyecto (Día 1)
- [ ] Inicializar proyecto con Vite (`npm create vite@latest`)
- [ ] Instalar dependencias: `react`, `recharts`, `tailwindcss`
- [ ] Configurar Tailwind CSS en el proyecto
- [ ] Crear estructura de carpetas y archivos base

### Fase 2: Datos Mock (Día 1)
- [ ] Extraer datos de ejemplo del Google Sheets proporcionado
- [ ] Crear archivo `src/data/mock_finanzas.json` con al menos 30 registros variados
- [ ] Incluir variedad de entidades bancarias, tipos de operación y clasificaciones

### Fase 3: Componentes UI (Días 2-4)
- [ ] **Día 2**: Implementar Header y KPICards
- [ ] **Día 3**: Implementar ExpenseChart con Recharts
- [ ] **Día 4**: Implementar RecentTransactionsTable

### Fase 4: Integración y Estilo (Días 5-6)
- [ ] Conectar componentes en App.tsx
- [ ] Asegurar diseño responsive (Mobile-First)
- [ ] Aplicar paleta de colores consistente
- [ ] Mejorar UX con micro-interacciones

### Fase 5: Testing y Refinamiento (Día 7)
- [ ] Verificar cálculos de KPIs
- [ ] Validar visualización gráfica
- [ ] Probar en diferentes tamaños de pantalla
- [ ] Debugging y optimizaciones finales

---

## 🎨 PALETA DE COLORES SUGERIDA (Tailwind)

| Uso | Clase Tailwind | Color Hex |
|-----|---------------|-----------|
| Ingresos | `bg-green-500` / `text-green-600` | #10B981 |
| Egresos | `bg-red-500` / `text-orange-600` | #EF4444 / #F97316 |
| Balance + | `bg-green-500` | #10B981 |
| Balance - | `bg-red-500` | #EF4444 |
| Neutro | `bg-gray-500` | #6B7280 |

---

## ✅ CRITERIOS DE ACEPTACIÓN (Definition of Done)

1. **Proyecto funcional**: Compila y ejecuta en servidor local sin errores
2. **KPIs visibles**: Las 3 tarjetas muestran totales calculados correctamente
3. **Gráfico correcto**: Distribución de egresos por entidad bancaria se visualiza
4. **Tabla legible**: Campos requeridos con formato limpio y orden cronológico inverso
5. **Responsive**: Diseño adaptado a escritorio, tablet y móvil

---

## 📝 NOTAS TÉCNICAS

- Todos los componentes deben ser modulares e independientes
- Mantener código limpio sin dependencias pesadas innecesarias
- Usar clases de utilidad de Tailwind exclusivamente para estilos
- Los datos se consumirán desde el archivo JSON mock (simulación)
- La conexión real con Google Sheets será implementada en hitos posteriores

---

## 🚀 PRÓXIMOS HITOS (Posterior al Hito 2)

- **HITO 3**: Integración con Google Sheets API / Google Apps Script
- **HITO 4**: Sistema de autenticación y panel admin (Backoffice)
- **HITO 5**: Exportación de reportes en PDF/Excel
- **HITO 6**: Historial y filtros por período

---

*Documento generado para Hito 2 - Dashboard Financiero Web*
*Última actualización: Basado en especificaciones AGENTS.md y web_spec.md*