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
    console.log("🚀 [DEBUG-STOCKS] Starting debug...")

    // Check environment variables
    const environmentVariables = {
      GOOGLE_PROJECT_ID: !!process.env.GOOGLE_PROJECT_ID,
      GOOGLE_PRIVATE_KEY_ID: !!process.env.GOOGLE_PRIVATE_KEY_ID,
      GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
      GOOGLE_CLIENT_EMAIL: !!process.env.GOOGLE_CLIENT_EMAIL,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    }

    console.log("🔑 [DEBUG-STOCKS] Environment variables:", environmentVariables)

    const sheets = await getGoogleSheetsClient()

    // Get spreadsheet metadata to see available sheets
    console.log("📋 [DEBUG-STOCKS] Getting spreadsheet metadata...")
    const spreadsheetResponse = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    })

    const availableSheets = spreadsheetResponse.data.sheets?.map((sheet) => sheet.properties?.title || "Unknown") || []
    console.log("📋 [DEBUG-STOCKS] Available sheets:", availableSheets)

    // Test different ranges
    const possibleSheets = [...availableSheets, "Equity", "Stocks", "Acciones", "Panel", "Sheet1"]
    const possibleRanges = ["A2:F50", "B3:F50", "A1:F50", "A2:E50", "B2:F50"]

    const rangeTests = []
    let successfulRanges = 0
    let rangesWithData = 0

    for (const sheetName of possibleSheets) {
      for (const range of possibleRanges) {
        const fullRange = `${sheetName}!${range}`
        console.log(`🔍 [DEBUG-STOCKS] Testing range: ${fullRange}`)

        try {
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: fullRange,
          })

          const rows = response.data.values || []
          const success = true
          const rowCount = rows.length
          const hasData = rowCount > 0

          if (success) successfulRanges++
          if (hasData) rangesWithData++

          rangeTests.push({
            range: fullRange,
            success,
            rowCount,
            hasData,
            firstRows: rows.slice(0, 3), // First 3 rows for preview
            error: null,
          })

          console.log(`✅ [DEBUG-STOCKS] Range ${fullRange}: ${rowCount} rows`)

          // If we found data, log some details
          if (hasData && rows.length > 0) {
            console.log(`📊 [DEBUG-STOCKS] Sample data from ${fullRange}:`, rows[0])
          }
        } catch (error) {
          console.log(`❌ [DEBUG-STOCKS] Range ${fullRange} failed:`, error)
          rangeTests.push({
            range: fullRange,
            success: false,
            rowCount: 0,
            hasData: false,
            firstRows: [],
            error: error instanceof Error ? error.message : "Unknown error",
          })
        }
      }
    }

    const summary = {
      totalRangesTested: rangeTests.length,
      successfulRanges,
      rangesWithData,
    }

    console.log("📊 [DEBUG-STOCKS] Summary:", summary)

    return NextResponse.json({
      success: true,
      spreadsheetId: SPREADSHEET_ID,
      environmentVariables,
      availableSheets,
      rangeTests,
      summary,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [DEBUG-STOCKS] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"
export const revalidate = 0
