"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Activity, Clock, TrendingUp, Filter, AlertCircle, History, Grid3X3 } from "lucide-react"
import {
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface CurvaItem {
  ticker: string
  tir: number
  precio: number
  variacion: number
  duration: number
  tem: number
}

interface CurvaData {
  [key: string]: CurvaItem[]
}

interface ChartDataPoint {
  duration: number
  tir: number
  ticker: string
}

interface ApiResponse {
  data: CurvaData
  cached: boolean
  timestamp: string
  nextUpdate?: string
  error?: string
}

interface CerHistoricoItem {
  duration: string
  ticker: string
  fecha1: string
  fecha2: string
  fecha3: string
}

interface CerHistoricoData {
  headers: {
    col1: string
    col2: string
    col3: string
    col4: string
    col5: string
  }
  items: CerHistoricoItem[]
}

interface CerHistoricoResponse {
  data: CerHistoricoData
  cached: boolean
  timestamp: string
  nextUpdate?: string
  error?: string
}

interface PesosHistoricoItem {
  duration: string
  ticker: string
  fecha1: string
  fecha2: string
  fecha3: string
}

interface PesosHistoricoData {
  headers: {
    col1: string
    col2: string
    col3: string
    col4: string
    col5: string
  }
  items: PesosHistoricoItem[]
}

interface PesosHistoricoResponse {
  data: PesosHistoricoData
  cached: boolean
  timestamp: string
  nextUpdate?: string
  error?: string
}

interface TamarHistoricoItem {
  duration: string
  ticker: string
  fecha1: string
  fecha2: string
  fecha3: string
}

interface TamarHistoricoData {
  headers: {
    col1: string
    col2: string
    col3: string
    col4: string
    col5: string
  }
  items: TamarHistoricoItem[]
}

interface TamarHistoricoResponse {
  data: TamarHistoricoData
  cached: boolean
  timestamp: string
  nextUpdate?: string
  error?: string
}

interface DolarLinkedHistoricoItem {
  duration: string
  ticker: string
  fecha1: string
  fecha2: string
  fecha3: string
}

interface DolarLinkedHistoricoData {
  headers: {
    col1: string
    col2: string
    col3: string
    col4: string
    col5: string
  }
  items: DolarLinkedHistoricoItem[]
}

interface DolarLinkedHistoricoResponse {
  data: DolarLinkedHistoricoData
  cached: boolean
  timestamp: string
  nextUpdate?: string
  error?: string
}

interface PesosForwardData {
  headers: string[]
  rows: {
    ticker: string
    values: string[]
  }[]
}

interface PesosForwardResponse {
  data: PesosForwardData
  cached: boolean
  timestamp: string
  nextUpdate?: string
  error?: string
}

interface CerForwardData {
  headers: string[]
  rows: {
    ticker: string
    values: string[]
  }[]
}

interface CerForwardResponse {
  data: CerForwardData
  cached: boolean
  timestamp: string
  nextUpdate?: string
  error?: string
}

const CHART_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#a855f7", // purple
  "#22c55e", // green
  "#eab308", // yellow
  "#0ea5e9", // sky
  "#d946ef", // fuchsia
  "#64748b", // slate
  "#78716c", // stone
  "#dc2626", // red-600
  "#2563eb", // blue-600
]

// Cada línea representa una fecha diferente
// Eje X: Duration, Eje Y: Tasa (%)
// Retorna un objeto con los datos para cada fecha y las fechas como keys
const prepareHistoricoScatterData = (
  items: { duration: string; ticker: string; fecha1: string; fecha2: string; fecha3: string }[],
  headers: { col3: string; col4: string; col5: string },
) => {
  const fechas = [
    { key: "fecha1", label: headers.col3, color: "#3b82f6" }, // blue
    { key: "fecha2", label: headers.col4, color: "#10b981" }, // emerald
    { key: "fecha3", label: headers.col5, color: "#f59e0b" }, // amber
  ].filter((f) => f.label && f.label !== "")

  // Para cada fecha, crear array de puntos {duration, tasa, ticker}
  const dataByFecha: { [key: string]: { duration: number; tasa: number; ticker: string }[] } = {}
  const regressionCurves: { [key: string]: { duration: number; tasa: number }[] } = {}

  fechas.forEach((fecha) => {
    dataByFecha[fecha.key] = []
    items.forEach((item) => {
      const durValue = Number.parseFloat(item.duration?.replace(",", ".") || "0")
      const tasaValue = item[fecha.key as "fecha1" | "fecha2" | "fecha3"]

      // Solo incluir si hay valores válidos
      if (
        !isNaN(durValue) &&
        durValue > 0 &&
        tasaValue &&
        !tasaValue.includes("#") &&
        tasaValue !== "-" &&
        tasaValue !== ""
      ) {
        const numTasa = Number.parseFloat(tasaValue.replace("%", "").replace(",", "."))
        if (!isNaN(numTasa)) {
          dataByFecha[fecha.key].push({
            duration: durValue,
            tasa: numTasa,
            ticker: item.ticker,
          })
        }
      }
    })
    // Ordenar por duration
    dataByFecha[fecha.key].sort((a, b) => a.duration - b.duration)

    const regression = calculateLogarithmicRegression(dataByFecha[fecha.key])
    if (regression && dataByFecha[fecha.key].length > 0) {
      const minDur = Math.min(...dataByFecha[fecha.key].map((d) => d.duration))
      const maxDur = Math.max(...dataByFecha[fecha.key].map((d) => d.duration))
      regressionCurves[fecha.key] = generateLogarithmicCurve(regression, minDur, maxDur)
    } else {
      regressionCurves[fecha.key] = []
    }
  })

  return { dataByFecha, fechas, regressionCurves }
}

// Esta función implementa la fórmula de regresión logarítmica usando mínimos cuadrados.
// Se usa para generar líneas de tendencia suavizadas en los gráficos de evolución histórica.
const calculateLogarithmicRegression = (
  data: { duration: number; tasa: number }[],
): { a: number; b: number } | null => {
  // Filtrar puntos con duration > 0 (ln(0) es indefinido)
  const validData = data.filter((d) => d.duration > 0 && !isNaN(d.tasa))

  if (validData.length < 2) return null

  const n = validData.length
  let sumLnX = 0
  let sumY = 0
  let sumLnX2 = 0
  let sumLnXY = 0

  validData.forEach((point) => {
    const lnX = Math.log(point.duration)
    sumLnX += lnX
    sumY += point.tasa
    sumLnX2 += lnX * lnX
    sumLnXY += lnX * point.tasa
  })

  const denominator = n * sumLnX2 - sumLnX * sumLnX
  if (Math.abs(denominator) < 0.0001) return null

  const b = (n * sumLnXY - sumLnX * sumY) / denominator
  const a = (sumY - b * sumLnX) / n

  return { a, b }
}

// Genera 50 puntos interpolados para crear una curva suave
const generateLogarithmicCurve = (
  regression: { a: number; b: number },
  minX: number,
  maxX: number,
  numPoints = 50,
): { duration: number; tasa: number }[] => {
  const points: { duration: number; tasa: number }[] = []
  const step = (maxX - minX) / (numPoints - 1)

  for (let i = 0; i < numPoints; i++) {
    const x = minX + step * i
    if (x > 0) {
      const y = regression.a + regression.b * Math.log(x)
      points.push({ duration: x, tasa: y })
    }
  }

  return points
}

const calculateYDomain = (dataByFecha: { [key: string]: { tasa: number }[] }): [number, number] => {
  let minVal = Number.POSITIVE_INFINITY
  let maxVal = Number.NEGATIVE_INFINITY

  Object.values(dataByFecha).forEach((data) => {
    data.forEach((point) => {
      if (point.tasa < minVal) minVal = point.tasa
      if (point.tasa > maxVal) maxVal = point.tasa
    })
  })

  if (minVal === Number.POSITIVE_INFINITY || maxVal === Number.NEGATIVE_INFINITY) return [0, 100]

  // Agregar 10% de padding arriba y abajo
  const range = maxVal - minVal
  const padding = range * 0.1

  // Redondear a múltiplos de 5 para mejor lectura
  const yMin = Math.floor((minVal - padding) / 5) * 5
  const yMax = Math.ceil((maxVal + padding) / 5) * 5

  return [Math.max(0, yMin), yMax]
}

// Transforma los datos de la tabla histórica en formato para Recharts
// Maneja valores #N/A convirtiéndolos a null para usar connectNulls={true}
// Esto permite que las líneas se conecten saltando los puntos sin datos
const prepareHistoricoChartData = (
  items: { ticker: string; fecha1: string; fecha2: string; fecha3: string }[],
  headers: { col3: string; col4: string; col5: string },
) => {
  // Crear array de fechas (eje X)
  const fechas = [headers.col3, headers.col4, headers.col5].filter((f) => f && f !== "")

  // Crear datos para cada fecha
  return fechas.map((fecha, fechaIndex) => {
    const dataPoint: { [key: string]: string | number | null } = { fecha }

    items.forEach((item) => {
      const valorKey = `fecha${fechaIndex + 1}` as "fecha1" | "fecha2" | "fecha3"
      const valor = item[valorKey]

      // Convertir valor a número, o null si es #N/A o inválido
      // Los valores null serán manejados por connectNulls={true} en Recharts
      if (valor && !valor.includes("#") && valor !== "-" && valor !== "") {
        const numValue = Number.parseFloat(valor.replace("%", "").replace(",", "."))
        dataPoint[item.ticker] = isNaN(numValue) ? null : numValue
      } else {
        dataPoint[item.ticker] = null
      }
    })

    return dataPoint
  })
}

export default function CurvasPage() {
  const [curvas, setCurvas] = useState<CurvaData>({})
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>("")
  const [filtroTipo, setFiltroTipo] = useState<string>("TODOS")
  const [isCached, setIsCached] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cerHistorico, setCerHistorico] = useState<CerHistoricoData>({
    headers: {
      col1: "Dur.",
      col2: "Ticker",
      col3: "",
      col4: "",
      col5: "",
    },
    items: [],
  })
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  const [pesosHistorico, setPesosHistorico] = useState<PesosHistoricoData>({
    headers: {
      col1: "Dur.",
      col2: "Ticker",
      col3: "",
      col4: "",
      col5: "",
    },
    items: [],
  })
  const [loadingPesosHistorico, setLoadingPesosHistorico] = useState(false)
  const [tamarHistorico, setTamarHistorico] = useState<TamarHistoricoData>({
    headers: {
      col1: "Dur.",
      col2: "Ticker",
      col3: "",
      col4: "",
      col5: "",
    },
    items: [],
  })
  const [loadingTamarHistorico, setLoadingTamarHistorico] = useState(false)
  const [dolarLinkedHistorico, setDolarLinkedHistorico] = useState<DolarLinkedHistoricoData>({
    headers: {
      col1: "Dur.",
      col2: "Ticker",
      col3: "",
      col4: "",
      col5: "",
    },
    items: [],
  })
  const [loadingDolarLinkedHistorico, setLoadingDolarLinkedHistorico] = useState(false)
  const [pesosForward, setPesosForward] = useState<PesosForwardData>({
    headers: [],
    rows: [],
  })
  const [loadingPesosForward, setLoadingPesosForward] = useState(false)
  const [cerForward, setCerForward] = useState<CerForwardData>({
    headers: [],
    rows: [],
  })
  const [loadingCerForward, setLoadingCerForward] = useState(false)

  // Esta función calcula el percentil N de un array de valores numéricos.
  // Se usa para evitar que los outliers distorsionen la escala de colores del heatmap.
  // Por ejemplo, si hay un valor de 975% y el resto está entre 30-50%,
  // sin percentiles todo se vería del mismo color excepto ese outlier.
  const calculatePercentile = (values: number[], percentile: number): number => {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const index = (percentile / 100) * (sorted.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    if (lower === upper) return sorted[lower]
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
  }

  // LÓGICA DE PERCENTILES PARA HEATMAP:
  // Configuraciones separadas para cada matriz forward:
  // - PESOS: P20 (mínimo/verde), P50 (medio/amarillo), P90 (máximo/rojo)
  // - CER: P10 (mínimo/verde), P50 (medio/amarillo), P90 (máximo/rojo)

  const pesosForwardValues = useMemo(() => {
    const values: number[] = []
    pesosForward.rows.forEach((row) => {
      row.values.slice(0, -1).forEach((value) => {
        if (value && value !== "" && value !== "-" && !value.includes("#")) {
          const numValue = Number.parseFloat(value.replace("%", "").replace(",", "."))
          if (!isNaN(numValue)) {
            values.push(numValue)
          }
        }
      })
    })
    return values
  }, [pesosForward])

  const cerForwardValues = useMemo(() => {
    const values: number[] = []
    cerForward.rows.forEach((row) => {
      row.values.slice(0, -1).forEach((value) => {
        if (value && value !== "" && value !== "-" && !value.includes("#")) {
          const numValue = Number.parseFloat(value.replace("%", "").replace(",", "."))
          if (!isNaN(numValue)) {
            values.push(numValue)
          }
        }
      })
    })
    return values
  }, [cerForward])

  const pesosPercentiles = useMemo(() => {
    if (pesosForwardValues.length === 0) {
      return { pMin: 30, pMid: 35, pMax: 45 }
    }
    return {
      pMin: calculatePercentile(pesosForwardValues, 20), // Punto mínimo: P20
      pMid: calculatePercentile(pesosForwardValues, 50), // Punto medio: P50
      pMax: calculatePercentile(pesosForwardValues, 90), // Punto máximo: P90
    }
  }, [pesosForwardValues])

  const cerPercentiles = useMemo(() => {
    if (cerForwardValues.length === 0) {
      return { pMin: 5, pMid: 10, pMax: 20 }
    }
    return {
      pMin: calculatePercentile(cerForwardValues, 10), // Punto mínimo: P10
      pMid: calculatePercentile(cerForwardValues, 50), // Punto medio: P50
      pMax: calculatePercentile(cerForwardValues, 90), // Punto máximo: P90
    }
  }, [cerForwardValues])

  const tipoLabels: { [key: string]: string } = {
    PESOS: "Curva en Pesos",
    CER: "Curva CER",
    TAMAR: "Curva TAMAR",
    DOLAR_LINKED: "Curva Dólar Linked",
  }

  const tipoDescriptions: { [key: string]: string } = {
    PESOS: "bonos en pesos (datos del cierre del mercado)",
    CER: "bonos CER (datos del cierre del mercado)",
    TAMAR: "bonos TAMAR (datos del cierre del mercado)",
    DOLAR_LINKED: "bonos dólar linked (datos del cierre del mercado)",
  }

  const tipoColors: { [key: string]: string } = {
    PESOS: "#3b82f6", // blue
    CER: "#10b981", // emerald
    TAMAR: "#f59e0b", // amber
    DOLAR_LINKED: "#ef4444", // red
  }

  // LÓGICA DE COLORES HEATMAP CON 3 PUNTOS DE REFERENCIA:
  // - P_min (percentil mínimo): punto mínimo -> verde intenso
  // - P_mid (percentil medio): punto medio -> amarillo
  // - P_max (percentil máximo): punto máximo -> rojo intenso
  // Valores fuera de este rango se muestran en colores extremos
  // La función recibe los percentiles calculados para cada tipo de curva.
  const getHeatmapColor = (value: string, percentiles: { pMin: number; pMid: number; pMax: number }): string => {
    if (!value || value === "" || value === "-") return "bg-gray-200"

    // Handle error values
    if (value.includes("#")) return "bg-gray-300 text-gray-500"

    // Parse percentage value
    const numValue = Number.parseFloat(value.replace("%", "").replace(",", "."))
    if (isNaN(numValue)) return "bg-gray-200"

    const { pMin, pMid, pMax } = percentiles

    // Valores por debajo del percentil mínimo: verde intenso
    if (numValue <= pMin) return "bg-green-500 text-white"

    // Valores por encima del percentil máximo: rojo intenso (outliers altos)
    if (numValue >= pMax) return "bg-red-500 text-white"

    // Entre pMin y pMid: gradiente verde -> amarillo
    if (numValue < pMid) {
      const range = pMid - pMin
      const relativePosition = (numValue - pMin) / range
      if (relativePosition < 0.33) return "bg-green-400 text-white"
      if (relativePosition < 0.66) return "bg-green-300 text-gray-800"
      return "bg-yellow-300 text-gray-800"
    }

    // Entre pMid y pMax: gradiente amarillo -> rojo
    const range = pMax - pMid
    const relativePosition = (numValue - pMid) / range
    if (relativePosition < 0.33) return "bg-yellow-400 text-gray-800"
    if (relativePosition < 0.66) return "bg-orange-400 text-white"
    return "bg-orange-500 text-white"
  }

  // La columna Duration tiene valores numéricos diferentes (0.01 a ~2+ años)
  // por lo que necesita su propia escala de colores (azules)
  const getDurationHeatmapColor = (value: string): string => {
    if (!value || value === "" || value === "-") return "bg-gray-200"

    // Handle error values
    if (value.includes("#")) return "bg-gray-300 text-gray-500"

    // Parse numeric value (duration is a decimal number, not percentage)
    const numValue = Number.parseFloat(value.replace(",", "."))
    if (isNaN(numValue)) return "bg-gray-200"

    // Color scale for Duration (0 to ~2+ years typically)
    // Blue scale: lighter for low duration, darker for high duration
    if (numValue < 0.2) return "bg-blue-100 text-blue-800"
    if (numValue < 0.5) return "bg-blue-200 text-blue-800"
    if (numValue < 0.8) return "bg-blue-300 text-blue-900"
    if (numValue < 1.0) return "bg-blue-400 text-white"
    if (numValue < 1.5) return "bg-blue-500 text-white"
    if (numValue < 2.0) return "bg-blue-600 text-white"
    return "bg-blue-700 text-white"
  }

  const fetchCurvas = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      const url = forceRefresh ? "/api/curvas?forceRefresh=true" : "/api/curvas"
      const response = await fetch(url)
      const result: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error fetching data")
      }

      setCurvas(result.data)
      setIsCached(result.cached)
      setLastUpdate(new Date(result.timestamp).toLocaleTimeString("es-AR"))

      if (result.error) {
        setError(result.error)
      }
    } catch (error) {
      console.error("Error fetching curvas:", error)
      setError("Error al cargar los datos de curvas")
    } finally {
      setLoading(false)
    }
  }

  const fetchCerHistorico = async (forceRefresh = false) => {
    try {
      setLoadingHistorico(true)
      const url = forceRefresh ? "/api/cer-historico?forceRefresh=true" : "/api/cer-historico"
      const response = await fetch(url)
      const result: CerHistoricoResponse = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error fetching CER historico data")
      }

      setCerHistorico(result.data)
    } catch (error) {
      console.error("Error fetching CER historico:", error)
    } finally {
      setLoadingHistorico(false)
    }
  }

  const fetchPesosHistorico = async (forceRefresh = false) => {
    try {
      setLoadingPesosHistorico(true)
      const url = forceRefresh ? "/api/pesos-historico?forceRefresh=true" : "/api/pesos-historico"
      const response = await fetch(url)
      const result: PesosHistoricoResponse = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error fetching PESOS historico data")
      }

      setPesosHistorico(result.data)
    } catch (error) {
      console.error("Error fetching PESOS historico:", error)
    } finally {
      setLoadingPesosHistorico(false)
    }
  }

  const fetchTamarHistorico = async (forceRefresh = false) => {
    try {
      setLoadingTamarHistorico(true)
      const url = forceRefresh ? "/api/tamar-historico?forceRefresh=true" : "/api/tamar-historico"
      const response = await fetch(url)
      const result: TamarHistoricoResponse = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error fetching TAMAR historico data")
      }

      setTamarHistorico(result.data)
    } catch (error) {
      console.error("Error fetching TAMAR historico:", error)
    } finally {
      setLoadingTamarHistorico(false)
    }
  }

  const fetchDolarLinkedHistorico = async (forceRefresh = false) => {
    setLoadingDolarLinkedHistorico(true)
    try {
      const url = forceRefresh ? "/api/dolar-linked-historico?forceRefresh=true" : "/api/dolar-linked-historico"
      const response = await fetch(url)
      if (response.ok) {
        const result = await response.json()
        setDolarLinkedHistorico(result.data)
      }
    } catch (error) {
      console.error("Error fetching DOLAR LINKED historico:", error)
    } finally {
      setLoadingDolarLinkedHistorico(false)
    }
  }

  const fetchPesosForward = async (forceRefresh = false) => {
    try {
      setLoadingPesosForward(true)
      const url = forceRefresh ? "/api/pesos-forward?forceRefresh=true" : "/api/pesos-forward"
      const response = await fetch(url)
      const result: PesosForwardResponse = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error fetching PESOS forward data")
      }

      setPesosForward(result.data)
    } catch (error) {
      console.error("Error fetching PESOS forward:", error)
    } finally {
      setLoadingPesosForward(false)
    }
  }

  const fetchCerForward = async (forceRefresh = false) => {
    try {
      setLoadingCerForward(true)
      const url = forceRefresh ? "/api/cer-forward?forceRefresh=true" : "/api/cer-forward"
      const response = await fetch(url)
      const result: CerForwardResponse = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error fetching CER forward data")
      }

      setCerForward(result.data)
    } catch (error) {
      console.error("Error fetching CER forward:", error)
    } finally {
      setLoadingCerForward(false)
    }
  }

  const fetchAllData = (forceRefresh = false) => {
    fetchCurvas(forceRefresh)
    fetchCerHistorico(forceRefresh)
    fetchPesosHistorico(forceRefresh)
    fetchTamarHistorico(forceRefresh)
    fetchDolarLinkedHistorico(forceRefresh)
    fetchPesosForward(forceRefresh)
    fetchCerForward(forceRefresh)
  }

  useEffect(() => {
    // Carga inicial sin forceRefresh (usa cache si está disponible)
    fetchAllData(false)

    // Auto-refresh cada 3 minutos
    const interval = setInterval(() => {
      fetchAllData(false)
    }, 180000)

    // Esto garantiza datos frescos después de cambiar de pestaña o minimizar
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Forzar refresh para bypassear el cache del servidor
        fetchAllData(true)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  const prepareChartData = (data: CurvaItem[]): ChartDataPoint[] => {
    return data
      .map((item) => ({
        duration: item.duration,
        tir: item.tir,
        ticker: item.ticker,
      }))
      .sort((a, b) => a.duration - b.duration)
  }

  const curvasFiltradas = () => {
    if (filtroTipo === "TODOS") {
      return curvas
    } else {
      return { [filtroTipo]: curvas[filtroTipo] || [] }
    }
  }

  const contarTotalInstrumentos = () => {
    const filtradas = curvasFiltradas()
    return Object.values(filtradas).reduce((total, items) => total + items.length, 0)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-12 bg-gray-200 rounded w-1/3"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Curvas</h1>
            <p className="text-muted-foreground">
              Curvas de rendimientos en tiempo real - {contarTotalInstrumentos()} instrumentos
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Última actualización: {lastUpdate}</span>
          </div>
        </div>

        {error && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="flex items-center space-x-2 pt-6">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-800">{error}</span>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-3">
                <Filter className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Filtros</CardTitle>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-muted-foreground">Tipo de Curva:</span>
                  <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">
                        <div className="flex items-center space-x-2">
                          <Activity className="h-4 w-4" />
                          <span>Todas las Curvas</span>
                        </div>
                      </SelectItem>
                      {Object.entries(tipoLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tipoColors[key] }} />
                            <span>{label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {filtroTipo === "TODOS" ? "Todas las curvas" : tipoLabels[filtroTipo]}
              </Badge>
              <Badge variant="outline">{contarTotalInstrumentos()} instrumentos</Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Auto-refresh 3min
              </Badge>
            </div>
          </CardContent>
        </Card>

        {Object.entries(curvasFiltradas()).map(([tipo, data]) => (
          <div key={tipo} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-3">
                      <Activity className="h-5 w-5" style={{ color: tipoColors[tipo] }} />
                      <CardTitle className="text-xl">{tipoLabels[tipo]}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Cache 3min
                      </Badge>
                      <Badge variant="outline" className="border-blue-200 text-blue-700">
                        <Clock className="h-3 w-3 mr-1" />
                        {isCached ? "Datos de Cache" : "Datos Frescos"}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>
                    {data.length} {tipoDescriptions[tipo]}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-0 divide-y divide-gray-100">
                    {data.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                        <div className="flex flex-col space-y-1">
                          <span className="font-semibold text-lg">{item.ticker}</span>
                          <span className="text-sm text-muted-foreground">TIR: {item.tir.toFixed(2)}%</span>
                          <span className="text-sm text-muted-foreground">TEM: {item.tem.toFixed(2)}%</span>
                          <span className="text-sm text-muted-foreground">Duration: {item.duration.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <span className="font-bold text-lg">${item.precio.toFixed(2)}</span>
                          <span
                            className={`text-sm font-medium ${item.variacion >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {item.variacion >= 0 ? "+" : ""}
                            {item.variacion.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-5 w-5" style={{ color: tipoColors[tipo] }} />
                    <CardTitle className="text-xl">Curva TIR vs Duration</CardTitle>
                  </div>
                  <CardDescription>Visualización de la curva de rendimientos - {tipoLabels[tipo]}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={prepareChartData(data)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="duration"
                          stroke="#666"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          label={{ value: "Duration (años)", position: "insideBottom", offset: -10 }}
                        />
                        <YAxis
                          stroke="#666"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          label={{ value: "TIR (%)", angle: -90, position: "insideLeft" }}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload as ChartDataPoint
                              return (
                                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                  <p className="font-semibold">{data.ticker}</p>
                                  <p className="text-sm text-gray-600">Duration: {label} años</p>
                                  <p className="text-sm" style={{ color: tipoColors[tipo] }}>
                                    TIR: {data.tir.toFixed(2)}%
                                  </p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="tir"
                          stroke={tipoColors[tipo]}
                          strokeWidth={3}
                          dot={{ fill: tipoColors[tipo], strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: tipoColors[tipo], strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {tipo === "PESOS" && (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Grid3X3 className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-xl">Matriz Forward PESOS</CardTitle>
                    </div>
                    <CardDescription>Tasas forward implícitas entre bonos en PESOS</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingPesosForward ? (
                      <div className="animate-pulse">
                        <div className="h-96 bg-gray-200 rounded"></div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-gray-100">
                              {pesosForward.headers.map((header, index) => (
                                <th
                                  key={index}
                                  className="border border-gray-300 px-2 py-1 text-center font-semibold whitespace-nowrap"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {pesosForward.rows.map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                <td className="border border-gray-300 px-2 py-1 font-medium bg-yellow-100 text-yellow-800 whitespace-nowrap">
                                  {row.ticker}
                                </td>
                                {row.values.map((value, colIndex) => {
                                  const isLastColumn = colIndex === row.values.length - 1
                                  const colorClass = isLastColumn
                                    ? getDurationHeatmapColor(value)
                                    : getHeatmapColor(value, pesosPercentiles)
                                  return (
                                    <td
                                      key={colIndex}
                                      className={`border border-gray-300 px-2 py-1 text-center whitespace-nowrap ${colorClass}`}
                                    >
                                      {value || ""}
                                    </td>
                                  )
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <History className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-xl">Evolución Histórica PESOS</CardTitle>
                    </div>
                    <CardDescription>Comparación de tasas históricas de bonos en PESOS</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingPesosHistorico ? (
                      <div className="animate-pulse">
                        <div className="h-64 bg-gray-200 rounded"></div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold whitespace-nowrap">
                                {pesosHistorico.headers.col1}
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold whitespace-nowrap">
                                {pesosHistorico.headers.col2}
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold whitespace-nowrap">
                                {pesosHistorico.headers.col3}
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold whitespace-nowrap">
                                {pesosHistorico.headers.col4}
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold whitespace-nowrap">
                                {pesosHistorico.headers.col5}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {pesosHistorico.items.map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-2">{item.duration}</td>
                                <td className="border border-gray-300 px-4 py-2 font-medium">{item.ticker}</td>
                                <td
                                  className={`border border-gray-300 px-4 py-2 ${
                                    item.fecha1.includes("#") ? "bg-red-50 text-red-700" : "bg-blue-50"
                                  }`}
                                >
                                  {item.fecha1}
                                </td>
                                <td
                                  className={`border border-gray-300 px-4 py-2 ${
                                    item.fecha2.includes("#") ? "bg-red-50 text-red-700" : ""
                                  }`}
                                >
                                  {item.fecha2}
                                </td>
                                <td
                                  className={`border border-gray-300 px-4 py-2 ${
                                    item.fecha3.includes("#") ? "bg-red-50 text-red-700" : ""
                                  }`}
                                >
                                  {item.fecha3}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {!loadingPesosHistorico && pesosHistorico.items.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-xl">Gráfico Evolución PESOS</CardTitle>
                      </div>
                      <CardDescription>
                        Curvas de rendimiento por fecha - Duration vs Tasa (connectNulls activo para valores #N/A)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          {(() => {
                            const { dataByFecha, fechas, regressionCurves } = prepareHistoricoScatterData(
                              pesosHistorico.items,
                              pesosHistorico.headers,
                            )
                            const [yMin, yMax] = calculateYDomain(dataByFecha)
                            return (
                              <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                <XAxis
                                  type="number"
                                  dataKey="duration"
                                  name="Duration"
                                  stroke="#666"
                                  fontSize={12}
                                  domain={["auto", "auto"]}
                                  label={{ value: "Duration (años)", position: "bottom", offset: 5 }}
                                />
                                <YAxis
                                  type="number"
                                  dataKey="tasa"
                                  name="Tasa"
                                  stroke="#666"
                                  fontSize={12}
                                  domain={[yMin, yMax]}
                                  tickFormatter={(value) => `${value}%`}
                                  label={{ value: "Tasa (%)", angle: -90, position: "insideLeft" }}
                                />
                                <Tooltip
                                  cursor={{ strokeDasharray: "3 3" }}
                                  contentStyle={{
                                    backgroundColor: "white",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                  }}
                                  formatter={(value: number, name: string) => [`${value?.toFixed(2)}%`, name]}
                                  labelFormatter={(label) => `Duration: ${label} años`}
                                />
                                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                {fechas.map((fecha) => (
                                  <>
                                    <Scatter
                                      key={`scatter-${fecha.key}`}
                                      name={`${fecha.label} (Datos)`}
                                      data={dataByFecha[fecha.key]}
                                      fill={fecha.color}
                                    />
                                    {/* Curva de regresión logarítmica: y = a + b * ln(x) */}
                                    <Line
                                      key={`line-${fecha.key}`}
                                      type="monotone"
                                      data={regressionCurves[fecha.key]}
                                      dataKey="tasa"
                                      stroke={fecha.color}
                                      strokeWidth={2}
                                      dot={false}
                                      name={`${fecha.label} (Log)`}
                                      connectNulls={true}
                                    />
                                  </>
                                ))}
                              </ScatterChart>
                            )
                          })()}
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {tipo === "CER" && (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Grid3X3 className="h-5 w-5 text-emerald-600" />
                      <CardTitle className="text-xl">Matriz Forward CER</CardTitle>
                    </div>
                    <CardDescription>Matriz de tasas forward entre bonos CER</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingCerForward ? (
                      <div className="animate-pulse">
                        <div className="h-64 bg-gray-200 rounded"></div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-gray-100">
                              {cerForward.headers.map((header, index) => (
                                <th
                                  key={index}
                                  className="border border-gray-300 px-2 py-1 text-center font-semibold whitespace-nowrap"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {cerForward.rows.map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                <td className="border border-gray-300 px-2 py-1 font-medium bg-gray-50 whitespace-nowrap">
                                  {row.ticker}
                                </td>
                                {row.values.map((value, colIndex) => {
                                  const isLastColumn = colIndex === row.values.length - 1
                                  const colorClass = isLastColumn
                                    ? getDurationHeatmapColor(value)
                                    : getHeatmapColor(value, cerPercentiles)
                                  return (
                                    <td
                                      key={colIndex}
                                      className={`border border-gray-300 px-2 py-1 text-center whitespace-nowrap ${colorClass}`}
                                    >
                                      {value || "-"}
                                    </td>
                                  )
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <History className="h-5 w-5 text-emerald-600" />
                      <CardTitle className="text-xl">Evolución Histórica CER</CardTitle>
                    </div>
                    <CardDescription>Comparación de tasas históricas de bonos CER</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingHistorico ? (
                      <div className="animate-pulse">
                        <div className="h-64 bg-gray-200 rounded"></div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold whitespace-nowrap">
                                {cerHistorico.headers.col1}
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold whitespace-nowrap">
                                {cerHistorico.headers.col2}
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold whitespace-nowrap">
                                {cerHistorico.headers.col3}
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold whitespace-nowrap">
                                {cerHistorico.headers.col4}
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold whitespace-nowrap">
                                {cerHistorico.headers.col5}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {cerHistorico.items.map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-2">{item.duration}</td>
                                <td className="border border-gray-300 px-4 py-2 font-medium">{item.ticker}</td>
                                <td
                                  className={`border border-gray-300 px-4 py-2 ${
                                    item.fecha1.includes("#") ? "bg-red-50 text-red-700" : "bg-green-50"
                                  }`}
                                >
                                  {item.fecha1}
                                </td>
                                <td
                                  className={`border border-gray-300 px-4 py-2 ${
                                    item.fecha2.includes("#") ? "bg-red-50 text-red-700" : ""
                                  }`}
                                >
                                  {item.fecha2}
                                </td>
                                <td
                                  className={`border border-gray-300 px-4 py-2 ${
                                    item.fecha3.includes("#") ? "bg-red-50 text-red-700" : ""
                                  }`}
                                >
                                  {item.fecha3}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {!loadingHistorico && cerHistorico.items.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                        <CardTitle className="text-xl">Gráfico Evolución CER</CardTitle>
                      </div>
                      <CardDescription>
                        Curvas de rendimiento por fecha - Duration vs Tasa (connectNulls activo para valores #N/A)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          {(() => {
                            const { dataByFecha, fechas, regressionCurves } = prepareHistoricoScatterData(
                              cerHistorico.items,
                              cerHistorico.headers,
                            )
                            const [yMin, yMax] = calculateYDomain(dataByFecha)
                            return (
                              <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                <XAxis
                                  type="number"
                                  dataKey="duration"
                                  name="Duration"
                                  stroke="#666"
                                  fontSize={12}
                                  domain={["auto", "auto"]}
                                  label={{ value: "Duration (años)", position: "bottom", offset: 5 }}
                                />
                                <YAxis
                                  type="number"
                                  dataKey="tasa"
                                  name="Tasa"
                                  stroke="#666"
                                  fontSize={12}
                                  domain={[yMin, yMax]}
                                  tickFormatter={(value) => `${value}%`}
                                  label={{ value: "Tasa (%)", angle: -90, position: "insideLeft" }}
                                />
                                <Tooltip
                                  cursor={{ strokeDasharray: "3 3" }}
                                  contentStyle={{
                                    backgroundColor: "white",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                  }}
                                  formatter={(value: number, name: string) => [`${value?.toFixed(2)}%`, name]}
                                  labelFormatter={(label) => `Duration: ${label} años`}
                                />
                                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                {fechas.map((fecha) => (
                                  <>
                                    <Scatter
                                      key={`scatter-${fecha.key}`}
                                      name={`${fecha.label} (Datos)`}
                                      data={dataByFecha[fecha.key]}
                                      fill={fecha.color}
                                    />
                                    {/* Curva de regresión logarítmica: y = a + b * ln(x) */}
                                    <Line
                                      key={`line-${fecha.key}`}
                                      type="monotone"
                                      data={regressionCurves[fecha.key]}
                                      dataKey="tasa"
                                      stroke={fecha.color}
                                      strokeWidth={2}
                                      dot={false}
                                      name={`${fecha.label} (Log)`}
                                      connectNulls={true}
                                    />
                                  </>
                                ))}
                              </ScatterChart>
                            )
                          })()}
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {tipo === "TAMAR" && (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <History className="h-5 w-5 text-amber-600" />
                      <CardTitle className="text-xl">Evolución Histórica TAMAR</CardTitle>
                    </div>
                    <CardDescription>Comparación de tasas históricas de bonos TAMAR</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingTamarHistorico ? (
                      <div className="animate-pulse">
                        <div className="h-64 bg-gray-200 rounded"></div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold whitespace-nowrap">
                                {tamarHistorico.headers.col1}
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold whitespace-nowrap">
                                {tamarHistorico.headers.col2}
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold whitespace-nowrap">
                                {tamarHistorico.headers.col3}
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold whitespace-nowrap">
                                {tamarHistorico.headers.col4}
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold whitespace-nowrap">
                                {tamarHistorico.headers.col5}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {tamarHistorico.items.map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-2">{item.duration}</td>
                                <td className="border border-gray-300 px-4 py-2 font-medium">{item.ticker}</td>
                                <td
                                  className={`border border-gray-300 px-4 py-2 ${
                                    item.fecha1.includes("#") ? "bg-red-50 text-red-700" : "bg-amber-50"
                                  }`}
                                >
                                  {item.fecha1}
                                </td>
                                <td
                                  className={`border border-gray-300 px-4 py-2 ${
                                    item.fecha2.includes("#") ? "bg-red-50 text-red-700" : ""
                                  }`}
                                >
                                  {item.fecha2}
                                </td>
                                <td
                                  className={`border border-gray-300 px-4 py-2 ${
                                    item.fecha3.includes("#") ? "bg-red-50 text-red-700" : ""
                                  }`}
                                >
                                  {item.fecha3}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {!loadingTamarHistorico && tamarHistorico.items.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="h-5 w-5 text-amber-600" />
                        <CardTitle className="text-xl">Gráfico Evolución TAMAR</CardTitle>
                      </div>
                      <CardDescription>
                        Curvas de rendimiento por fecha - Duration vs Tasa (connectNulls activo para valores #N/A)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          {(() => {
                            const { dataByFecha, fechas, regressionCurves } = prepareHistoricoScatterData(
                              tamarHistorico.items,
                              tamarHistorico.headers,
                            )
                            const [yMin, yMax] = calculateYDomain(dataByFecha)
                            return (
                              <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                <XAxis
                                  type="number"
                                  dataKey="duration"
                                  name="Duration"
                                  stroke="#666"
                                  fontSize={12}
                                  domain={["auto", "auto"]}
                                  label={{ value: "Duration (años)", position: "bottom", offset: 5 }}
                                />
                                <YAxis
                                  type="number"
                                  dataKey="tasa"
                                  name="Tasa"
                                  stroke="#666"
                                  fontSize={12}
                                  domain={[yMin, yMax]}
                                  tickFormatter={(value) => `${value}%`}
                                  label={{ value: "Tasa (%)", angle: -90, position: "insideLeft" }}
                                />
                                <Tooltip
                                  cursor={{ strokeDasharray: "3 3" }}
                                  contentStyle={{
                                    backgroundColor: "white",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                  }}
                                  formatter={(value: number, name: string) => [`${value?.toFixed(2)}%`, name]}
                                  labelFormatter={(label) => `Duration: ${label} años`}
                                />
                                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                {fechas.map((fecha) => (
                                  <>
                                    <Scatter
                                      key={`scatter-${fecha.key}`}
                                      name={`${fecha.label} (Datos)`}
                                      data={dataByFecha[fecha.key]}
                                      fill={fecha.color}
                                    />
                                    {/* Curva de regresión logarítmica: y = a + b * ln(x) */}
                                    <Line
                                      key={`line-${fecha.key}`}
                                      type="monotone"
                                      data={regressionCurves[fecha.key]}
                                      dataKey="tasa"
                                      stroke={fecha.color}
                                      strokeWidth={2}
                                      dot={false}
                                      name={`${fecha.label} (Log)`}
                                      connectNulls={true}
                                    />
                                  </>
                                ))}
                              </ScatterChart>
                            )
                          })()}
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {tipo === "DOLAR_LINKED" && (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <History className="h-5 w-5 text-red-600" />
                      <CardTitle className="text-xl">Evolución Histórica DOLAR LINKED</CardTitle>
                    </div>
                    <CardDescription>Comparación de tasas históricas de bonos DOLAR LINKED</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingDolarLinkedHistorico ? (
                      <div className="animate-pulse">
                        <div className="h-64 bg-gray-200 rounded"></div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold whitespace-nowrap">
                                {dolarLinkedHistorico.headers.col1}
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold whitespace-nowrap">
                                {dolarLinkedHistorico.headers.col2}
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold whitespace-nowrap">
                                {dolarLinkedHistorico.headers.col3}
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold whitespace-nowrap">
                                {dolarLinkedHistorico.headers.col4}
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold whitespace-nowrap">
                                {dolarLinkedHistorico.headers.col5}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {dolarLinkedHistorico.items.map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-2">{item.duration}</td>
                                <td className="border border-gray-300 px-4 py-2 font-medium">{item.ticker}</td>
                                <td
                                  className={`border border-gray-300 px-4 py-2 ${
                                    item.fecha1.includes("#") ? "bg-red-50 text-red-700" : "bg-red-50"
                                  }`}
                                >
                                  {item.fecha1}
                                </td>
                                <td
                                  className={`border border-gray-300 px-4 py-2 ${
                                    item.fecha2.includes("#") ? "bg-red-50 text-red-700" : ""
                                  }`}
                                >
                                  {item.fecha2}
                                </td>
                                <td
                                  className={`border border-gray-300 px-4 py-2 ${
                                    item.fecha3.includes("#") ? "bg-red-50 text-red-700" : ""
                                  }`}
                                >
                                  {item.fecha3}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {!loadingDolarLinkedHistorico && dolarLinkedHistorico.items.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="h-5 w-5 text-red-600" />
                        <CardTitle className="text-xl">Gráfico Evolución DOLAR LINKED</CardTitle>
                      </div>
                      <CardDescription>
                        Curvas de rendimiento por fecha - Duration vs Tasa (connectNulls activo para valores #N/A)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          {(() => {
                            const { dataByFecha, fechas, regressionCurves } = prepareHistoricoScatterData(
                              dolarLinkedHistorico.items,
                              dolarLinkedHistorico.headers,
                            )
                            const [yMin, yMax] = calculateYDomain(dataByFecha)
                            return (
                              <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                <XAxis
                                  type="number"
                                  dataKey="duration"
                                  name="Duration"
                                  stroke="#666"
                                  fontSize={12}
                                  domain={["auto", "auto"]}
                                  label={{ value: "Duration (años)", position: "bottom", offset: 5 }}
                                />
                                <YAxis
                                  type="number"
                                  dataKey="tasa"
                                  name="Tasa"
                                  stroke="#666"
                                  fontSize={12}
                                  domain={[yMin, yMax]}
                                  tickFormatter={(value) => `${value}%`}
                                  label={{ value: "Tasa (%)", angle: -90, position: "insideLeft" }}
                                />
                                <Tooltip
                                  cursor={{ strokeDasharray: "3 3" }}
                                  contentStyle={{
                                    backgroundColor: "white",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                  }}
                                  formatter={(value: number, name: string) => [`${value?.toFixed(2)}%`, name]}
                                  labelFormatter={(label) => `Duration: ${label} años`}
                                />
                                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                {fechas.map((fecha) => (
                                  <>
                                    <Scatter
                                      key={`scatter-${fecha.key}`}
                                      name={`${fecha.label} (Datos)`}
                                      data={dataByFecha[fecha.key]}
                                      fill={fecha.color}
                                    />
                                    {/* Curva de regresión logarítmica: y = a + b * ln(x) */}
                                    <Line
                                      key={`line-${fecha.key}`}
                                      type="monotone"
                                      data={regressionCurves[fecha.key]}
                                      dataKey="tasa"
                                      stroke={fecha.color}
                                      strokeWidth={2}
                                      dot={false}
                                      name={`${fecha.label} (Log)`}
                                      connectNulls={true}
                                    />
                                  </>
                                ))}
                              </ScatterChart>
                            )
                          })()}
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        ))}

        {Object.keys(curvasFiltradas()).length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay datos disponibles</h3>
              <p className="text-muted-foreground text-center">
                No se encontraron curvas para los filtros seleccionados.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchAllData(true)}
            className="flex items-center space-x-2 bg-transparent"
          >
            <Activity className="h-4 w-4" />
            <span>Actualizar Datos</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
