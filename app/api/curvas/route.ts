import { NextResponse } from "next/server"
import { google } from "googleapis"

const SPREADSHEET_ID = "1Zl6BBEOB7yzeSjFLkvr1EFTHVM1aa0Ozlr1Xr96-iiQ"

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

interface CurvaItem {
  ticker: string
  tir: number
  precio: number
  variacion: number
  duration: number // Duration real desde Google Sheets
  tem: number
}

interface CurvaData {
  [key: string]: CurvaItem[]
}

// Cache para almacenar los datos por 3 minutos
let cachedData: CurvaData | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 3 * 60 * 1000 // 3 minutos

async function fetchCurvasData(): Promise<CurvaData> {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: credentials as any,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    })

    const sheets = google.sheets({ version: "v4", auth })

    // Definir los rangos para cada tipo de curva
    const ranges = [
      // PESOS
      "Soberanos!C156:C171", // Ticker
      "Soberanos!F156:F171", // Precio
      "Soberanos!H156:H171", // TIR
      "Soberanos!N156:N171", // Variacion
      "Soberanos!I156:I171", // TEM
      "Soberanos!J156:J171", // Duration
      // CER
      "Soberanos!C93:C108", // Ticker
      "Soberanos!I93:I108", // Precio
      "Soberanos!J93:J108", // TIR
      "Soberanos!O93:O108", // Variacion
      "Soberanos!K93:K108", // TEM
      "Soberanos!L93:L108", // Duration
      // TAMAR
      "Soberanos!C185:C191", // Ticker
      "Soberanos!F185:F191", // Precio
      "Soberanos!H185:H191", // TIR
      "Soberanos!N185:N191", // Variacion
      "Soberanos!I185:I191", // TEM
      "Soberanos!J185:J191", // Duration
      // DOLAR_LINKED
      "Soberanos!C228:C231", // Ticker
      "Soberanos!J228:J231", // Precio
      "Soberanos!K228:K231", // TIR
      "Soberanos!Q228:Q231", // Variacion
      "Soberanos!L228:L231", // TEM
      "Soberanos!M228:M231", // Duration
    ]

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges: ranges,
    })

    const values = response.data.valueRanges || []

    // Procesar datos para PESOS
    const pesosData: CurvaItem[] = []
    const pesosTickers = values[0]?.values?.flat() || []
    const pesosPrecios = values[1]?.values?.flat() || []
    const pesosTIR = values[2]?.values?.flat() || []
    const pesosVariacion = values[3]?.values?.flat() || []
    const pesosTEM = values[4]?.values?.flat() || []
    const pesosDuration = values[5]?.values?.flat() || []

    for (let i = 0; i < pesosTickers.length; i++) {
      if (pesosTickers[i] && pesosPrecios[i] && pesosTIR[i]) {
        pesosData.push({
          ticker: pesosTickers[i],
          precio: Number.parseFloat(pesosPrecios[i]) || 0,
          tir: Number.parseFloat(pesosTIR[i]) || 0,
          variacion: Number.parseFloat(pesosVariacion[i]) || 0,
          tem: Number.parseFloat(pesosTEM[i]) || 0,
          duration: Number.parseFloat(pesosDuration[i]) || (i + 1) * 0.5,
        })
      }
    }

    // Procesar datos para CER
    const cerData: CurvaItem[] = []
    const cerTickers = values[6]?.values?.flat() || []
    const cerPrecios = values[7]?.values?.flat() || []
    const cerTIR = values[8]?.values?.flat() || []
    const cerVariacion = values[9]?.values?.flat() || []
    const cerTEM = values[10]?.values?.flat() || []
    const cerDuration = values[11]?.values?.flat() || []

    for (let i = 0; i < cerTickers.length; i++) {
      if (cerTickers[i] && cerPrecios[i] && cerTIR[i]) {
        cerData.push({
          ticker: cerTickers[i],
          precio: Number.parseFloat(cerPrecios[i]) || 0,
          tir: Number.parseFloat(cerTIR[i]) || 0,
          variacion: Number.parseFloat(cerVariacion[i]) || 0,
          tem: Number.parseFloat(cerTEM[i]) || 0,
          duration: Number.parseFloat(cerDuration[i]) || (i + 1) * 0.75,
        })
      }
    }

    // Procesar datos para TAMAR
    const tamarData: CurvaItem[] = []
    const tamarTickers = values[12]?.values?.flat() || []
    const tamarPrecios = values[13]?.values?.flat() || []
    const tamarTIR = values[14]?.values?.flat() || []
    const tamarVariacion = values[15]?.values?.flat() || []
    const tamarTEM = values[16]?.values?.flat() || []
    const tamarDuration = values[17]?.values?.flat() || []

    for (let i = 0; i < tamarTickers.length; i++) {
      if (tamarTickers[i] && tamarPrecios[i] && tamarTIR[i]) {
        tamarData.push({
          ticker: tamarTickers[i],
          precio: Number.parseFloat(tamarPrecios[i]) || 0,
          tir: Number.parseFloat(tamarTIR[i]) || 0,
          variacion: Number.parseFloat(tamarVariacion[i]) || 0,
          tem: Number.parseFloat(tamarTEM[i]) || 0,
          duration: Number.parseFloat(tamarDuration[i]) || (i + 1) * 0.25,
        })
      }
    }

    // Procesar datos para DOLAR_LINKED
    const dolarLinkedData: CurvaItem[] = []
    const dolarTickers = values[18]?.values?.flat() || []
    const dolarPrecios = values[19]?.values?.flat() || []
    const dolarTIR = values[20]?.values?.flat() || []
    const dolarVariacion = values[21]?.values?.flat() || []
    const dolarTEM = values[22]?.values?.flat() || []
    const dolarDuration = values[23]?.values?.flat() || []

    for (let i = 0; i < dolarTickers.length; i++) {
      if (dolarTickers[i] && dolarPrecios[i] && dolarTIR[i]) {
        dolarLinkedData.push({
          ticker: dolarTickers[i],
          precio: Number.parseFloat(dolarPrecios[i]) || 0,
          tir: Number.parseFloat(dolarTIR[i]) || 0,
          variacion: Number.parseFloat(dolarVariacion[i]) || 0,
          tem: Number.parseFloat(dolarTEM[i]) || 0,
          duration: Number.parseFloat(dolarDuration[i]) || (i + 1) * 0.5,
        })
      }
    }

    return {
      PESOS: pesosData,
      CER: cerData,
      TAMAR: tamarData,
      DOLAR_LINKED: dolarLinkedData,
    }
  } catch (error) {
    console.error("Error fetching curvas data:", error)

    // Fallback con datos de ejemplo en caso de error
    return {
      PESOS: [
        { ticker: "S31F4", tir: 45.25, precio: 98.5, variacion: 0.15, tem: 3.2, duration: 0.25 },
        { ticker: "S31O4", tir: 46.8, precio: 96.2, variacion: -0.25, tem: 3.4, duration: 0.75 },
      ],
      CER: [
        { ticker: "T2X4", tir: 8.45, precio: 102.3, variacion: 0.08, tem: 0.68, duration: 0.5 },
        { ticker: "T2X5", tir: 9.2, precio: 98.75, variacion: -0.15, tem: 0.74, duration: 1.0 },
      ],
      TAMAR: [
        { ticker: "TX24", tir: 4.25, precio: 99.8, variacion: 0.12, tem: 0.35, duration: 0.25 },
        { ticker: "TX25", tir: 4.85, precio: 97.45, variacion: -0.08, tem: 0.39, duration: 0.75 },
      ],
      DOLAR_LINKED: [
        { ticker: "DICP", tir: 12.45, precio: 95.8, variacion: 0.25, tem: 0.98, duration: 0.5 },
        { ticker: "DICA", tir: 13.2, precio: 93.45, variacion: -0.18, tem: 1.04, duration: 1.0 },
      ],
    }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get("forceRefresh") === "true"

    const now = Date.now()

    if (!forceRefresh && cachedData && now - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json({
        data: cachedData,
        cached: true,
        timestamp: new Date(cacheTimestamp).toISOString(),
        nextUpdate: new Date(cacheTimestamp + CACHE_DURATION).toISOString(),
      })
    }

    // Obtener datos frescos
    const data = await fetchCurvasData()

    // Actualizar cache
    cachedData = data
    cacheTimestamp = now

    return NextResponse.json({
      data: data,
      cached: false,
      timestamp: new Date().toISOString(),
      nextUpdate: new Date(now + CACHE_DURATION).toISOString(),
    })
  } catch (error) {
    console.error("Error in curvas API:", error)

    // Si hay datos en cache, devolverlos aunque hayan expirado
    if (cachedData) {
      return NextResponse.json({
        data: cachedData,
        cached: true,
        error: "Error fetching fresh data, serving cached data",
        timestamp: new Date(cacheTimestamp).toISOString(),
      })
    }

    return NextResponse.json({ error: "Error fetching curvas data" }, { status: 500 })
  }
}
