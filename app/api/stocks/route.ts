import { NextResponse } from "next/server"
import { google } from "googleapis"
import { logMarketStatus } from "@/lib/market-hours"

const SPREADSHEET_ID = "1Zl6BBEOB7yzeSjFLkvr1EFTHVM1aa0Ozlr1Xr96-iiQ"

interface StockData {
  ticker: string
  close: string
  last: string
  var: string
  varPercent: string
  positive: boolean
  lastUpdate?: string
}

// Cache extendido a 3 minutos para mayor ahorro de créditos
let cachedData: { data: StockData[]; lastUpdate: string; timestamp: number } | null = null
let lastMarketCloseData: { data: StockData[]; lastUpdate: string; timestamp: number } | null = null
const CACHE_DURATION = 180000 // 3 minutos en milisegundos

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

async function getStocksData(): Promise<{ data: StockData[]; lastUpdate: string; cached: boolean }> {
  try {
    // Verificar cache (3 minutos = MAYOR AHORRO DE CRÉDITOS)
    const now = Date.now()
    if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
      console.log("✅ [STOCKS] Returning cached data (3min)")
      return {
        data: cachedData.data,
        lastUpdate: cachedData.lastUpdate,
        cached: true,
      }
    }

    console.log("🔄 [STOCKS] Fetching fresh data from Google Sheets")
    const sheets = await getGoogleSheetsClient()

    // RANGO CORRECTO: Equity!B3:F (dinámico)
    const range = "Equity!B3:F"

    console.log(`🔍 [STOCKS] Fetching data from range: ${range}`)

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    })

    const rows = response.data.values || []
    console.log("📊 [STOCKS] Raw data rows:", rows.length)

    if (rows.length === 0) {
      console.log("❌ [STOCKS] No data found in range:", range)
      throw new Error(`No se encontraron datos en el rango ${range}`)
    }

    // Procesar datos dinámicamente
    const data: StockData[] = []
    const lastUpdate = new Date().toLocaleString("es-AR")

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      // Verificar que la fila tenga datos válidos
      if (row && row.length >= 5 && row[0] && row[1] && row[2]) {
        const ticker = row[0]?.toString().trim() || ""
        const close = row[1]?.toString().trim() || "0"
        const last = row[2]?.toString().trim() || "0"
        const varValue = row[3]?.toString().trim() || "0"
        const varPercent = row[4]?.toString().trim() || "0%"

        // Solo agregar si el ticker no está vacío y no es un header
        if (
          ticker &&
          ticker !== "" &&
          !ticker.toLowerCase().includes("ticker") &&
          !ticker.toLowerCase().includes("symbol") &&
          ticker.length > 0
        ) {
          // Determinar si la variación es positiva
          const isPositive = !varPercent.includes("-")

          // Formatear números
          const formatNumber = (value: string) => {
            const cleanValue = value.replace(/[^\d.-]/g, "")
            const num = Number.parseFloat(cleanValue) || 0
            return num.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          }

          data.push({
            ticker,
            close: formatNumber(close),
            last: formatNumber(last),
            var: varValue,
            varPercent: varPercent.includes("%") ? varPercent : `${varPercent}%`,
            positive: isPositive,
            lastUpdate,
          })

          console.log(`📍 [STOCKS] Added: ${ticker} - Close: ${close}, Last: ${last}, Var: ${varPercent}`)
        }
      }
    }

    console.log("🎯 [STOCKS] Processed data:", data.length, "stocks")

    if (data.length === 0) {
      console.log("⚠️ [STOCKS] No valid stocks found after processing")
      throw new Error("No se encontraron acciones válidas después del procesamiento")
    }

    // Actualizar cache (3 minutos = MAYOR AHORRO DE CRÉDITOS)
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
      console.log("🔔 [STOCKS] Guardando como datos de cierre del mercado (después de 16:30)")
      lastMarketCloseData = {
        data,
        lastUpdate,
        timestamp: now,
      }
    }

    console.log("💾 [STOCKS] Data saved to cache for 3 MINUTES")

    return { data, lastUpdate, cached: false }
  } catch (error) {
    console.error("❌ [STOCKS] Error fetching data:", error)

    // Si hay error pero tenemos datos de cierre, devolver datos de cierre
    if (lastMarketCloseData) {
      console.log("⚠️ [STOCKS] Error occurred, returning market close data")
      return {
        data: lastMarketCloseData.data,
        lastUpdate: lastMarketCloseData.lastUpdate,
        cached: true,
      }
    }

    // Si hay error pero tenemos cache, devolver cache
    if (cachedData) {
      console.log("⚠️ [STOCKS] Error occurred, returning cached data")
      return {
        data: cachedData.data,
        lastUpdate: cachedData.lastUpdate,
        cached: true,
      }
    }

    throw error
  }
}

export async function GET() {
  try {
    console.log("🚀 [STOCKS] API iniciando...")

    // SIEMPRE intentar obtener datos frescos primero
    console.log("🔄 [STOCKS] Intentando obtener datos frescos...")

    try {
      const result = await getStocksData()

      // Verificar horarios de mercado DESPUÉS de obtener datos
      const marketStatus = logMarketStatus("STOCKS")

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
          cached: result.cached,
          type: "STOCKS_FRESH_MARKET_CLOSED",
          timestamp: new Date().toISOString(),
          count: result.data.length,
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
          cached: result.cached,
          type: "STOCKS_MARKET_OPEN",
          timestamp: new Date().toISOString(),
          count: result.data?.length || 0,
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
      console.error("❌ [STOCKS] Error obteniendo datos frescos:", error)

      // Verificar horarios de mercado
      const marketStatus = logMarketStatus("STOCKS")

      // Fallbacks
      if (lastMarketCloseData) {
        return NextResponse.json({
          success: true,
          data: lastMarketCloseData.data || [],
          lastUpdate: `${lastMarketCloseData.lastUpdate} (Fallback - Datos de cierre)`,
          cached: true,
          type: "STOCKS_FALLBACK_MARKET_CLOSE",
          timestamp: new Date().toISOString(),
          count: lastMarketCloseData.data?.length || 0,
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
          cached: true,
          type: "STOCKS_FALLBACK_CACHED",
          timestamp: new Date().toISOString(),
          count: cachedData.data?.length || 0,
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
    console.error("❌ [STOCKS] Error general en API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        data: [],
        cached: false,
        timestamp: new Date().toISOString(),
        marketStatus: logMarketStatus("STOCKS"),
      },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"
export const revalidate = 0
