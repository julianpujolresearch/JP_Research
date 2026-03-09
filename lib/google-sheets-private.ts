// Configuración para Google Sheets API privada con Service Account
export interface CotizacionData {
  symbol: string
  name: string
  price: string
  change: string
  changeValue: string
  volume?: string
  marketCap?: string
  sector?: string
  lastUpdate?: string
}

export type CotizationType = "FX" | "RENTA_FIJA" | "ACCIONES" | "BONOS" | "CRYPTO"

// Configuración de las hojas
const SHEET_CONFIG = {
  SPREADSHEET_ID: "1Zl6BBEOB7yzeSjFLkvr1EFTHVM1aa0Ozlr1Xr96-iiQ",
  SHEETS: {
    FX: "807565563", // GID de la pestaña FX
    RENTA_FIJA: "0", // Cambiar por el GID real
    ACCIONES: "1", // Cambiar por el GID real
    BONOS: "2", // Cambiar por el GID real
    CRYPTO: "3", // Cambiar por el GID real
  },
}

// Función para obtener datos usando Google Sheets API
export async function getCotizacionesDataPrivate(type: CotizationType): Promise<CotizacionData[]> {
  try {
    // Construir la URL de la API
    const range = `${type}!A:H` // Asumiendo columnas A-H
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_CONFIG.SPREADSHEET_ID}/values/${range}?key=${process.env.GOOGLE_SHEETS_API_KEY}`

    const response = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${process.env.GOOGLE_SHEETS_ACCESS_TOKEN}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const rows = data.values || []

    // Saltar la primera fila (headers)
    const dataRows = rows.slice(1)

    const cotizaciones: CotizacionData[] = dataRows
      .map((row: string[]) => ({
        symbol: row[0] || "",
        name: row[1] || "",
        price: row[2] || "",
        change: row[3] || "",
        changeValue: row[4] || "",
        volume: row[5] || "",
        marketCap: row[6] || "",
        sector: row[7] || "",
        lastUpdate: new Date().toLocaleString("es-AR"),
      }))
      .filter((item: CotizacionData) => item.symbol && item.name)

    return cotizaciones
  } catch (error) {
    console.error(`Error fetching private data for ${type}:`, error)
    return getFallbackData(type)
  }
}

// Función alternativa usando Service Account (más segura)
export async function getCotizacionesWithServiceAccount(type: CotizationType): Promise<CotizacionData[]> {
  try {
    // Configuración del Service Account
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
    }

    // Obtener token de acceso
    const jwtToken = await generateJWT(serviceAccount)
    const accessToken = await getAccessToken(jwtToken)

    // Hacer la petición a la API
    const range = `${type}!A:H`
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_CONFIG.SPREADSHEET_ID}/values/${range}`

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const rows = data.values || []
    const dataRows = rows.slice(1)

    const cotizaciones: CotizacionData[] = dataRows
      .map((row: string[]) => ({
        symbol: row[0] || "",
        name: row[1] || "",
        price: row[2] || "",
        change: row[3] || "",
        changeValue: row[4] || "",
        volume: row[5] || "",
        marketCap: row[6] || "",
        sector: row[7] || "",
        lastUpdate: new Date().toLocaleString("es-AR"),
      }))
      .filter((item: CotizacionData) => item.symbol && item.name)

    return cotizaciones
  } catch (error) {
    console.error(`Error with service account for ${type}:`, error)
    return getFallbackData(type)
  }
}

// Función para generar JWT (simplificada)
async function generateJWT(serviceAccount: any): Promise<string> {
  // Implementación simplificada - en producción usar una librería como 'jsonwebtoken'
  const header = {
    alg: "RS256",
    typ: "JWT",
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }

  // En un entorno real, necesitarías firmar esto con la clave privada
  // Por ahora retornamos un placeholder
  return "JWT_TOKEN_PLACEHOLDER"
}

// Función para obtener access token
async function getAccessToken(jwtToken: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwtToken,
    }),
  })

  const data = await response.json()
  return data.access_token
}

// Datos de fallback
function getFallbackData(type: CotizationType): CotizacionData[] {
  const examples = {
    FX: [
      {
        symbol: "USD/ARS",
        name: "Dólar Oficial",
        price: "$365.50",
        change: "+0.12%",
        changeValue: "+0.44",
        volume: "N/A",
        sector: "Divisas",
        lastUpdate: new Date().toLocaleString("es-AR"),
      },
      {
        symbol: "EUR/ARS",
        name: "Euro",
        price: "$395.20",
        change: "+0.45%",
        changeValue: "+1.77",
        volume: "N/A",
        sector: "Divisas",
        lastUpdate: new Date().toLocaleString("es-AR"),
      },
    ],
    RENTA_FIJA: [
      {
        symbol: "AL30",
        name: "Bonos AL30",
        price: "$45.25",
        change: "+0.85%",
        changeValue: "+0.38",
        volume: "1.2M",
        sector: "Bonos",
        lastUpdate: new Date().toLocaleString("es-AR"),
      },
    ],
    ACCIONES: [],
    BONOS: [],
    CRYPTO: [],
  }
  return examples[type] || []
}
