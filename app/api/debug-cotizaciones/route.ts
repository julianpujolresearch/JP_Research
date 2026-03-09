import { NextResponse } from "next/server"
import { google } from "googleapis"

const SPREADSHEET_ID = "1Zl6BBEOB7yzeSjFLkvr1EFTHVM1aa0Ozlr1Xr96-iiQ"

async function getGoogleSheetsClient() {
  console.log("🔧 [DEBUG] Configurando cliente de Google Sheets...")

  // Verificar variables de entorno
  const requiredEnvVars = [
    "GOOGLE_PROJECT_ID",
    "GOOGLE_PRIVATE_KEY_ID",
    "GOOGLE_PRIVATE_KEY",
    "GOOGLE_CLIENT_EMAIL",
    "GOOGLE_CLIENT_ID",
  ]

  const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

  if (missingVars.length > 0) {
    throw new Error(`Variables de entorno faltantes: ${missingVars.join(", ")}`)
  }

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

export async function GET() {
  try {
    console.log("🚀 [DEBUG] Iniciando debug de cotizaciones...")

    const sheets = await getGoogleSheetsClient()

    // Primero, intentemos obtener información básica del spreadsheet
    console.log("📊 [DEBUG] Obteniendo información del spreadsheet...")

    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    })

    console.log("✅ [DEBUG] Spreadsheet encontrado:", spreadsheetInfo.data.properties?.title)
    console.log(
      "📋 [DEBUG] Hojas disponibles:",
      spreadsheetInfo.data.sheets?.map((sheet) => sheet.properties?.title),
    )

    // Verificar si existe la hoja "FX"
    const fxSheet = spreadsheetInfo.data.sheets?.find((sheet) => sheet.properties?.title === "FX")

    if (!fxSheet) {
      return NextResponse.json({
        success: false,
        error: "No se encontró la hoja 'FX' en el spreadsheet",
        availableSheets: spreadsheetInfo.data.sheets?.map((sheet) => sheet.properties?.title) || [],
        spreadsheetTitle: spreadsheetInfo.data.properties?.title,
        spreadsheetId: SPREADSHEET_ID,
      })
    }

    console.log("✅ [DEBUG] Hoja FX encontrada")

    // Ahora probemos leer algunas celdas específicas
    const testRanges = [
      "FX!D1", // Última actualización
      "FX!C6", // MEP_AL30_CI_LAST
      "FX!D6", // MEP_AL30_24hs_LAST
      "FX!E27", // DOLAR_OFICIAL_LAST
      "FX!E31", // DOLAR_CRYPTO_LAST
    ]

    console.log("🔍 [DEBUG] Probando lectura de celdas:", testRanges)

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges: testRanges,
    })

    const values = response.data.valueRanges || []
    const results: any = {}

    values.forEach((range, index) => {
      const cellValue = range?.values?.[0]?.[0]
      results[testRanges[index]] = {
        value: cellValue,
        type: typeof cellValue,
        hasValue: cellValue !== undefined && cellValue !== null && cellValue !== "",
        rawRange: range,
      }
    })

    console.log("📊 [DEBUG] Resultados de lectura:", results)

    // También probemos leer un rango más amplio para ver qué hay
    console.log("🔍 [DEBUG] Probando lectura de rango amplio...")

    const wideRangeResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "FX!A1:Z50", // Rango amplio para ver estructura
    })

    const wideRangeData = wideRangeResponse.data.values || []
    console.log("📋 [DEBUG] Primeras 10 filas del rango amplio:", wideRangeData.slice(0, 10))

    return NextResponse.json({
      success: true,
      debug: {
        spreadsheetId: SPREADSHEET_ID,
        spreadsheetTitle: spreadsheetInfo.data.properties?.title,
        availableSheets: spreadsheetInfo.data.sheets?.map((sheet) => sheet.properties?.title) || [],
        fxSheetExists: !!fxSheet,
        testCells: results,
        wideRangeRowCount: wideRangeData.length,
        wideRangeSample: wideRangeData.slice(0, 5), // Primeras 5 filas como muestra
        environmentCheck: {
          hasGoogleProjectId: !!process.env.GOOGLE_PROJECT_ID,
          hasGooglePrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
          hasGoogleClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
          clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [DEBUG] Error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        stack: error instanceof Error ? error.stack : undefined,
        debug: {
          spreadsheetId: SPREADSHEET_ID,
          environmentCheck: {
            hasGoogleProjectId: !!process.env.GOOGLE_PROJECT_ID,
            hasGooglePrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
            hasGoogleClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
            clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"
export const revalidate = 0
