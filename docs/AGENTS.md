# CONSTITUCIÓN DEL PROYECTO: DASHBOARD FINANCIERO WEB

1. Misión
Construir una interfaz web responsiva, moderna y limpia (Dashboard Financiero) que visualice los datos de ingresos, egresos y balance provenientes de la planilla de Google Sheets.

2. Stack Tecnológico
- Frontend: HTML5, Tailwind CSS (vía CDN o Vite), JavaScript / React.
- Visualización de Datos: Chart.js o Recharts para gráficos de torta/barras.
- Servidor Local: Vite o Live Server.

3. Componentes Clave de la Interfaz
- Tarjeta 1: Total Ingresos.
- Tarjeta 2: Total Egresos.
- Tarjeta 3: Balance Neto (Ingresos - Egresos).
- Gráfico: Distribución de egresos por entidad bancaria / pasarela (Santander, ZumPago, UniRed, etc.).
- Tabla de Últimos Movimientos: Mostrar las columnas FechaHora, Entidad_Bancaria, Tipo_Operacion, Monto_Numerico y Descripción.

4. Guardarraíles de Código
- Mantener el código limpio, modular y libre de dependencias pesadas innecesarias.
- Uso exclusivo de componentes responsivos con Tailwind CSS.

# 1. ESTRUCTURA ARCHIVOS
1. Archivo web_spec.md 
- Define el archivo de especificación funcional para la web: web_spec.md (donde describiremos qué gráficos queremos y qué botones mantenedores tendrá el backoffice).
2. Archivo sheets : Finanzas_Dashboard_Prueba
- Contiene la BD de informacion que se usara como entrada para los graficos, está en el drive de google con ese nombre y contiene 8 campos:
    - `Clasificacion_Financiera`: "Ingreso | Egreso | no_financiero"
    - `Tipo_Operacion`: "Transferencia | Pago | Compra | Desconocido"
    - `Entidad_Bancaria`: "Nombre del banco, pasarela o entidad"
    - `Monto_Numerico`: Texto o valor del monto
    - `Contraparte`: Nombre de la persona u organización de origen/destino
    - `Descripcion`: Detalle, concepto o glosa del movimiento
    - `FechaHora`: "YYYY-MM-DD HH:mm"
    - `Tipo_Financiero`: "Financiero | No_Financiero | Error" 


 