import { NextResponse } from "next/server"
import { google } from "googleapis"
import { logMarketStatus } from "@/lib/market-hours"

const SPREADSHEET_ID = "1Zl6BBEOB7yzeSjFLkvr1EFTHVM1aa0Ozlr1Xr96-iiQ"

interface IndexData {
  name: string
  price: string
  variation: string
  positive: boolean
  lastUpdate: string
  high?: string
  low?: string
}

interface MarketStatus {
  isOpen: boolean
  reason: string
  currentTime: string
  nextOpenTime: string | null
  timezone: string
}

// Cache para índices (3 minutos)
let cachedData: {
  data: { spy: IndexData; ewz: IndexData; rofex: IndexData }
  lastUpdate: string
  timestamp: number
} | null = null
let lastMarketCloseData: {
  data: { spy: IndexData; ewz: IndexData; rofex: IndexData }
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

async function getIndicesData(): Promise<{
  data: { spy: IndexData; ewz: IndexData; rofex: IndexData }
  lastUpdate: string
  cached: boolean
}> {
  try {
    // Verificar cache
    const now = Date.now()
    if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
      console.log("✅ [INDICES] Returning cached data (3min)")
      return {
        data: cachedData.data,
        lastUpdate: cachedData.lastUpdate,
        cached: true,
      }
    }

    console.log("🔄 [INDICES] Fetching fresh data from Google Sheets")
    const sheets = await getGoogleSheetsClient()

    // Rangos específicos para SPY, EWZ y ROFEX 20
    const ranges = [
      // SPY (fila 3): I3 = price, L3 = variation
      "Equity!I3",
      "Equity!L3",
      // EWZ (fila 4): I4 = price, L4 = variation
      "Equity!I4",
      "Equity!L4",
      // ROFEX 20 (fila 5): I5 = price, J5 = high, K5 = low
      "Equity!I5",
      "Equity!J5",
      "Equity!K5",
    ]

    console.log(`🔍 [INDICES] Fetching data from ranges:`, ranges)

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges,
    })

    const getValue = (index: number): string => {
      const valueRange = response.data.valueRanges?.[index]
      const value = valueRange?.values?.[0]?.[0]
      console.log(`📍 [INDICES] Celda ${index + 1} (${ranges[index]}):`, value)
      return value?.toString() || ""
    }

    const lastUpdate = new Date().toLocaleString("es-AR")

    // Formatear números
    const formatNumber = (value: string) => {
      if (!value || value.trim() === "" || value === "0") return "--"
      const cleanValue = value.replace(/[^\d.-]/g, "")
      const num = Number.parseFloat(cleanValue)
      if (isNaN(num) || num === 0) return "--"
      return num.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    }

    // Formatear números para ROFEX (máximos y mínimos)
    const formatRofexNumber = (value: string) => {
      if (!value || value.trim() === "" || value === "0") return "--"
      const cleanValue = value.replace(/[^\d.-]/g, "")
      const num = Number.parseFloat(cleanValue)
      if (isNaN(num) || num === 0) return "--"
      return num.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    }

    // Formatear porcentaje
    const formatPercent = (value: string) => {
      if (!value || value === "0" || value.trim() === "") return "0.00%"
      const cleanValue = value.replace(/[^\d.-]/g, "")
      const num = Number.parseFloat(cleanValue) || 0
      return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`
    }

    // SPY data
    const spyPrice = getValue(0)
    const spyVariation = getValue(1)
    const spyData: IndexData = {
      name: "SPY",
      price: formatNumber(spyPrice),
      variation: formatPercent(spyVariation),
      positive: !spyVariation.includes("-"),
      lastUpdate,
      high: "--",
      low: "--",
    }

    // EWZ data
    const ewzPrice = getValue(2)
    const ewzVariation = getValue(3)
    const ewzData: IndexData = {
      name: "EWZ",
      price: formatNumber(ewzPrice),
      variation: formatPercent(ewzVariation),
      positive: !ewzVariation.includes("-"),
      lastUpdate,
      high: "--",
      low: "--",
    }

    // ROFEX 20 data
    const rofexPrice = getValue(4)
    const rofexHigh = getValue(5)
    const rofexLow = getValue(6)
    const rofexData: IndexData = {
      name: "ROFEX 20",
      price: formatNumber(rofexPrice),
      variation: "N/A",
      positive: true, // Neutral
      lastUpdate,
      high: formatRofexNumber(rofexHigh),
      low: formatRofexNumber(rofexLow),
    }

    const data = {
      spy: spyData,
      ewz: ewzData,
      rofex: rofexData,
    }

    console.log("🎯 [INDICES] Processed data:", data)

    // Actualizar cache
    cachedData = {
      data,
      lastUpdate,
      timestamp: now,
    }

    // Si es cerca del cierre del mercado, guardar como datos de cierre
    const currentHour = new Date().getHours()
    const currentMinute = new Date().getMinutes()
    const isNearMarketClose = currentHour >= 16 && currentMinute >= 30

    if (isNearMarketClose) {
      console.log("🔔 [INDICES] Guardando como datos de cierre del mercado")
      lastMarketCloseData = {
        data,
        lastUpdate,
        timestamp: now,
      }
    }

    console.log("💾 [INDICES] Data saved to cache for 3 MINUTES")

    return { data, lastUpdate, cached: false }
  } catch (error) {
    console.error("❌ [INDICES] Error fetching data:", error)

    // Fallbacks
    if (lastMarketCloseData) {
      console.log("⚠️ [INDICES] Error occurred, returning market close data")
      return {
        data: lastMarketCloseData.data,
        lastUpdate: lastMarketCloseData.lastUpdate,
        cached: true,
      }
    }

    if (cachedData) {
      console.log("⚠️ [INDICES] Error occurred, returning cached data")
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
    console.log("🚀 [INDICES] API iniciando...")

    try {
      const result = await getIndicesData()
      const marketStatus = logMarketStatus("INDICES")

      if (!marketStatus.isOpen) {
        // Guardar como datos de cierre
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
          type: "INDICES_FRESH_MARKET_CLOSED",
          timestamp: new Date().toISOString(),
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
        return NextResponse.json({
          success: true,
          data: result.data,
          lastUpdate: result.lastUpdate,
          cached: result.cached,
          type: "INDICES_MARKET_OPEN",
          timestamp: new Date().toISOString(),
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
      console.error("❌ [INDICES] Error obteniendo datos frescos:", error)
      const marketStatus = logMarketStatus("INDICES")

      // Fallbacks
      if (lastMarketCloseData) {
        return NextResponse.json({
          success: true,
          data: lastMarketCloseData.data,
          lastUpdate: `${lastMarketCloseData.lastUpdate} (Fallback - Datos de cierre)`,
          cached: true,
          type: "INDICES_FALLBACK_MARKET_CLOSE",
          timestamp: new Date().toISOString(),
          fallback: true,
          error: error instanceof Error ? error.message : "Error desconocido",
          marketStatus,
        })
      }

      if (cachedData) {
        return NextResponse.json({
          success: true,
          data: cachedData.data,
          lastUpdate: `${cachedData.lastUpdate} (Fallback - Cache)`,
          cached: true,
          type: "INDICES_FALLBACK_CACHED",
          timestamp: new Date().toISOString(),
          fallback: true,
          error: error instanceof Error ? error.message : "Error desconocido",
          marketStatus,
        })
      }

      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Error desconocido",
          data: null,
          cached: false,
          timestamp: new Date().toISOString(),
          marketStatus,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ [INDICES] Error general en API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        data: null,
        cached: false,
        timestamp: new Date().toISOString(),
        marketStatus: logMarketStatus("INDICES"),
      },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"
export const revalidate = 0
