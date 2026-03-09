import { google } from "googleapis"

// Configuración del cliente de Google Sheets
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: "service_account",
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
})

const sheets = google.sheets({ version: "v4", auth })
const SPREADSHEET_ID = "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"

export async function getCotizacionesData() {
  try {
    console.log("🔄 Iniciando getCotizacionesData...")

    const ranges = [
      // MEP AL30 (CI)
      "FX!B2",
      "FX!C2",
      "FX!D2", // CLOSE, LAST, %
      // MEP AL30 (24hs)
      "FX!B3",
      "FX!C3",
      "FX!D3", // CLOSE, LAST, %
      // MEP GD30 (CI)
      "FX!B4",
      "FX!C4",
      "FX!D4", // CLOSE, LAST, %
      // MEP GD30 (24hs)
      "FX!B5",
      "FX!C5",
      "FX!D5", // CLOSE, LAST, %
      // CCL AL30 (CI)
      "FX!B6",
      "FX!C6",
      "FX!D6", // CLOSE, LAST, %
      // CCL AL30 (24hs)
      "FX!B7",
      "FX!C7",
      "FX!D7", // CLOSE, LAST, %
      // CCL GD30 (CI)
      "FX!B8",
      "FX!C8",
      "FX!D8", // CLOSE, LAST, %
      // CCL GD30 (24hs)
      "FX!B9",
      "FX!C9",
      "FX!D9", // CLOSE, LAST, %
      // DOLAR_OFICIAL_LAST
      "FX!G27",
      // DOLAR_CRYPTO_LAST
      "FX!G31",
    ]

    console.log("📊 Ranges a consultar:", ranges)

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges: ranges,
    })

    console.log("✅ Respuesta de Google Sheets recibida")

    const getValue = (index: number): string => {
      const valueRange = response.data.valueRanges?.[index]
      const value = valueRange?.values?.[0]?.[0]
      console.log(`📍 Celda ${index + 1} (${ranges[index]}):`, value)
      return value?.toString() || "0"
    }

    const data = [
      // MEP AL30 (CI)
      {
        id: "MEP_AL30_CI_CLOSE",
        name: "AL30 MEP (CI) CLOSE",
        price: getValue(0),
        change: getValue(2),
        sector: "MEP",
        type: "CLOSE",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      {
        id: "MEP_AL30_CI_LAST",
        name: "AL30 MEP (CI) LAST",
        price: getValue(1),
        change: getValue(2),
        sector: "MEP",
        type: "LAST",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      {
        id: "MEP_AL30_CI_PERCENT",
        name: "AL30 MEP (CI) %",
        price: getValue(2),
        change: "0.00%",
        sector: "MEP",
        type: "%",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      // MEP AL30 (24hs)
      {
        id: "MEP_AL30_24HS_CLOSE",
        name: "AL30 MEP (24hs) CLOSE",
        price: getValue(3),
        change: getValue(5),
        sector: "MEP",
        type: "CLOSE",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      {
        id: "MEP_AL30_24HS_LAST",
        name: "AL30 MEP (24hs) LAST",
        price: getValue(4),
        change: getValue(5),
        sector: "MEP",
        type: "LAST",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      {
        id: "MEP_AL30_24HS_PERCENT",
        name: "AL30 MEP (24hs) %",
        price: getValue(5),
        change: "0.00%",
        sector: "MEP",
        type: "%",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      // MEP GD30 (CI)
      {
        id: "MEP_GD30_CI_CLOSE",
        name: "GD30 MEP (CI) CLOSE",
        price: getValue(6),
        change: getValue(8),
        sector: "MEP",
        type: "CLOSE",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      {
        id: "MEP_GD30_CI_LAST",
        name: "GD30 MEP (CI) LAST",
        price: getValue(7),
        change: getValue(8),
        sector: "MEP",
        type: "LAST",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      {
        id: "MEP_GD30_CI_PERCENT",
        name: "GD30 MEP (CI) %",
        price: getValue(8),
        change: "0.00%",
        sector: "MEP",
        type: "%",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      // MEP GD30 (24hs)
      {
        id: "MEP_GD30_24HS_CLOSE",
        name: "GD30 MEP (24hs) CLOSE",
        price: getValue(9),
        change: getValue(11),
        sector: "MEP",
        type: "CLOSE",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      {
        id: "MEP_GD30_24HS_LAST",
        name: "GD30 MEP (24hs) LAST",
        price: getValue(10),
        change: getValue(11),
        sector: "MEP",
        type: "LAST",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      {
        id: "MEP_GD30_24HS_PERCENT",
        name: "GD30 MEP (24hs) %",
        price: getValue(11),
        change: "0.00%",
        sector: "MEP",
        type: "%",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      // CCL AL30 (CI)
      {
        id: "CCL_AL30_CI_CLOSE",
        name: "AL30 CCL (CI) CLOSE",
        price: getValue(12),
        change: getValue(14),
        sector: "CCL",
        type: "CLOSE",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      {
        id: "CCL_AL30_CI_LAST",
        name: "AL30 CCL (CI) LAST",
        price: getValue(13),
        change: getValue(14),
        sector: "CCL",
        type: "LAST",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      {
        id: "CCL_AL30_CI_PERCENT",
        name: "AL30 CCL (CI) %",
        price: getValue(14),
        change: "0.00%",
        sector: "CCL",
        type: "%",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      // CCL AL30 (24hs)
      {
        id: "CCL_AL30_24HS_CLOSE",
        name: "AL30 CCL (24hs) CLOSE",
        price: getValue(15),
        change: getValue(17),
        sector: "CCL",
        type: "CLOSE",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      {
        id: "CCL_AL30_24HS_LAST",
        name: "AL30 CCL (24hs) LAST",
        price: getValue(16),
        change: getValue(17),
        sector: "CCL",
        type: "LAST",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      {
        id: "CCL_AL30_24HS_PERCENT",
        name: "AL30 CCL (24hs) %",
        price: getValue(17),
        change: "0.00%",
        sector: "CCL",
        type: "%",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      // CCL GD30 (CI)
      {
        id: "CCL_GD30_CI_CLOSE",
        name: "GD30 CCL (CI) CLOSE",
        price: getValue(18),
        change: getValue(20),
        sector: "CCL",
        type: "CLOSE",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      {
        id: "CCL_GD30_CI_LAST",
        name: "GD30 CCL (CI) LAST",
        price: getValue(19),
        change: getValue(20),
        sector: "CCL",
        type: "LAST",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      {
        id: "CCL_GD30_CI_PERCENT",
        name: "GD30 CCL (CI) %",
        price: getValue(20),
        change: "0.00%",
        sector: "CCL",
        type: "%",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      // CCL GD30 (24hs)
      {
        id: "CCL_GD30_24HS_CLOSE",
        name: "GD30 CCL (24hs) CLOSE",
        price: getValue(21),
        change: getValue(23),
        sector: "CCL",
        type: "CLOSE",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      {
        id: "CCL_GD30_24HS_LAST",
        name: "GD30 CCL (24hs) LAST",
        price: getValue(22),
        change: getValue(23),
        sector: "CCL",
        type: "LAST",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      {
        id: "CCL_GD30_24HS_PERCENT",
        name: "GD30 CCL (24hs) %",
        price: getValue(23),
        change: "0.00%",
        sector: "CCL",
        type: "%",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      // DOLAR_OFICIAL_LAST
      {
        id: "DOLAR_OFICIAL_LAST",
        name: "DÓLAR OFICIAL LAST",
        price: getValue(24),
        change: "0.00%",
        sector: "OFICIAL",
        type: "LAST",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
      // DOLAR_CRYPTO_LAST
      {
        id: "DOLAR_CRYPTO_LAST",
        name: "DÓLAR CRYPTO LAST",
        price: getValue(25),
        change: "0.00%",
        sector: "CRYPTO",
        type: "LAST",
        lastUpdate: new Date().toLocaleTimeString("es-AR"),
      },
    ]

    console.log("✅ Datos procesados:", data.length, "instrumentos")
    return data
  } catch (error) {
    console.error("❌ Error en getCotizacionesData:", error)
    throw error
  }
}

export async function getCaucionData() {
  try {
    console.log("🔄 Iniciando getCaucionData...")

    // Verificar variables de entorno
    if (!process.env.GOOGLE_PROJECT_ID) {
      throw new Error("GOOGLE_PROJECT_ID no configurado")
    }
    if (!process.env.GOOGLE_CLIENT_EMAIL) {
      throw new Error("GOOGLE_CLIENT_EMAIL no configurado")
    }
    if (!process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error("GOOGLE_PRIVATE_KEY no configurado")
    }

    // Usar la misma lógica que COTIZACIONES - celdas específicas de la pestaña FX
    const ranges = [
      "FX!C49", // 1 días
      "FX!C50", // 7 días
      "FX!C51", // 14 días
      "FX!C52", // 21 días
      "FX!C53", // 28 días
      "FX!C54", // 35 días
      "FX!C55", // 42 días
    ]

    console.log("📊 Ranges de Caución a consultar:", ranges)
    console.log("📊 SPREADSHEET_ID:", SPREADSHEET_ID)

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges: ranges,
    })

    console.log("✅ Respuesta de Google Sheets recibida para Caución")
    console.log("📊 ValueRanges length:", response.data.valueRanges?.length)

    const getValue = (index: number): string => {
      const valueRange = response.data.valueRanges?.[index]
      const value = valueRange?.values?.[0]?.[0]
      console.log(`📍 Celda ${index + 1} (${ranges[index]}):`, value)
      return value?.toString() || "0"
    }

    const plazos = ["1 días", "7 días", "14 días", "21 días", "28 días", "35 días", "42 días"]

    const data = plazos.map((plazo, index) => {
      const rawValue = getValue(index)
      // Limpiar el valor (quitar % si existe)
      const tna = rawValue.replace("%", "").trim()

      console.log(`✅ Caución: ${plazo} = ${tna}% TNA`)

      return {
        plazo: plazo,
        tna: tna,
      }
    })

    console.log("✅ Datos de Caución procesados:", data.length, "plazos")
    return data
  } catch (error) {
    console.error("❌ Error en getCaucionData:", error)
    console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack")
    throw error
  }
}

// Alias para compatibilidad
export const getGoogleSheetsData = getCotizacionesData
