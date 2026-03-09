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

interface CerHistoricoItem {
  duration: string
  ticker: string
  fecha1: string // 05/12/2025
  fecha2: string // 19/12/2025
  fecha3: string // 04/01/2026
}

interface CerHistoricoData {
  headers: {
    col1: string // Duration header
    col2: string // Ticker header
    col3: string // First date header
    col4: string // Second date header
    col5: string // Third date header
  }
  items: CerHistoricoItem[]
}

// Cache para almacenar los datos por 3 minutos
let cachedData: CerHistoricoData | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 3 * 60 * 1000 // 3 minutos

async function fetchCerHistoricoData(): Promise<CerHistoricoData> {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: credentials as any,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    })

    const sheets = google.sheets({ version: "v4", auth })

    // Traer el rango C114:G130 de la pestaña "Soberanos"
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Soberanos!C114:G130",
    })

    const values = response.data.values || []

    const headers = values[0] || []
    const dataRows = values.slice(1)

    const items: CerHistoricoItem[] = []

    // Process data rows (skip first row which is headers)
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      if (row && row.length >= 5) {
        items.push({
          duration: row[0]?.toString() || "",
          ticker: row[1]?.toString() || "",
          fecha1: row[2]?.toString() || "",
          fecha2: row[3]?.toString() || "",
          fecha3: row[4]?.toString() || "",
        })
      }
    }

    return {
      headers: {
        col1: headers[0]?.toString() || "Dur.",
        col2: headers[1]?.toString() || "Ticker",
        col3: headers[2]?.toString() || "Fecha 1",
        col4: headers[3]?.toString() || "Fecha 2",
        col5: headers[4]?.toString() || "Fecha 3",
      },
      items: items,
    }
  } catch (error) {
    console.error("Error fetching CER historico data:", error)
    return {
      headers: {
        col1: "Dur.",
        col2: "Ticker",
        col3: "Fecha 1",
        col4: "Fecha 2",
        col5: "Fecha 3",
      },
      items: [],
    }
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
    const data = await fetchCerHistoricoData()

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
    console.error("Error in CER historico API:", error)

    if (cachedData) {
      return NextResponse.json({
        data: cachedData,
        cached: true,
        error: "Error fetching fresh data, serving cached data",
        timestamp: new Date(cacheTimestamp).toISOString(),
      })
    }

    return NextResponse.json({ error: "Error fetching CER historico data" }, { status: 500 })
  }
}
