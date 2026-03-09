import { NextResponse } from "next/server"
import { google } from "googleapis"
import { logMarketStatus } from "@/lib/market-hours"

const SPREADSHEET_ID = "1Zl6BBEOB7yzeSjFLkvr1EFTHVM1aa0Ozlr1Xr96-iiQ"

interface CotizacionData {
  symbol: string
  name: string
  price: string
  change: string
  changeValue: string
  volume?: string
  sector?: string
  lastUpdate?: string
}

interface ApiResponse {
  success: boolean
  data: CotizacionData[]
  lastUpdate: string
  type: string
  count: number
  error?: string
  cached?: boolean
  cacheAge?: number
  fallback?: boolean
  optimized?: boolean
  marketClosed?: boolean
  marketStatus?: {
    isOpen: boolean
    reason: string
    currentTime: string
    nextOpenTime: string | null
    timezone: string
  }
}

// Cache global con timestamp - Separamos cache de mercado abierto y cerrado - EXTENDIDO A 3 MINUTOS
let cachedData: { data: CotizacionData[]; lastUpdate: string; timestamp: number } | null = null
let lastMarketCloseData: { data: CotizacionData[]; lastUpdate: string; timestamp: number } | null = null
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

async function getCotizacionesData(): Promise<{ data: CotizacionData[]; lastUpdate: string }> {
  try {
    const sheets = await getGoogleSheetsClient()

    // Definir las celdas específicas que queremos leer
    const ranges = [
      // PRIMERA CELDA: D1 para última actualización
      "FX!D1",
      // Variables LAST existentes
      "FX!C6", // MEP_AL30_CI_LAST
      "FX!D6", // MEP_AL30_24hs_LAST
      "FX!C7", // MEP_GD30_CI_LAST
      "FX!D7", // MEP_GD30_24hs_LAST
      "FX!E6", // CCL_AL30_CI_LAST
      "FX!F6", // CCL_AL30_24hs_LAST
      "FX!E7", // CCL_GD30_CI_LAST
      "FX!F7", // CCL_GD30_24hs_LAST
      // Variables CLOSE existentes
      "FX!G6", // MEP_AL30_CI_CLOSE
      "FX!H6", // MEP_AL30_24hs_CLOSE
      "FX!G7", // MEP_GD30_CI_CLOSE
      "FX!H7", // MEP_GD30_24hs_CLOSE
      "FX!I6", // CCL_AL30_CI_CLOSE
      "FX!J6", // CCL_AL30_24hs_CLOSE
      "FX!I7", // CCL_GD30_CI_CLOSE
      "FX!J7", // CCL_GD30_24hs_CLOSE
      // Variables % (porcentajes) nuevas
      "FX!K6", // MEP_AL30_CI_%
      "FX!L6", // MEP_AL30_24hs_%
      "FX!K7", // MEP_GD30_CI_%
      "FX!L7", // MEP_GD30_24hs_%
      "FX!M6", // CCL_AL30_CI_%
      "FX!N6", // CCL_AL30_24hs_%
      "FX!M7", // CCL_GD30_CI_%
      "FX!N7", // CCL_GD30_24hs_%
      // DOLAR_OFICIAL_LAST
      "FX!E27", // DOLAR_OFICIAL_LAST
      // DOLAR_CRYPTO_LAST
      "FX!E31", // DOLAR_CRYPTO_LAST
      // NUEVAS VARIABLES CANJE
      "FX!M12", // CANJE_AL30_CI_LAST
      "FX!N12", // CANJE_AL30_24hs_LAST
      "FX!M13", // CANJE_GD30_CI_LAST
      "FX!N13", // CANJE_GD30_24hs_LAST
    ]

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges,
    })

    const values = response.data.valueRanges || []

    // Extraer valores de cada celda
    const getValue = (index: number): string => {
      const range = values[index]
      if (range?.values && range.values[0] && range.values[0][0] !== undefined) {
        const value = range.values[0][0].toString().trim()
        return value
      }
      return "0"
    }

    // PRIMERA CELDA: D1 para última actualización
    const lastUpdateFromSheet = getValue(0) // D1

    // Variables LAST (existentes)
    const mepAL30CI_LAST = getValue(1) // C6
    const mepAL30_24hs_LAST = getValue(2) // D6
    const mepGD30CI_LAST = getValue(3) // C7
    const mepGD30_24hs_LAST = getValue(4) // D7
    const cclAL30CI_LAST = getValue(5) // E6
    const cclAL30_24hs_LAST = getValue(6) // F6
    const cclGD30CI_LAST = getValue(7) // E7
    const cclGD30_24hs_LAST = getValue(8) // F7

    // Variables CLOSE (existentes)
    const mepAL30CI_CLOSE = getValue(9) // G6
    const mepAL30_24hs_CLOSE = getValue(10) // H6
    const mepGD30CI_CLOSE = getValue(11) // G7
    const mepGD30_24hs_CLOSE = getValue(12) // H7
    const cclAL30CI_CLOSE = getValue(13) // I6
    const cclAL30_24hs_CLOSE = getValue(14) // J6
    const cclGD30CI_CLOSE = getValue(15) // I7
    const cclGD30_24hs_CLOSE = getValue(16) // J7

    // Variables % (porcentajes) nuevas
    const mepAL30CI_PERCENT = getValue(17) // K6
    const mepAL30_24hs_PERCENT = getValue(18) // L6
    const mepGD30CI_PERCENT = getValue(19) // K7
    const mepGD30_24hs_PERCENT = getValue(20) // L7
    const cclAL30CI_PERCENT = getValue(21) // M6
    const cclAL30_24hs_PERCENT = getValue(22) // N6
    const cclGD30CI_PERCENT = getValue(23) // M7
    const cclGD30_24hs_PERCENT = getValue(24) // N7

    // DOLAR_OFICIAL_LAST
    const dolarOficialLast = getValue(25) // E27

    // DOLAR_CRYPTO_LAST
    const dolarCryptoLast = getValue(26) // E31

    // NUEVAS VARIABLES CANJE
    const canjeAL30CI_LAST = getValue(27) // M12
    const canjeAL30_24hs_LAST = getValue(28) // N12
    const canjeGD30CI_LAST = getValue(29) // M13
    const canjeGD30_24hs_LAST = getValue(30) // N13

    // Función para formatear porcentajes con signo
    const formatPercentage = (value: string) => {
      if (!value || value === "0" || value === "") return "0.00%"
      const num = Number.parseFloat(value) || 0
      const sign = num >= 0 ? "+" : ""
      return `${sign}${num.toFixed(2)}%`
    }

    // Función para formatear porcentajes sin signo (para mostrar como precio)
    const formatPercentageAsPrice = (value: string) => {
      if (!value || value === "0" || value === "") return "0.00%"
      const num = Number.parseFloat(value) || 0
      return `${num.toFixed(2)}%`
    }

    // Construir array de datos
    const data: CotizacionData[] = [
      // MEP AL30
      {
        symbol: "MEP_AL30_CI_CLOSE",
        name: "AL30 MEP (CI) CLOSE",
        price: `$${mepAL30CI_CLOSE}`,
        sector: "MEP",
        change: formatPercentage(mepAL30CI_PERCENT),
        changeValue: formatPercentage(mepAL30CI_PERCENT),
        lastUpdate: lastUpdateFromSheet,
      },
      {
        symbol: "MEP_AL30_CI_LAST",
        name: "AL30 MEP (CI) LAST",
        price: `$${mepAL30CI_LAST}`,
        sector: "MEP",
        change: formatPercentage(mepAL30CI_PERCENT),
        changeValue: formatPercentage(mepAL30CI_PERCENT),
        lastUpdate: lastUpdateFromSheet,
      },
      {
        symbol: "MEP_AL30_CI_%",
        name: "AL30 MEP (CI) %",
        price: formatPercentageAsPrice(mepAL30CI_PERCENT),
        sector: "MEP",
        change: "0.00%",
        changeValue: "0.00%",
        lastUpdate: lastUpdateFromSheet,
      },
      {
        symbol: "MEP_AL30_24hs_CLOSE",
        name: "AL30 MEP (24hs) CLOSE",
        price: `$${mepAL30_24hs_CLOSE}`,
        sector: "MEP",
        change: formatPercentage(mepAL30_24hs_PERCENT),
        changeValue: formatPercentage(mepAL30_24hs_PERCENT),
        lastUpdate: lastUpdateFromSheet,
      },
      {
        symbol: "MEP_AL30_24hs_LAST",
        name: "AL30 MEP (24hs) LAST",
        price: `$${mepAL30_24hs_LAST}`,
        sector: "MEP",
        change: formatPercentage(mepAL30_24hs_PERCENT),
        changeValue: formatPercentage(mepAL30_24hs_PERCENT),
        lastUpdate: lastUpdateFromSheet,
      },
      {
        symbol: "MEP_AL30_24hs_%",
        name: "AL30 MEP (24hs) %",
        price: formatPercentageAsPrice(mepAL30_24hs_PERCENT),
        sector: "MEP",
        change: "0.00%",
        changeValue: "0.00%",
        lastUpdate: lastUpdateFromSheet,
      },

      // MEP GD30
      {
        symbol: "MEP_GD30_CI_CLOSE",
        name: "GD30 MEP (CI) CLOSE",
        price: `$${mepGD30CI_CLOSE}`,
        sector: "MEP",
        change: formatPercentage(mepGD30CI_PERCENT),
        changeValue: formatPercentage(mepGD30CI_PERCENT),
        lastUpdate: lastUpdateFromSheet,
      },
      {
        symbol: "MEP_GD30_CI_LAST",
        name: "GD30 MEP (CI) LAST",
        price: `$${mepGD30CI_LAST}`,
        sector: "MEP",
        change: formatPercentage(mepGD30CI_PERCENT),
        changeValue: formatPercentage(mepGD30CI_PERCENT),
        lastUpdate: lastUpdateFromSheet,
      },
      {
        symbol: "MEP_GD30_CI_%",
        name: "GD30 MEP (CI) %",
        price: formatPercentageAsPrice(mepGD30CI_PERCENT),
        sector: "MEP",
        change: "0.00%",
        changeValue: "0.00%",
        lastUpdate: lastUpdateFromSheet,
      },
      {
        symbol: "MEP_GD30_24hs_CLOSE",
        name: "GD30 MEP (24hs) CLOSE",
        price: `$${mepGD30_24hs_CLOSE}`,
        sector: "MEP",
        change: formatPercentage(mepGD30_24hs_PERCENT),
        changeValue: formatPercentage(mepGD30_24hs_PERCENT),
        lastUpdate: lastUpdateFromSheet,
      },
      {
        symbol: "MEP_GD30_24hs_LAST",
        name: "GD30 MEP (24hs) LAST",
        price: `$${mepGD30_24hs_LAST}`,
        sector: "MEP",
        change: formatPercentage(mepGD30_24hs_PERCENT),
        changeValue: formatPercentage(mepGD30_24hs_PERCENT),
        lastUpdate: lastUpdateFromSheet,
      },
      {
        symbol: "MEP_GD30_24hs_%",
        name: "GD30 MEP (24hs) %",
        price: formatPercentageAsPrice(mepGD30_24hs_PERCENT),
        sector: "MEP",
        change: "0.00%",
        changeValue: "0.00%",
        lastUpdate: lastUpdateFromSheet,
      },

      // CCL AL30
      {
        symbol: "CCL_AL30_CI_CLOSE",
        name: "AL30 CCL (CI) CLOSE",
        price: `$${cclAL30CI_CLOSE}`,
        sector: "CCL",
        change: formatPercentage(cclAL30CI_PERCENT),
        changeValue: formatPercentage(cclAL30CI_PERCENT),
        lastUpdate: lastUpdateFromSheet,
      },
      {
        symbol: "CCL_AL30_CI_LAST",
        name: "AL30 CCL (CI) LAST",
        price: `$${cclAL30CI_LAST}`,
        sector: "CCL",
        change: formatPercentage(cclAL30CI_PERCENT),
        changeValue: formatPercentage(cclAL30CI_PERCENT),
        lastUpdate: lastUpdateFromSheet,
      },
      {
        symbol: "CCL_AL30_CI_%",
        name: "AL30 CCL (CI) %",
        price: formatPercentageAsPrice(cclAL30CI_PERCENT),
        sector: "CCL",
        change: "0.00%",
        changeValue: "0.00%",
        lastUpdate: lastUpdateFromSheet,
      },
      {
        symbol: "CCL_AL30_24hs_CLOSE",
        name: "AL30 CCL (24hs) CLOSE",
        price: `$${cclAL30_24hs_CLOSE}`,
        sector: "CCL",
        change: formatPercentage(cclAL30_24hs_PERCENT),
        changeValue: formatPercentage(cclAL30_24hs_PERCENT),
        lastUpdate: lastUpdateFromSheet,
      },
      {
        symbol: "CCL_AL30_24hs_LAST",
        name: "AL30 CCL (24hs) LAST",
        price: `$${cclAL30_24hs_LAST}`,
        sector: "CCL",
        change: formatPercentage(cclAL30_24hs_PERCENT),
        changeValue: formatPercentage(cclAL30_24hs_PERCENT),
        lastUpdate: lastUpdateFromSheet,
      },
      {
        symbol: "CCL_AL30_24hs_%",
        name: "AL30 CCL (24hs) %",
        price: formatPercentageAsPrice(cclAL30_24hs_PERCENT),
        sector: "CCL",
        change: "0.00%",
        changeValue: "0.00%",
        lastUpdate: lastUpdateFromSheet,
      },

      // CCL GD30
      {
        symbol: "CCL_GD30_CI_CLOSE",
        name: "GD30 CCL (CI) CLOSE",
        price: `$${cclGD30CI_CLOSE}`,
        sector: "CCL",
        change: formatPercentage(cclGD30CI_PERCENT),
        changeValue: formatPercentage(cclGD30CI_PERCENT),
        lastUpdate: lastUpdateFromSheet,
      },
      {
        symbol: "CCL_GD30_CI_LAST",
        name: "GD30 CCL (CI) LAST",
        price: `$${cclGD30CI_LAST}`,
        sector: "CCL",
        change: formatPercentage(cclGD30CI_PERCENT),
        changeValue: formatPercentage(cclGD30CI_PERCENT),
        lastUpdate: lastUpdateFromSheet,
      },
      {
        symbol: "CCL_GD30_CI_%",
        name: "GD30 CCL (CI) %",
        price: formatPercentageAsPrice(cclGD30CI_PERCENT),
        sector: "CCL",
        change: "0.00%",
        changeValue: "0.00%",
        lastUpdate: lastUpdateFromSheet,
      },
      {
        symbol: "CCL_GD30_24hs_CLOSE",
        name: "GD30 CCL (24hs) CLOSE",
        price: `$${cclGD30_24hs_CLOSE}`,
        sector: "CCL",
        change: formatPercentage(cclGD30_24hs_PERCENT),
        changeValue: formatPercentage(cclGD30_24hs_PERCENT),
        lastUpdate: lastUpdateFromSheet,
      },
      {
        symbol: "CCL_GD30_24hs_LAST",
        name: "GD30 CCL (24hs) LAST",
        price: `$${cclGD30_24hs_LAST}`,
        sector: "CCL",
        change: formatPercentage(cclGD30_24hs_PERCENT),
        changeValue: formatPercentage(cclGD30_24hs_PERCENT),
        lastUpdate: lastUpdateFromSheet,
      },
      {
        symbol: "CCL_GD30_24hs_%",
        name: "GD30 CCL (24hs) %",
        price: formatPercentageAsPrice(cclGD30_24hs_PERCENT),
        sector: "CCL",
        change: "0.00%",
        changeValue: "0.00%",
        lastUpdate: lastUpdateFromSheet,
      },

      // DOLAR OFICIAL
      {
        symbol: "DOLAR_OFICIAL_LAST",
        name: "DÓLAR OFICIAL LAST",
        price: `$${dolarOficialLast}`,
        sector: "OFICIAL",
        change: "0.00%",
        changeValue: "0.00%",
        lastUpdate: lastUpdateFromSheet,
      },

      // DOLAR CRYPTO
      {
        symbol: "DOLAR_CRYPTO_LAST",
        name: "DÓLAR CRYPTO LAST",
        price: `$${dolarCryptoLast}`,
        sector: "CRYPTO",
        change: "0.00%",
        changeValue: "0.00%",
        lastUpdate: lastUpdateFromSheet,
      },

      // CANJE
      {
        symbol: "CANJE_AL30_CI_LAST",
        name: "AL30 CANJE (CI) LAST",
        price: `$${canjeAL30CI_LAST}`,
        sector: "CANJE",
        change: "0.00%",
        changeValue: "0.00%",
        lastUpdate: lastUpdateFromSheet,
      },
      {
        symbol: "CANJE_AL30_24hs_LAST",
        name: "AL30 CANJE (24hs) LAST",
        price: `$${canjeAL30_24hs_LAST}`,
        sector: "CANJE",
        change: "0.00%",
        changeValue: "0.00%",
        lastUpdate: lastUpdateFromSheet,
      },
      {
        symbol: "CANJE_GD30_CI_LAST",
        name: "GD30 CANJE (CI) LAST",
        price: `$${canjeGD30CI_LAST}`,
        sector: "CANJE",
        change: "0.00%",
        changeValue: "0.00%",
        lastUpdate: lastUpdateFromSheet,
      },
      {
        symbol: "CANJE_GD30_24hs_LAST",
        name: "GD30 CANJE (24hs) LAST",
        price: `$${canjeGD30_24hs_LAST}`,
        sector: "CANJE",
        change: "0.00%",
        changeValue: "0.00%",
        lastUpdate: lastUpdateFromSheet,
      },
    ]

    // Filtrar datos que tengan valores válidos (no solo "0" o vacíos)
    const validData = data.filter((item) => {
      const hasValidPrice = item.price !== "$0" && item.price !== "$" && item.price !== "$undefined"
      return hasValidPrice
    })

    return {
      data: validData,
      lastUpdate: lastUpdateFromSheet || new Date().toLocaleString("es-AR"),
    }
  } catch (error) {
    console.error("❌ [COTIZACIONES] Error en getCotizacionesData:", error)
    throw error
  }
}

export async function GET() {
  try {
    console.log("🚀 [COTIZACIONES] API iniciando...")

    // Verificar horarios de mercado
    const marketStatus = logMarketStatus("COTIZACIONES")

    if (!marketStatus.isOpen) {
      console.log("🕐 Mercado cerrado")

      // Si tenemos datos de cierre del mercado, devolverlos
      if (lastMarketCloseData) {
        console.log("📊 Devolviendo datos del último cierre del mercado")
        return NextResponse.json({
          success: true,
          data: lastMarketCloseData.data,
          lastUpdate: `${lastMarketCloseData.lastUpdate} (Cierre del mercado)`,
          type: "FX_MARKET_CLOSE_DATA",
          timestamp: new Date().toISOString(),
          count: lastMarketCloseData.data.length,
          cached: true,
          marketClosed: true,
          marketStatus: {
            isOpen: false,
            reason: marketStatus.reason,
            currentTime: marketStatus.currentTime,
            nextOpenTime: marketStatus.nextOpenTime,
            timezone: marketStatus.timezone,
          },
        })
      }

      // Si tenemos datos en cache regular, devolverlos
      if (cachedData) {
        console.log("📊 Devolviendo datos cached regulares")
        return NextResponse.json({
          success: true,
          data: cachedData.data,
          lastUpdate: `${cachedData.lastUpdate} (Datos anteriores)`,
          type: "FX_CACHED_MARKET_CLOSED",
          timestamp: new Date().toISOString(),
          count: cachedData.data.length,
          cached: true,
          marketClosed: true,
          marketStatus: {
            isOpen: false,
            reason: marketStatus.reason,
            currentTime: marketStatus.currentTime,
            nextOpenTime: marketStatus.nextOpenTime,
            timezone: marketStatus.timezone,
          },
        })
      }

      // Intentar obtener datos frescos una vez aunque el mercado esté cerrado
      console.log("🔄 Intentando obtener datos frescos...")
      try {
        const result = await getCotizacionesData()

        if (result.data && result.data.length > 0) {
          console.log("✅ Datos frescos obtenidos con mercado cerrado")

          // Guardar como datos de cierre del mercado
          lastMarketCloseData = {
            data: result.data,
            lastUpdate: result.lastUpdate,
            timestamp: Date.now(),
          }

          return NextResponse.json({
            success: true,
            data: result.data,
            lastUpdate: `${result.lastUpdate} (Datos obtenidos)`,
            type: "FX_FRESH_MARKET_CLOSED",
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
        }
      } catch (freshDataError) {
        console.error("❌ Error obteniendo datos frescos:", freshDataError)
      }

      // No hay datos disponibles
      return NextResponse.json({
        success: true,
        data: [],
        lastUpdate: "Mercado cerrado",
        type: "FX_MARKET_CLOSED_NO_DATA",
        timestamp: new Date().toISOString(),
        count: 0,
        cached: false,
        marketClosed: true,
        marketStatus: {
          isOpen: false,
          reason: marketStatus.reason,
          currentTime: marketStatus.currentTime,
          nextOpenTime: marketStatus.nextOpenTime,
          timezone: marketStatus.timezone,
        },
        message: "Mercado cerrado. Los datos se actualizarán en horario de mercado (11:00-17:00 hs).",
      })
    }

    // Verificar cache primero (3 minutos = MAYOR AHORRO DE CRÉDITOS)
    const now = Date.now()
    if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
      console.log("💾 Usando datos del cache (3min)")
      return NextResponse.json({
        success: true,
        data: cachedData.data,
        lastUpdate: cachedData.lastUpdate,
        type: "FX_CACHED_MARKET_OPEN",
        timestamp: new Date().toISOString(),
        count: cachedData.data.length,
        cached: true,
        cacheAge: Math.round((now - cachedData.timestamp) / 1000),
        marketStatus: {
          isOpen: true,
          reason: marketStatus.reason,
          currentTime: marketStatus.currentTime,
          nextOpenTime: null,
          timezone: marketStatus.timezone,
        },
      })
    }

    console.log("🔄 Obteniendo datos frescos...")
    const result = await getCotizacionesData()

    // Actualizar cache (3 minutos = MAYOR AHORRO DE CRÉDITOS)
    cachedData = {
      data: result.data,
      lastUpdate: result.lastUpdate,
      timestamp: now,
    }

    // Si es cerca del cierre del mercado (después de las 16:30), guardar como datos de cierre
    const currentHour = new Date().getHours()
    const currentMinute = new Date().getMinutes()
    const isNearMarketClose = currentHour >= 16 && currentMinute >= 30

    if (isNearMarketClose) {
      console.log("🔔 Guardando datos como cierre del mercado")
      lastMarketCloseData = {
        data: result.data,
        lastUpdate: result.lastUpdate,
        timestamp: now,
      }
    }

    console.log("✅ Datos obtenidos:", result.data?.length || 0, "instrumentos")

    return NextResponse.json({
      success: true,
      data: result.data || [],
      lastUpdate: result.lastUpdate,
      type: "FX_FRESH_MARKET_OPEN",
      timestamp: new Date().toISOString(),
      count: result.data?.length || 0,
      cached: false,
      marketStatus: {
        isOpen: true,
        reason: marketStatus.reason,
        currentTime: marketStatus.currentTime,
        nextOpenTime: null,
        timezone: marketStatus.timezone,
      },
    })
  } catch (error) {
    console.error("❌ [COTIZACIONES] Error en API:", error)

    // Si hay error pero tenemos datos de cierre del mercado, usarlos como fallback
    if (lastMarketCloseData) {
      console.log("🔄 Usando datos de cierre como fallback")
      return NextResponse.json({
        success: true,
        data: lastMarketCloseData.data,
        lastUpdate: `${lastMarketCloseData.lastUpdate} (Fallback)`,
        type: "FX_FALLBACK_MARKET_CLOSE",
        timestamp: new Date().toISOString(),
        count: lastMarketCloseData.data.length,
        cached: true,
        fallback: true,
        error: error instanceof Error ? error.message : "Error desconocido",
        marketStatus: logMarketStatus("COTIZACIONES"),
      })
    }

    // Si hay error pero tenemos cache, usar cache como fallback
    if (cachedData) {
      console.log("🔄 Usando cache como fallback")
      return NextResponse.json({
        success: true,
        data: cachedData.data,
        lastUpdate: `${cachedData.lastUpdate} (Fallback)`,
        type: "FX_FALLBACK_CACHED",
        timestamp: new Date().toISOString(),
        count: cachedData.data.length,
        cached: true,
        fallback: true,
        error: error instanceof Error ? error.message : "Error desconocido",
        marketStatus: logMarketStatus("COTIZACIONES"),
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        data: [],
        timestamp: new Date().toISOString(),
        marketStatus: logMarketStatus("COTIZACIONES"),
      },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"
export const revalidate = 0
