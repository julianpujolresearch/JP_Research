# Configuración de Google Sheets API Privada

## Opción 1: API Key + OAuth (Más Simple)

### Paso 1: Crear API Key
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto o selecciona uno existente
3. Habilita la **Google Sheets API**
4. Ve a **Credenciales > Crear Credenciales > Clave de API**
5. Copia la API Key

### Paso 2: Configurar OAuth
1. Ve a **Credenciales > Crear Credenciales > ID de cliente OAuth 2.0**
2. Tipo: Aplicación web
3. Agrega tu dominio a los orígenes autorizados
4. Descarga el JSON de credenciales

### Paso 3: Obtener Access Token
Necesitarás generar un access token usando OAuth flow.

## Opción 2: Service Account (Recomendado)

### Paso 1: Crear Service Account
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. **IAM y administración > Cuentas de servicio**
3. **Crear cuenta de servicio**
4. Asigna un nombre (ej: "sheets-reader")
5. **Crear y continuar**

### Paso 2: Generar Clave
1. Haz clic en la cuenta de servicio creada
2. **Claves > Agregar clave > Crear nueva clave**
3. Tipo: **JSON**
4. Descarga el archivo JSON

### Paso 3: Compartir Sheet con Service Account
1. Abre tu Google Sheet
2. Haz clic en **Compartir**
3. Agrega el email de la service account (ej: sheets-reader@tu-proyecto.iam.gserviceaccount.com)
4. Permisos: **Lector**

### Paso 4: Configurar Variables de Entorno
Extrae los valores del JSON descargado:

\`\`\`env
GOOGLE_PROJECT_ID=tu-proyecto-123456
GOOGLE_PRIVATE_KEY_ID=abc123def456
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=sheets-reader@tu-proyecto.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=123456789012345678901
\`\`\`

## Opción 3: Librería googleapis (Más Fácil)

Instala la librería oficial:
\`\`\`bash
npm install googleapis
\`\`\`

Luego usa este código simplificado:
\`\`\`typescript
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  keyFile: 'path/to/service-account.json', // o usar variables de entorno
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function getCotizaciones(type: string) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: '1Zl6BBEOB7yzeSjFLkvr1EFTHVM1aa0Ozlr1Xr96-iiQ',
    range: `${type}!A:H`,
  });
  
  return response.data.values;
}
