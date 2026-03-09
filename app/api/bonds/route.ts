import { NextResponse } from "next/server"
import { google } from "googleapis"
import { logMarketStatus } from "@/lib/market-hours"

const SPREADSHEET_ID = "1Zl6BBEOB7yzeSjFLkvr1EFTHVM1aa0Ozlr1Xr96-iiQ"

interface BondData {
  ticker: string
  price: string
  tir: string
  variation: string
  positive: boolean
  duration: string
  lastUpdate?: string
}

// Cache extendido a 3 minutos para mayor ahorro de créditos
let cachedData: {
  hardDollarNY: BondData[]
  hardDollarARG: BondData[]
  lastUpdate: string
  timestamp: number
} | null = null

let lastMarketCloseData: {
  hardDollarNY: BondData[]
  hardDollarARG: BondData[]
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

async function getBondsData(): Promise<{
  hardDollarNY: BondData[]
  hardDollarARG: BondData[]
  lastUpdate: string
  cached: boolean
}> {
  try {
    // Verificar cache (3 minutos = MAYOR AHORRO DE CRÉDITOS)
    const now = Date.now()
    if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
      console.log("✅ [BONDS] Returning cached data (3min)")
      return {
        hardDollarNY: cachedData.hardDollarNY,
        hardDollarARG: cachedData.hardDollarARG,
        lastUpdate: cachedData.lastUpdate,
        cached: true,
      }
    }

    console.log("🔄 [BONDS] Fetching fresh data from Google Sheets")
    const sheets = await getGoogleSheetsClient()

    // Rangos específicos basados en tu información:
    // Hard Dollar (Ley NY): filas 20-25, Hard Dollar (Ley ARG): filas 29-33
    const ranges = [
      "Soberanos!C20:T25", // Hard Dollar (Ley NY) - incluye todas las columnas necesarias
      "Soberanos!C29:T34", // Hard Dollar (Ley ARG) - incluye todas las columnas necesarias
      "Soberanos!M20:M25", // Duration Hard Dollar (Ley NY)
      "Soberanos!M29:M34", // Duration Hard Dollar (Ley ARG)
    ]

    console.log("🔍 [BONDS] Fetching data from ranges:", ranges)

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges,
    })

    const valueRanges = response.data.valueRanges || []
    console.log("📊 [BONDS] Raw data ranges:", valueRanges.length)

    const lastUpdate = new Date().toLocaleString("es-AR")

    // Función para procesar filas de bonos
    const processBondRows = (rows: any[][], durationRows: any[][], bondType: string): BondData[] => {
      const bonds: BondData[] = []

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const durationRow = durationRows[i] || []
        if (row && row.length >= 18) {
          const ticker = row[0]?.toString().trim() || ""
          const price = row[8]?.toString().trim() || "0"
          const tir = row[9]?.toString().trim() || "0"
          const variation = row[17]?.toString().trim() || "0%"
          const duration = durationRow[0]?.toString().trim() || "0"

          if (
            ticker &&
            ticker !== "" &&
            !ticker.toLowerCase().includes("ticker") &&
            !ticker.toLowerCase().includes("hard") &&
            ticker.length >= 3
          ) {
            const processedPrice = Number.parseFloat(price.replace(/[^\d.-]/g, "")) || 0
            const processedTir = Number.parseFloat(tir.replace(/[^\d.-]/g, "")) || 0
            const processedDuration = Number.parseFloat(duration.replace(/[^\d.-]/g, "")) || 0
            const processedVariation = variation.includes("%") ? variation : `${variation}%`

            bonds.push({
              ticker,
              price: processedPrice.toFixed(2),
              tir: `${processedTir.toFixed(2)}%`,
              duration: processedDuration.toFixed(2),
              variation: processedVariation,
              positive: !variation.includes("-"),
              lastUpdate,
            })

            console.log(
              `📍 [BONDS] Added ${bondType}: ${ticker} - Price: ${price}, TIR: ${tir}, Duration: ${duration}, Var: ${variation}`,
            )
          }
        }
      }

      console.log(`🎯 [BONDS] Processed ${bondType}:`, bonds.length, "bonds")
      return bonds
    }

    // Procesar Hard Dollar NY (primer y tercer rango)
    const hardDollarNY = processBondRows(valueRanges[0]?.values || [], valueRanges[2]?.values || [], "Hard Dollar NY")

    // Procesar Hard Dollar ARG (segundo y cuarto rango)
    const hardDollarARG = processBondRows(valueRanges[1]?.values || [], valueRanges[3]?.values || [], "Hard Dollar ARG")

    console.log("✅ [BONDS] Final results:", {
      hardDollarNY: hardDollarNY.length,
      hardDollarARG: hardDollarARG.length,
    })

    // Actualizar cache (3 minutos = MAYOR AHORRO DE CRÉDITOS)
    cachedData = {
      hardDollarNY,
      hardDollarARG,
      lastUpdate,
      timestamp: now,
    }

    // Si es cerca del cierre del mercado (después de las 16:30), guardar como datos de cierre
    const currentHour = new Date().getHours()
    const currentMinute = new Date().getMinutes()
    const isNearMarketClose = currentHour >= 16 && currentMinute >= 30

    if (isNearMarketClose) {
      console.log("🔔 [BONDS] Guardando como datos de cierre del mercado (después de 16:30)")
      lastMarketCloseData = {
        hardDollarNY,
        hardDollarARG,
        lastUpdate,
        timestamp: now,
      }
    }

    console.log("💾 [BONDS] Data saved to cache for 3 MINUTES")

    return { hardDollarNY, hardDollarARG, lastUpdate, cached: false }
  } catch (error) {
    console.error("❌ [BONDS] Error fetching data:", error)

    // Si hay error pero tenemos datos de cierre, devolver datos de cierre
    if (lastMarketCloseData) {
      console.log("⚠️ [BONDS] Error occurred, returning market close data")
      return {
        hardDollarNY: lastMarketCloseData.hardDollarNY,
        hardDollarARG: lastMarketCloseData.hardDollarARG,
        lastUpdate: lastMarketCloseData.lastUpdate,
        cached: true,
      }
    }

    // Si hay error pero tenemos cache, devolver cache
    if (cachedData) {
      console.log("⚠️ [BONDS] Error occurred, returning cached data")
      return {
        hardDollarNY: cachedData.hardDollarNY,
        hardDollarARG: cachedData.hardDollarARG,
        lastUpdate: cachedData.lastUpdate,
        cached: true,
      }
    }

    throw error
  }
}

export async function GET() {
  try {
    console.log("🚀 [BONDS] API iniciando...")

    // SIEMPRE intentar obtener datos frescos primero
    console.log("🔄 [BONDS] Intentando obtener datos frescos...")

    try {
      const result = await getBondsData()

      // Verificar horarios de mercado DESPUÉS de obtener datos
      const marketStatus = logMarketStatus("BONDS")

      if (!marketStatus.isOpen) {
        // Guardar como datos de cierre para futuras consultas
        lastMarketCloseData = {
          hardDollarNY: result.hardDollarNY,
          hardDollarARG: result.hardDollarARG,
          lastUpdate: result.lastUpdate,
          timestamp: Date.now(),
        }

        return NextResponse.json({
          success: true,
          data: {
            hardDollarNY: result.hardDollarNY,
            hardDollarARG: result.hardDollarARG,
          },
          lastUpdate: `${result.lastUpdate} (Datos obtenidos con mercado cerrado)`,
          cached: result.cached,
          type: "BONDS_FRESH_MARKET_CLOSED",
          timestamp: new Date().toISOString(),
          count: {
            hardDollarNY: result.hardDollarNY.length,
            hardDollarARG: result.hardDollarARG.length,
          },
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
          data: {
            hardDollarNY: result.hardDollarNY || [],
            hardDollarARG: result.hardDollarARG || [],
          },
          lastUpdate: result.lastUpdate,
          cached: result.cached,
          type: "BONDS_MARKET_OPEN",
          timestamp: new Date().toISOString(),
          count: {
            hardDollarNY: result.hardDollarNY?.length || 0,
            hardDollarARG: result.hardDollarARG?.length || 0,
          },
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
      console.error("❌ [BONDS] Error obteniendo datos frescos:", error)

      // Verificar horarios de mercado
      const marketStatus = logMarketStatus("BONDS")

      // Fallbacks
      if (lastMarketCloseData) {
        return NextResponse.json({
          success: true,
          data: {
            hardDollarNY: lastMarketCloseData.hardDollarNY,
            hardDollarARG: lastMarketCloseData.hardDollarARG,
          },
          lastUpdate: `${lastMarketCloseData.lastUpdate} (Fallback - Datos de cierre)`,
          cached: true,
          type: "BONDS_FALLBACK_MARKET_CLOSE",
          timestamp: new Date().toISOString(),
          count: {
            hardDollarNY: lastMarketCloseData.hardDollarNY.length,
            hardDollarARG: lastMarketCloseData.hardDollarARG.length,
          },
          fallback: true,
          error: error instanceof Error ? error.message : "Error desconocido",
          marketStatus,
        })
      }

      if (cachedData) {
        return NextResponse.json({
          success: true,
          data: {
            hardDollarNY: cachedData.hardDollarNY,
            hardDollarARG: cachedData.hardDollarARG,
          },
          lastUpdate: `${cachedData.lastUpdate} (Fallback - Cache)`,
          cached: true,
          type: "BONDS_FALLBACK_CACHED",
          timestamp: new Date().toISOString(),
          count: {
            hardDollarNY: cachedData.hardDollarNY.length,
            hardDollarARG: cachedData.hardDollarARG.length,
          },
          fallback: true,
          error: error instanceof Error ? error.message : "Error desconocido",
          marketStatus,
        })
      }

      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Error desconocido",
          data: {
            hardDollarNY: [],
            hardDollarARG: [],
          },
          cached: false,
          timestamp: new Date().toISOString(),
          marketStatus,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ [BONDS] Error general en API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        data: {
          hardDollarNY: [],
          hardDollarARG: [],
        },
        cached: false,
        timestamp: new Date().toISOString(),
        marketStatus: logMarketStatus("BONDS"),
      },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"
export const revalidate = 0
