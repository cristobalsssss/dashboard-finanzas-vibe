# ESPECIFICACIÓN DE PRODUCTO (PRD): DASHBOARD FINANCIERO WEB

## 1. Visión General del Producto
Construir una interfaz web responsiva, moderna y limpia para un Dashboard Financiero. El objetivo principal es visualizar de forma clara los datos de ingresos, egresos y balance provenientes de la planilla de Google Sheets ("Finanzas_Dashboard_Prueba"), permitiendo al usuario monitorear sus finanzas personales o de negocio en tiempo real o simulado.

---

## 2. Requerimientos de la Interfaz de Usuario (UI/UX)

### A. Encabezado (Header)
- **Título**: Dashboard Financiero
- **Subtítulo**: Control y visualización de movimientos
- Indicador visual de estado de actualización de datos.

### B. Tarjetas de Resumen (KPI Cards)
Ubicadas en la parte superior de la pantalla principal en una cuadrícula de 3 columnas:
1. **Total Ingresos**: Muestra la suma total de montos donde `Clasificacion_Financiera` == "Ingreso". Estilo visual en tono verde positivo.
2. **Total Egresos**: Muestra la suma total de montos donde `Clasificacion_Financiera` == "Egreso". Estilo visual en tono rojo/naranja de alerta.
3. **Balance Neto**: Muestra el resultado de `(Total Ingresos - Total Egresos)`. Formato destacado; si es positivo se muestra neutro/verde, si es negativo resalta en rojo.

### C. Visualización Gráfica
1. **Gráfico de Distribución de Egresos por Entidad Bancaria**:
   - **Tipo**: Gráfico de Torta (Pie Chart) o Anillo (Doughnut Chart).
   - **Datos**: Agrupación del `Monto_Numerico` acumulado por cada `Entidad_Bancaria` (por ejemplo: Santander, ZumPago, UniRed, etc.) considerando solo registros de tipo "Egreso".
   - **Interactividad**: Tooltip interactivo que muestre la entidad y el monto correspondiente al pasar el cursor.

### D. Tabla de Últimos Movimientos
- **Ubicación**: Sección inferior del dashboard.
- **Columnas a desplegar**:
  1. Fecha y Hora (`FechaHora`)
  2. Entidad / Pasarela (`Entidad_Bancaria`)
  3. Tipo de Operación (`Tipo_Operacion`)
  4. Monto (`Monto_Numerico` con formato de moneda `$`)
  5. Descripción / Glosa (`Descripcion`)
- **Funcionalidades esperadas**:
  - Orden predeterminado: Más reciente a más antiguo según `FechaHora`.
  - Etiqueta o badge de color según si el movimiento es "Ingreso" o "Egreso".

---

## 3. Modelo de Datos de Entrada (Estructura Google Sheets)

Los datos procesados por la aplicación mantendrán la siguiente estructura de 8 campos:
1. `Clasificacion_Financiera`: ("Ingreso" | "Egreso" | "no_financiero")
2. `Tipo_Operacion`: ("Transferencia" | "Pago" | "Compra" | "Desconocido")
3. `Entidad_Bancaria`: Nombre del banco, pasarela o entidad
4. `Monto_Numerico`: Valor numérico de la transacción
5. `Contraparte`: Nombre de la persona u organización de origen/destino
6. `Descripcion`: Detalle, concepto o glosa del movimiento
7. `FechaHora`: Formato "YYYY-MM-DD HH:mm"
8. `Tipo_Financiero`: ("Financiero" | "No_Financiero" | "Error")

---

## 4. Lineamientos de Arquitectura y Diseño (Guardarraíles)
- **Diseño**: Minimalista, limpio, adaptable a escritorio y dispositivos móviles (Mobile-First / Responsivo con Tailwind CSS).
- **Librerías**: Componentes visuales responsivos con Tailwind CSS y gráficos con Chart.js / Recharts.
- **Datos de prueba (Mock Data)**: El agente deberá crear un conjunto inicial de datos simulados en formato JSON basados en la estructura anterior para verificar el funcionamiento de la interfaz gráfica de forma inmediata.

---

## 5. Criterios de Aceptación (Definition of Done)
1. El proyecto compila y se ejecuta en un servidor local (por ejemplo, Vite) sin errores.
2. Se visualizan correctamente las 3 tarjetas KPI con los totales calculados adecuadamente.
3. El gráfico de egresos refleja correctamente la distribución por entidad bancaria.
4. La tabla muestra los campos requeridos en formato legible con diseño limpio.

---

## Datos de Ejemplo (Google Sheets)

A continuación se presentan filas reales tomadas de la planilla para usar como base del archivo mock:

Clasificacion_Financiera	Tipo_Operacion	Entidad_Bancaria	Monto_Numerico	Contraparte	Descripcion	FechaHora	Tipo_Financiero
Egreso	Transferencia	Banco Security	250000	Erick Soto	Mueble entrada	2026-07-10 19:43	Financiero
Egreso	Compra	ZumPago	26480	Mundo Pacífico	Servicio Internet	2026-07-12 10:15	Financiero
Ingreso	Transferencia	Banco Santander	850000	Empresa Servicios SpA	Sueldo / Honorarios	2026-07-01 9:00	Financiero
Egreso	Compra	Transbank	45900	Lider Supermercados	Mercadería del mes	2026-07-03 15:30	Financiero
Egreso	Compra	UniRed	18200	Enel Distribución	Cuenta Electricidad	2026-07-05 11:20	Financiero
Egreso	Compra	Webpay	12500	Aguas Andinas	Cuenta Agua	2026-07-06 8:45	Financiero
Ingreso	Transferencia	BancoEstado	120000	Juan Perez	Devolución préstamo	2026-07-08 14:10	Financiero
Egreso	Compra	Banco Security	8990	Netflix	Suscripción mensual	2026-07-09 22:00	Financiero
Egreso	Compra	Banco Santander	15400	Copec	Combustible vehículo	2026-07-11 18:05	Financiero
Egreso	Compra	ZumPago	32000	Claro Chile	Plan Telefonía	2026-07-14 16:50	Financiero
Ingreso	Transferencia	Banco Chile	45000	Fundación Reembolsos	Reembolso médico	2026-07-15 12:30	Financiero
Egreso	Compra	Transbank	68900	Farmacias Ahumada	Medicamentos	2026-07-16 17:15	Financiero
Egreso	Compra	UniRed	22000	Metrogas	Gas domicilio	2026-07-18 10:00	Financiero
Ingreso	Transferencia	Banco Falabella	50000	Carmen Hidalgo	Farmacia Devolucion	2026-07-19 10:00	Financiero