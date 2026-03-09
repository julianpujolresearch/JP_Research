import { NextResponse } from "next/server"
import { google } from "googleapis"

const SPREADSHEET_ID = "1Zl6BBEOB7yzeSjFLkvr1EFTHVM1aa0Ozlr1Xr96-iiQ"

const credentials = {
  type: "service_account",
  project_id: process.env.GOOGLE_PROJECT_ID,
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_CLIENT_EMAIL}`,
}

interface PesosForwardData {
  headers: string[]
  rows: {
    ticker: string
    values: string[]
  }[]
}

// Cache para almacenar los datos por 3 minutos
let cachedData: PesosForwardData | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 3 * 60 * 1000 // 3 minutos

async function fetchPesosForwardData(): Promise<PesosForwardData> {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: credentials as any,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    })

    const sheets = google.sheets({ version: "v4", auth })

    // Traer el rango Q156:AG171 de la pestaña "Soberanos"
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Soberanos!Q156:AG171",
    })

    const values = response.data.values || []

    if (values.length === 0) {
      return { headers: [], rows: [] }
    }

    // Primera fila son los headers (tickers de columnas + "Dur.")
    const headers = values[0].map((h: any) => h?.toString() || "")

    // Resto de filas son los datos
    const rows = values.slice(1).map((row: any[]) => ({
      ticker: row[0]?.toString() || "",
      values: row.slice(1).map((v: any) => v?.toString() || ""),
    }))

    return { headers, rows }
  } catch (error) {
    console.error("Error fetching PESOS forward data:", error)
    return { headers: [], rows: [] }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get("forceRefresh") === "true"

    const now = Date.now()

    if (!forceRefresh && cachedData && now - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json({
        data: cachedData,
        cached: true,
        timestamp: new Date(cacheTimestamp).toISOString(),
        nextUpdate: new Date(cacheTimestamp + CACHE_DURATION).toISOString(),
      })
    }

    // Obtener datos frescos
    const data = await fetchPesosForwardData()

    // Actualizar cache
    cachedData = data
    cacheTimestamp = now

    return NextResponse.json({
      data: data,
      cached: false,
      timestamp: new Date().toISOString(),
      nextUpdate: new Date(now + CACHE_DURATION).toISOString(),
    })
  } catch (error) {
    console.error("Error in PESOS forward API:", error)

    if (cachedData) {
      return NextResponse.json({
        data: cachedData,
        cached: true,
        error: "Error fetching fresh data, serving cached data",
        timestamp: new Date(cacheTimestamp).toISOString(),
      })
    }

    return NextResponse.json({ error: "Error fetching PESOS forward data" }, { status: 500 })
  }
}
