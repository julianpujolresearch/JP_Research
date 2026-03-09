// Versión simplificada usando la librería oficial de Google
import { google } from "googleapis"

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

const SPREADSHEET_ID = "1Zl6BBEOB7yzeSjFLkvr1EFTHVM1aa0Ozlr1Xr96-iiQ"

// Configurar autenticación
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: "service_account",
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
})

const sheets = google.sheets({ version: "v4", auth })

export async function getCotizacionesData(type: CotizationType): Promise<CotizacionData[]> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${type}!A:H`, // Ajusta el rango según tus columnas
    })

    const rows = response.data.values || []

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
    console.error(`Error fetching data for ${type}:`, error)
    return getFallbackData(type)
  }
}

// Datos de fallback en caso de error
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
    ],
    RENTA_FIJA: [],
    ACCIONES: [],
    BONOS: [],
    CRYPTO: [],
  }
  return examples[type] || []
}
