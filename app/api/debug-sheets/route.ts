import { type NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

const SPREADSHEET_ID = "1Zl6BBEOB7yzeSjFLkvr1EFTHVM1aa0Ozlr1Xr96-iiQ"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const test = searchParams.get("test")

  try {
    // Test 1: Environment Variables
    if (test === "env") {
      const envVars = {
        GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID ? "✅ Configurado" : "❌ Faltante",
        GOOGLE_PRIVATE_KEY_ID: process.env.GOOGLE_PRIVATE_KEY_ID ? "✅ Configurado" : "❌ Faltante",
        GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL ? "✅ Configurado" : "❌ Faltante",
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "✅ Configurado" : "❌ Faltante",
        GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY ? "✅ Configurado" : "❌ Faltante",
      }

      return NextResponse.json({
        success: true,
        test: "environment_variables",
        results: envVars,
        message: "Estado de las variables de entorno",
      })
    }

    // Test 2: Google Sheets Connection
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

    const sheets = google.sheets({ version: "v4", auth })

    // Test 3: Leer celda F1 para última actualización
    if (test === "lastupdate") {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "FX!F1",
      })

      const lastUpdate = response.data.values?.[0]?.[0] || "No disponible"

      return NextResponse.json({
        success: true,
        test: "last_update",
        results: {
          cell: "F1",
          value: lastUpdate,
          raw_response: response.data,
        },
        message: `Última actualización desde F1: ${lastUpdate}`,
      })
    }

    // Test 4: Leer todas las celdas específicas
    const ranges = [
      "FX!F1", // Última actualización
      "FX!E6", // MEP_AL30_CI_LAST
      "FX!G6", // CCL_AL30_CI_LAST
      "FX!I6", // MEP_AL30_CI_CLOSE
      "FX!K6", // CCL_AL30_CI_CLOSE
      "FX!M6", // MEP_AL30_CI_%
      "FX!O6", // CCL_AL30_CI_%
    ]

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges,
    })

    const results = response.data.valueRanges?.map((range, index) => ({
      range: ranges[index],
      value: range.values?.[0]?.[0] || "Vacío",
    }))

    return NextResponse.json({
      success: true,
      test: "complete_diagnostic",
      results: {
        spreadsheet_id: SPREADSHEET_ID,
        ranges_tested: ranges,
        values: results,
        last_update_from_f1: results?.[0]?.value || "No disponible",
      },
      message: "Diagnóstico completo exitoso con última actualización desde F1",
    })
  } catch (error) {
    console.error("Debug API Error:", error)
    return NextResponse.json({
      success: false,
      test: test || "unknown",
      error: error instanceof Error ? error.message : "Error desconocido",
      message: "Error en el diagnóstico",
    })
  }
}
