import { NextResponse } from "next/server"
import { google } from "googleapis"

const SPREADSHEET_ID = "1Zl6BBEOB7yzeSjFLkvr1EFTHVM1aa0Ozlr1Xr96-iiQ"

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

export async function GET() {
  try {
    console.log("🔄 Debug Caución: Iniciando diagnóstico...")

    // Verificar variables de entorno
    const envVars = {
      GOOGLE_PROJECT_ID: !!process.env.GOOGLE_PROJECT_ID,
      GOOGLE_PRIVATE_KEY_ID: !!process.env.GOOGLE_PRIVATE_KEY_ID,
      GOOGLE_CLIENT_EMAIL: !!process.env.GOOGLE_CLIENT_EMAIL,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
    }

    console.log("🔍 Variables de entorno:", envVars)

    // Intentar conectar a Google Sheets
    const sheets = await getGoogleSheetsClient()

    // Definir las celdas de Caución
    const ranges = [
      "FX!C49", // CAUCION_1D_PESOS
      "FX!C50", // CAUCION_7D_PESOS
      "FX!C51", // CAUCION_14D_PESOS
      "FX!C52", // CAUCION_21D_PESOS
      "FX!C53", // CAUCION_28D_PESOS
      "FX!C54", // CAUCION_35D_PESOS
      "FX!C55", // CAUCION_42D_PESOS
    ]

    console.log("📊 Ranges de Caución a consultar:", ranges)

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges,
    })

    const values = response.data.valueRanges || []
    console.log("📊 Raw response from Google Sheets:", JSON.stringify(values, null, 2))

    // Extraer valores de cada celda
    const getValue = (index: number): string => {
      const range = values[index]
      if (range?.values && range.values[0] && range.values[0][0]) {
        const value = range.values[0][0].toString()
        console.log(`📍 Range ${index} (${ranges[index]}): ${value}`)
        return value
      }
      console.log(`⚠️ Range ${index} (${ranges[index]}): No data found`)
      return "0"
    }

    // Leer todas las variables de Caución
    const caucion1D = getValue(0) // C49
    const caucion7D = getValue(1) // C50
    const caucion14D = getValue(2) // C51
    const caucion21D = getValue(3) // C52
    const caucion28D = getValue(4) // C53
    const caucion35D = getValue(5) // C54
    const caucion42D = getValue(6) // C55

    const diagnosticData = {
      environmentVariables: envVars,
      spreadsheetId: SPREADSHEET_ID,
      ranges: ranges,
      rawValues: values,
      extractedValues: {
        CAUCION_1D_PESOS: caucion1D,
        CAUCION_7D_PESOS: caucion7D,
        CAUCION_14D_PESOS: caucion14D,
        CAUCION_21D_PESOS: caucion21D,
        CAUCION_28D_PESOS: caucion28D,
        CAUCION_35D_PESOS: caucion35D,
        CAUCION_42D_PESOS: caucion42D,
      },
    }

    return NextResponse.json({
      success: true,
      message: "Diagnóstico de Caución completado",
      data: diagnosticData,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error en diagnóstico de Caución:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        details: error instanceof Error ? error.stack : "No stack trace",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"
export const revalidate = 0
