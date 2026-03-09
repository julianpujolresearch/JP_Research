# Configuración de Google Sheets para Cotizaciones

## Paso 1: Crear Google Sheets

1. Ve a [Google Sheets](https://sheets.google.com)
2. Crea un nuevo documento llamado "JP Research - Cotizaciones"
3. Crea 5 hojas (pestañas) con estos nombres:
   - CCL
   - MEP  
   - OFICIAL
   - A3500
   - CRYPTO

## Paso 2: Estructura de Datos

En cada hoja, usa esta estructura (Fila 1 = Headers):

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Symbol | Name | Price | Change | ChangeValue | Volume | MarketCap | Sector |
| YPFD | YPF S.A. | $22.30 | +3.45% | +0.74 | 2.5M | $8.9B | Energía |
| GGAL | Grupo Galicia | $185.50 | -1.23% | -2.31 | 1.8M | $3.2B | Financiero |

## Paso 3: Hacer Público el Sheet

### Opción A: CSV Público (Más Simple)
1. Ve a **Archivo > Compartir > Publicar en la web**
2. Selecciona la hoja específica (ej: CCL)
3. Formato: **Valores separados por comas (.csv)**
4. Copia la URL generada

### Opción B: Google Sheets API (Más Robusto)
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google Sheets API**
4. Crea credenciales (API Key)
5. Usa esta URL: `https://sheets.googleapis.com/v4/spreadsheets/SHEET_ID/values/HOJA_NAME!A:H?key=API_KEY`

## Paso 4: Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz de tu proyecto:

\`\`\`env
# Método CSV (más simple)
NEXT_PUBLIC_SHEET_URL_CCL=https://docs.google.com/spreadsheets/d/TU_SHEET_ID/export?format=csv&gid=0
NEXT_PUBLIC_SHEET_URL_MEP=https://docs.google.com/spreadsheets/d/TU_SHEET_ID/export?format=csv&gid=1
NEXT_PUBLIC_SHEET_URL_OFICIAL=https://docs.google.com/spreadsheets/d/TU_SHEET_ID/export?format=csv&gid=2
NEXT_PUBLIC_SHEET_URL_A3500=https://docs.google.com/spreadsheets/d/TU_SHEET_ID/export?format=csv&gid=3
NEXT_PUBLIC_SHEET_URL_CRYPTO=https://docs.google.com/spreadsheets/d/TU_SHEET_ID/export?format=csv&gid=4
\`\`\`

## Paso 5: Obtener el Sheet ID

El Sheet ID está en la URL de tu Google Sheet:
`https://docs.google.com/spreadsheets/d/ESTE_ES_EL_SHEET_ID/edit#gid=0`

## Ejemplo de Datos por Categoría

### CCL (Contado con Liquidación)
- YPFD, GGAL, BMA, TXAR, etc.

### MEP (Mercado Electrónico de Pagos)  
- AL30, GD30, AE38, etc.

### OFICIAL (Tipo de Cambio Oficial)
- USD/ARS, EUR/ARS, BRL/ARS

### A3500 (Acciones Líderes)
- Las 35 acciones más líquidas del MERVAL

### CRYPTO (Criptomonedas)
- BTC/ARS, ETH/ARS, USDT/ARS

## Actualización de Datos

Para mantener los datos actualizados, puedes:
1. **Manual**: Editar directamente en Google Sheets
2. **Automático**: Usar Google Apps Script para obtener datos de APIs
3. **Integración**: Conectar con proveedores de datos financieros

## Troubleshooting

- **Error 403**: Verifica que el sheet sea público
- **Error 404**: Verifica el Sheet ID y nombres de hojas
- **Datos vacíos**: Verifica la estructura de columnas
- **CORS Error**: Usa las URLs correctas con formato CSV o API
