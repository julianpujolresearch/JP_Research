import { NextResponse } from "next/server"
import { google } from "googleapis"
import { logMarketStatus } from "@/lib/market-hours"

const SPREADSHEET_ID = "1Zl6BBEOB7yzeSjFLkvr1EFTHVM1aa0Ozlr1Xr96-iiQ"

interface A3Data {
  posicion: string
  maturity: string
  ttm: string
  price: string
  directa: string
  tem: string
  tea: string
  tna: string
  lastUpdate?: string
}

// Cache de 3 minutos para mayor ahorro de créditos
let cachedData: {
  a3Data: A3Data[]
  lastUpdate: string
  timestamp: number
} | null = null

let lastMarketCloseData: {
  a3Data: A3Data[]
  lastUpdate: string
  timestamp: number
} | null = null

const CACHE_DURATION = 180000 // 3 minutos

async function getGoogleSheetsClient() {
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

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  })

  return google.sheets({ version: "v4", auth })
}

async function getA3Data(): Promise<{
  a3Data: A3Data[]
  lastUpdate: string
  cached: boolean
}> {
  try {
    // Verificar cache (3 minutos)
    const now = Date.now()
    if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
      console.log("✅ [A3] Returning cached data (3min)")
      return {
        a3Data: cachedData.a3Data,
        lastUpdate: cachedData.lastUpdate,
        cached: true,
      }
    }

    console.log("🔄 [A3] Fetching fresh data from Google Sheets")
    const sheets = await getGoogleSheetsClient()

    // Rango B7:I12 de la pestaña "A3"
    const range = "A3!B7:I15"

    console.log("🔍 [A3] Fetching data from range:", range)

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    })

    const rows = response.data.values || []
    console.log("📊 [A3] Raw data rows:", rows.length)

    const lastUpdate = new Date().toLocaleString("es-AR")
    const a3Data: A3Data[] = []

    // Procesar cada fila
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (row && row.length >= 8) {
        const posicion = row[0]?.toString().trim() || ""
        const maturity = row[1]?.toString().trim() || ""
        const ttm = row[2]?.toString().trim() || ""
        const price = row[3]?.toString().trim() || ""
        const directa = row[4]?.toString().trim() || ""
        const tem = row[5]?.toString().trim() || ""
        const tea = row[6]?.toString().trim() || ""
        const tna = row[7]?.toString().trim() || ""

        // Validar que tengamos al menos la posición
        if (posicion && posicion !== "" && !posicion.toLowerCase().includes("posicion")) {
          a3Data.push({
            posicion,
            maturity,
            ttm,
            price,
            directa,
            tem,
            tea,
            tna,
            lastUpdate,
          })

          console.log(`📍 [A3] Added: ${posicion} - Maturity: ${maturity}, TTM: ${ttm}, Price: ${price}, TNA: ${tna}`)
        }
      }
    }

    console.log("✅ [A3] Final results:", a3Data.length, "positions")

    // Actualizar cache (3 minutos)
    cachedData = {
      a3Data,
      lastUpdate,
      timestamp: now,
    }

    // Si es cerca del cierre del mercado (después de las 16:30), guardar como datos de cierre
    const currentHour = new Date().getHours()
    const currentMinute = new Date().getMinutes()
    const isNearMarketClose = currentHour >= 16 && currentMinute >= 30

    if (isNearMarketClose) {
      console.log("🔔 [A3] Guardando como datos de cierre del mercado (después de 16:30)")
      lastMarketCloseData = {
        a3Data,
        lastUpdate,
        timestamp: now,
      }
    }

    console.log("💾 [A3] Data saved to cache for 3 MINUTES")

    return { a3Data, lastUpdate, cached: false }
  } catch (error) {
    console.error("❌ [A3] Error fetching data:", error)

    // Si hay error pero tenemos datos de cierre, devolver datos de cierre
    if (lastMarketCloseData) {
      console.log("⚠️ [A3] Error occurred, returning market close data")
      return {
        a3Data: lastMarketCloseData.a3Data,
        lastUpdate: lastMarketCloseData.lastUpdate,
        cached: true,
      }
    }

    // Si hay error pero tenemos cache, devolver cache
    if (cachedData) {
      console.log("⚠️ [A3] Error occurred, returning cached data")
      return {
        a3Data: cachedData.a3Data,
        lastUpdate: cachedData.lastUpdate,
        cached: true,
      }
    }

    throw error
  }
}

export async function GET() {
  try {
    console.log("🚀 [A3] API iniciando...")

    // SIEMPRE intentar obtener datos frescos primero
    console.log("🔄 [A3] Intentando obtener datos frescos...")

    try {
      const result = await getA3Data()

      // Verificar horarios de mercado DESPUÉS de obtener datos
      const marketStatus = logMarketStatus("A3")

      if (!marketStatus.isOpen) {
        // Guardar como datos de cierre para futuras consultas
        lastMarketCloseData = {
          a3Data: result.a3Data,
          lastUpdate: result.lastUpdate,
          timestamp: Date.now(),
        }

        return NextResponse.json({
          success: true,
          data: result.a3Data,
          lastUpdate: `${result.lastUpdate} (Datos obtenidos con mercado cerrado)`,
          cached: result.cached,
          type: "A3_FRESH_MARKET_CLOSED",
          timestamp: new Date().toISOString(),
          count: result.a3Data.length,
          marketClosed: true,
          marketStatus: {
            isOpen: false,
            reason: marketStatus.reason,
            currentTime: marketStatus.currentTime,
            nextOpenTime: marketStatus.nextOpenTime,
            timezone: marketStatus.timezone,
          },
        })
      } else {
        // Mercado abierto
        return NextResponse.json({
          success: true,
          data: result.a3Data || [],
          lastUpdate: result.lastUpdate,
          cached: result.cached,
          type: "A3_MARKET_OPEN",
          timestamp: new Date().toISOString(),
          count: result.a3Data?.length || 0,
          marketStatus: {
            isOpen: true,
            reason: marketStatus.reason,
            currentTime: marketStatus.currentTime,
            nextOpenTime: null,
            timezone: marketStatus.timezone,
          },
        })
      }
    } catch (error) {
      console.error("❌ [A3] Error obteniendo datos frescos:", error)

      // Verificar horarios de mercado
      const marketStatus = logMarketStatus("A3")

      // Fallbacks
      if (lastMarketCloseData) {
        return NextResponse.json({
          success: true,
          data: lastMarketCloseData.a3Data,
          lastUpdate: `${lastMarketCloseData.lastUpdate} (Fallback - Datos de cierre)`,
          cached: true,
          type: "A3_FALLBACK_MARKET_CLOSE",
          timestamp: new Date().toISOString(),
          count: lastMarketCloseData.a3Data.length,
          fallback: true,
          error: error instanceof Error ? error.message : "Error desconocido",
          marketStatus,
        })
      }

      if (cachedData) {
        return NextResponse.json({
          success: true,
          data: cachedData.a3Data,
          lastUpdate: `${cachedData.lastUpdate} (Fallback - Cache)`,
          cached: true,
          type: "A3_FALLBACK_CACHED",
          timestamp: new Date().toISOString(),
          count: cachedData.a3Data.length,
          fallback: true,
          error: error instanceof Error ? error.message : "Error desconocido",
          marketStatus,
        })
      }

      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Error desconocido",
          data: [],
          cached: false,
          timestamp: new Date().toISOString(),
          marketStatus,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ [A3] Error general en API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        data: [],
        cached: false,
        timestamp: new Date().toISOString(),
        marketStatus: logMarketStatus("A3"),
      },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"
export const revalidate = 0
