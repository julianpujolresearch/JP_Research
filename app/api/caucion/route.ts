import { NextResponse } from "next/server"
import { google } from "googleapis"
import { logMarketStatus } from "@/lib/market-hours"

const SPREADSHEET_ID = "1Zl6BBEOB7yzeSjFLkvr1EFTHVM1aa0Ozlr1Xr96-iiQ"

interface CaucionData {
  plazo: string
  tna: string
  lastUpdate?: string
}

// Cache extendido a 3 minutos para mayor ahorro de créditos
let cachedData: { data: CaucionData[]; lastUpdate: string; timestamp: number } | null = null
let lastMarketCloseData: { data: CaucionData[]; lastUpdate: string; timestamp: number } | null = null
const CACHE_DURATION = 180000 // 3 minutos de cache

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

async function getCaucionData(): Promise<{ data: CaucionData[]; lastUpdate: string }> {
  try {
    // Verificar cache primero (3 minutos = mayor ahorro de créditos)
    const now = Date.now()
    if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
      console.log("🚀 [CAUCION] Usando datos desde cache (3min)")
      return { data: cachedData.data, lastUpdate: cachedData.lastUpdate }
    }

    console.log("📡 [CAUCION] Fetching fresh data from Google Sheets...")
    const sheets = await getGoogleSheetsClient()

    // Intentar múltiples rangos/hojas para encontrar los datos
    const possibleRanges = [
      "FX!B43:C49", // Rango original
      "FX!A49:B55",
      "FX!B48:C56",
      "Caucion!A2:B20",
      "Caucion!B2:C20",
      "FX!A2:B20",
      "FX!B2:C20",
    ]

    let rows: any[][] = []
    let usedRange = ""

    for (const range of possibleRanges) {
      try {
        console.log(`🔍 [CAUCION] Trying range: ${range}`)
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range,
        })

        if (response.data.values && response.data.values.length > 0) {
          rows = response.data.values
          usedRange = range
          console.log(`✅ [CAUCION] Found data in range: ${range} (${rows.length} rows)`)
          break
        }
      } catch (error) {
        console.log(`⚠️ [CAUCION] Range ${range} not found or empty`)
        continue
      }
    }

    if (rows.length === 0) {
      console.log("❌ [CAUCION] No data found in any range")
      throw new Error("No se encontraron datos de caución en ningún rango")
    }

    console.log("✅ [CAUCION] Filas encontradas:", rows.length, "from range:", usedRange)

    const lastUpdate = new Date().toLocaleString("es-AR")

    // Procesar filas dinámicamente
    const data: CaucionData[] = []

    for (const row of rows) {
      // Verificar que la fila tenga datos válidos
      if (row && row.length >= 2 && row[0] && row[1]) {
        const plazo = row[0]?.toString().trim() || ""
        const tna = row[1]?.toString().trim() || "0"

        // Solo agregar si el plazo no está vacío y no es un header
        if (
          plazo &&
          plazo !== "" &&
          !plazo.toLowerCase().includes("plazo") &&
          !isNaN(Number.parseFloat(tna.replace(/[^\d.-]/g, "")))
        ) {
          console.log(`📍 [CAUCION] Plazo="${plazo}", TNA="${tna}"`)

          data.push({
            plazo: plazo,
            tna: Number.parseFloat(tna.replace(/[^\d.-]/g, "")).toFixed(2),
            lastUpdate,
          })
        }
      }
    }

    console.log("🎯 [CAUCION] Final data array:", data.length, "plazos")

    // Guardar en cache por más tiempo (MAYOR AHORRO DE CRÉDITOS)
    cachedData = {
      data,
      lastUpdate,
      timestamp: now,
    }

    // Si es cerca del cierre del mercado (después de las 16:30), guardar como datos de cierre
    const currentHour = new Date().getHours()
    const currentMinute = new Date().getMinutes()
    const isNearMarketClose = currentHour >= 16 && currentMinute >= 30

    if (isNearMarketClose) {
      console.log("🔔 [CAUCION] Guardando como datos de cierre del mercado (después de 16:30)")
      lastMarketCloseData = {
        data,
        lastUpdate,
        timestamp: now,
      }
    }

    console.log("💾 [CAUCION] Datos guardados en cache por 3 MINUTOS")

    return { data, lastUpdate }
  } catch (error) {
    console.error("❌ [CAUCION] Error fetching data:", error)

    // Si hay error pero tenemos datos de cierre, devolver datos de cierre
    if (lastMarketCloseData) {
      console.log("🔄 [CAUCION] Error en API, devolviendo datos de cierre")
      return { data: lastMarketCloseData.data, lastUpdate: lastMarketCloseData.lastUpdate }
    }

    // Si hay error pero tenemos cache, devolver cache
    if (cachedData) {
      console.log("🔄 [CAUCION] Error en API, devolviendo datos desde cache")
      return { data: cachedData.data, lastUpdate: cachedData.lastUpdate }
    }

    throw error
  }
}

export async function GET() {
  try {
    console.log("🚀 [CAUCION] API iniciando...")

    // SIEMPRE intentar obtener datos frescos primero
    console.log("🔄 [CAUCION] Intentando obtener datos frescos...")

    try {
      const result = await getCaucionData()

      // Verificar horarios de mercado DESPUÉS de obtener datos
      const marketStatus = logMarketStatus("CAUCION")

      if (!marketStatus.isOpen) {
        // Guardar como datos de cierre para futuras consultas
        lastMarketCloseData = {
          data: result.data,
          lastUpdate: result.lastUpdate,
          timestamp: Date.now(),
        }

        return NextResponse.json({
          success: true,
          data: result.data,
          lastUpdate: `${result.lastUpdate} (Datos obtenidos con mercado cerrado)`,
          type: "CAUCION_FRESH_MARKET_CLOSED",
          timestamp: new Date().toISOString(),
          count: result.data.length,
          cached: false,
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
          data: result.data || [],
          lastUpdate: result.lastUpdate,
          type: "CAUCION_MARKET_OPEN",
          timestamp: new Date().toISOString(),
          count: result.data?.length || 0,
          cached: cachedData ? Date.now() - cachedData.timestamp < CACHE_DURATION : false,
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
      console.error("❌ [CAUCION] Error obteniendo datos frescos:", error)

      // Verificar horarios de mercado
      const marketStatus = logMarketStatus("CAUCION")

      // Fallbacks
      if (lastMarketCloseData) {
        return NextResponse.json({
          success: true,
          data: lastMarketCloseData.data || [],
          lastUpdate: `${lastMarketCloseData.lastUpdate} (Fallback - Datos de cierre)`,
          type: "CAUCION_FALLBACK_MARKET_CLOSE",
          timestamp: new Date().toISOString(),
          count: lastMarketCloseData.data?.length || 0,
          cached: true,
          fallback: true,
          error: error instanceof Error ? error.message : "Error desconocido",
          marketStatus,
        })
      }

      if (cachedData) {
        return NextResponse.json({
          success: true,
          data: cachedData.data || [],
          lastUpdate: `${cachedData.lastUpdate} (Fallback - Cache)`,
          type: "CAUCION_FALLBACK_CACHED",
          timestamp: new Date().toISOString(),
          count: cachedData.data?.length || 0,
          cached: true,
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
          timestamp: new Date().toISOString(),
          marketStatus,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ [CAUCION] Error general en API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        data: [],
        timestamp: new Date().toISOString(),
        marketStatus: logMarketStatus("CAUCION"),
      },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"
export const revalidate = 0
