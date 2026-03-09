"use client"

import { useState, useEffect, useRef } from "react"
import {
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Clock,
  AlertCircle,
  Percent,
  Eye,
  EyeOff,
  Calendar,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface CaucionData {
  plazo: string
  tna: string
}

interface StockData {
  ticker: string
  close: string
  last: string
  var: string
  varPercent: string
  positive: boolean
}

interface BondData {
  ticker: string
  price: string
  tir: string
  variation: string
  positive: boolean
  duration: string
}

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

interface A3Data {
  posicion: string
  maturity: string
  ttm: string
  price: string
  directa: string
  tem: string
  tea: string
  tna: string
}

export default function MarketDataPage() {
  const [cauciones, setCauciones] = useState<CaucionData[]>([])
  const [stocks, setStocks] = useState<StockData[]>([])
  const [bondsNY, setBondsNY] = useState<BondData[]>([])
  const [bondsARG, setBondsARG] = useState<BondData[]>([])
  const [indicesData, setIndicesData] = useState<{ spy: IndexData; ewz: IndexData; rofex: IndexData } | null>(null)
  const [a3Data, setA3Data] = useState<A3Data[]>([])

  // NUEVO: Estados de loading más granulares
  const [initialLoading, setInitialLoading] = useState(true) // Solo para la primera carga
  const [initialStocksLoading, setInitialStocksLoading] = useState(true)
  const [initialBondsLoading, setInitialBondsLoading] = useState(true)
  const [initialIndicesLoading, setInitialIndicesLoading] = useState(true)
  const [initialA3Loading, setInitialA3Loading] = useState(true)

  const [backgroundLoading, setBackgroundLoading] = useState(false)
  const [stocksBackgroundLoading, setStocksBackgroundLoading] = useState(false)
  const [bondsBackgroundLoading, setBondsBackgroundLoading] = useState(false)
  const [indicesBackgroundLoading, setIndicesBackgroundLoading] = useState(false)
  const [a3BackgroundLoading, setA3BackgroundLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [stocksError, setStocksError] = useState<string | null>(null)
  const [bondsError, setBondsError] = useState<string | null>(null)
  const [indicesError, setIndicesError] = useState<string | null>(null)
  const [a3Error, setA3Error] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>("")
  const [stocksLastUpdate, setStocksLastUpdate] = useState<string>("")
  const [bondsLastUpdate, setBondsLastUpdate] = useState<string>("")
  const [indicesLastUpdate, setIndicesLastUpdate] = useState<string>("")
  const [a3LastUpdate, setA3LastUpdate] = useState<string>("")
  const [isOnline, setIsOnline] = useState(true)
  const [nextUpdateIn, setNextUpdateIn] = useState(180) // 3 minutos
  const [isCached, setIsCached] = useState(false)
  const [isStocksCached, setIsStocksCached] = useState(false)
  const [isBondsCached, setIsBondsCached] = useState(false)
  const [isIndicesCached, setIsIndicesCached] = useState(false)
  const [isA3Cached, setIsA3Cached] = useState(false)
  const [isPageVisible, setIsPageVisible] = useState(true)

  // Estados para horarios de mercado
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null)
  const [stocksMarketStatus, setStocksMarketStatus] = useState<MarketStatus | null>(null)
  const [bondsMarketStatus, setBondsMarketStatus] = useState<MarketStatus | null>(null)
  const [indicesMarketStatus, setIndicesMarketStatus] = useState<MarketStatus | null>(null)
  const [a3MarketStatus, setA3MarketStatus] = useState<MarketStatus | null>(null)

  // NUEVO: Estados para datos de cierre del mercado
  const [isShowingMarketCloseData, setIsShowingMarketCloseData] = useState(false)
  const [isStocksShowingMarketCloseData, setIsStocksShowingMarketCloseData] = useState(false)
  const [isBondsShowingMarketCloseData, setIsBondsShowingMarketCloseData] = useState(false)
  const [isIndicesShowingMarketCloseData, setIsIndicesShowingMarketCloseData] = useState(false)
  const [isA3ShowingMarketCloseData, setIsA3ShowingMarketCloseData] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const stocksIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const bondsIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const indicesIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const a3IntervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  // Monitorear visibilidad de la página (AHORRO DE CRÉDITOS)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden)
      console.log(
        `📄 Página ${document.hidden ? "oculta" : "visible"} - ${document.hidden ? "pausando" : "reanudando"} actualizaciones`,
      )
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  // Monitorear conexión
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const fetchCauciones = async (isBackground = false) => {
    try {
      // NUEVO: Solo mostrar loading en la primera carga
      if (!isBackground && cauciones.length === 0) {
        setInitialLoading(true)
      } else if (isBackground) {
        setBackgroundLoading(true)
      }

      setError(null)

      const startTime = Date.now()

      const response = await fetch("/api/caucion", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      console.log(`⚡ Caución API Response time: ${responseTime}ms`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setCauciones(result.data || [])
        setLastUpdate(result.lastUpdate || "")
        setIsCached(result.cached || false)
        setMarketStatus(result.marketStatus || null)
        setIsShowingMarketCloseData(result.marketClosed && result.type?.includes("MARKET_CLOSE"))
        setError(null)

        console.log(
          `✅ Caución data loaded in ${responseTime}ms, cached: ${result.cached}, market open: ${result.marketStatus?.isOpen}, showing close data: ${result.marketClosed && result.type?.includes("MARKET_CLOSE")}`,
        )
      } else {
        throw new Error(result.error || "Error desconocido")
      }
    } catch (err) {
      console.error("Error fetching cauciones:", err)
      setError("Error al cargar datos de Caución")
    } finally {
      if (!isBackground && cauciones.length === 0) {
        setInitialLoading(false)
      } else if (isBackground) {
        setBackgroundLoading(false)
      }
    }
  }

  const fetchStocks = async (isBackground = false) => {
    try {
      // NUEVO: Solo mostrar loading en la primera carga
      if (!isBackground && stocks.length === 0) {
        setInitialStocksLoading(true)
      } else if (isBackground) {
        setStocksBackgroundLoading(true)
      }

      setStocksError(null)

      const startTime = Date.now()

      const response = await fetch("/api/stocks", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      console.log(`⚡ Stocks API Response time: ${responseTime}ms`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setStocks(result.data || [])
        setStocksLastUpdate(result.lastUpdate || "")
        setIsStocksCached(result.cached || false)
        setStocksMarketStatus(result.marketStatus || null)
        setIsStocksShowingMarketCloseData(result.marketClosed && result.type?.includes("MARKET_CLOSE"))
        setStocksError(null)

        console.log(
          `✅ Stocks data loaded in ${responseTime}ms, cached: ${result.cached}, market open: ${result.marketStatus?.isOpen}, showing close data: ${result.marketClosed && result.type?.includes("MARKET_CLOSE")}`,
        )
      } else {
        throw new Error(result.error || "Error desconocido")
      }
    } catch (err) {
      console.error("Error fetching stocks:", err)
      setStocksError("Error al cargar datos de Acciones")
    } finally {
      if (!isBackground && stocks.length === 0) {
        setInitialStocksLoading(false)
      } else if (isBackground) {
        setStocksBackgroundLoading(false)
      }
    }
  }

  const fetchBonds = async (isBackground = false) => {
    try {
      // NUEVO: Solo mostrar loading en la primera carga
      if (!isBackground && bondsNY.length === 0 && bondsARG.length === 0) {
        setInitialBondsLoading(true)
      } else if (isBackground) {
        setBondsBackgroundLoading(true)
      }

      setBondsError(null)

      const startTime = Date.now()

      const response = await fetch("/api/bonds", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      console.log(`⚡ Bonds API Response time: ${responseTime}ms`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setBondsNY(result.data?.hardDollarNY || [])
        setBondsARG(result.data?.hardDollarARG || [])
        setBondsLastUpdate(result.lastUpdate || "")
        setIsBondsCached(result.cached || false)
        setBondsMarketStatus(result.marketStatus || null)
        setIsBondsShowingMarketCloseData(result.marketClosed && result.type?.includes("MARKET_CLOSE"))
        setBondsError(null)

        console.log(
          `✅ Bonds data loaded in ${responseTime}ms, cached: ${result.cached}, market open: ${result.marketStatus?.isOpen}, showing close data: ${result.marketClosed && result.type?.includes("MARKET_CLOSE")}`,
        )
      } else {
        throw new Error(result.error || "Error desconocido")
      }
    } catch (err) {
      console.error("Error fetching bonds:", err)
      setBondsError("Error al cargar datos de Bonos")
    } finally {
      if (!isBackground && bondsNY.length === 0 && bondsARG.length === 0) {
        setInitialBondsLoading(false)
      } else if (isBackground) {
        setBondsBackgroundLoading(false)
      }
    }
  }

  const fetchIndices = async (isBackground = false) => {
    try {
      if (!isBackground && !indicesData) {
        setInitialIndicesLoading(true)
      } else if (isBackground) {
        setIndicesBackgroundLoading(true)
      }

      setIndicesError(null)

      const startTime = Date.now()

      const response = await fetch("/api/indices", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      console.log(`⚡ Indices API Response time: ${responseTime}ms`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setIndicesData(result.data || null)
        setIndicesLastUpdate(result.lastUpdate || "")
        setIsIndicesCached(result.cached || false)
        setIndicesMarketStatus(result.marketStatus || null)
        setIsIndicesShowingMarketCloseData(result.marketClosed && result.type?.includes("MARKET_CLOSE"))
        setIndicesError(null)

        console.log(
          `✅ Indices data loaded in ${responseTime}ms, cached: ${result.cached}, market open: ${result.marketStatus?.isOpen}, showing close data: ${result.marketClosed && result.type?.includes("MARKET_CLOSE")}`,
        )
      } else {
        throw new Error(result.error || "Error desconocido")
      }
    } catch (err) {
      console.error("Error fetching indices:", err)
      setIndicesError("Error al cargar datos de Índices")
    } finally {
      if (!isBackground && !indicesData) {
        setInitialIndicesLoading(false)
      } else if (isBackground) {
        setIndicesBackgroundLoading(false)
      }
    }
  }

  const fetchA3 = async (isBackground = false) => {
    try {
      if (!isBackground && a3Data.length === 0) {
        setInitialA3Loading(true)
      } else if (isBackground) {
        setA3BackgroundLoading(true)
      }

      setA3Error(null)

      const startTime = Date.now()

      const response = await fetch("/api/a3", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      console.log(`⚡ A3 API Response time: ${responseTime}ms`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setA3Data(result.data || [])
        setA3LastUpdate(result.lastUpdate || "")
        setIsA3Cached(result.cached || false)
        setA3MarketStatus(result.marketStatus || null)
        setIsA3ShowingMarketCloseData(result.marketClosed && result.type?.includes("MARKET_CLOSE"))
        setA3Error(null)

        console.log(
          `✅ A3 data loaded in ${responseTime}ms, cached: ${result.cached}, market open: ${result.marketStatus?.isOpen}, showing close data: ${result.marketClosed && result.type?.includes("MARKET_CLOSE")}`,
        )
      } else {
        throw new Error(result.error || "Error desconocido")
      }
    } catch (err) {
      console.error("Error fetching A3:", err)
      setA3Error("Error al cargar datos de A3")
    } finally {
      if (!isBackground && a3Data.length === 0) {
        setInitialA3Loading(false)
      } else if (isBackground) {
        setA3BackgroundLoading(false)
      }
    }
  }

  // Countdown para próxima actualización (3 minutos)
  const startCountdown = () => {
    setNextUpdateIn(180) // 3 minutos

    if (countdownRef.current) {
      clearInterval(countdownRef.current)
    }

    countdownRef.current = setInterval(() => {
      setNextUpdateIn((prev) => {
        if (prev <= 1) {
          return 180 // 3 minutos
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    // Carga inicial
    fetchCauciones()
    fetchStocks()
    fetchBonds()
    fetchIndices()
    fetchA3()

    // Auto-refresh cada 3 minutos SOLO si la página está visible (AHORRO DE CRÉDITOS)
    intervalRef.current = setInterval(() => {
      if (isOnline && isPageVisible) {
        console.log("🔄 Auto-refresh activado (página visible)")
        fetchCauciones(true) // SIEMPRE en background después de la primera carga
      } else if (!isPageVisible) {
        console.log("⏸️ Auto-refresh pausado (página oculta - AHORRO DE CRÉDITOS)")
      }
    }, 180000) // 3 minutos

    stocksIntervalRef.current = setInterval(() => {
      if (isOnline && isPageVisible) {
        fetchStocks(true) // SIEMPRE en background después de la primera carga
      }
    }, 180000) // 3 minutos

    bondsIntervalRef.current = setInterval(() => {
      if (isOnline && isPageVisible) {
        fetchBonds(true) // SIEMPRE en background después de la primera carga
      }
    }, 180000) // 3 minutos

    indicesIntervalRef.current = setInterval(() => {
      if (isOnline && isPageVisible) {
        fetchIndices(true) // SIEMPRE en background después de la primera carga
      }
    }, 180000) // 3 minutos

    a3IntervalRef.current = setInterval(() => {
      if (isOnline && isPageVisible) {
        fetchA3(true)
      }
    }, 180000) // 3 minutos

    // Iniciar countdown
    startCountdown()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (stocksIntervalRef.current) {
        clearInterval(stocksIntervalRef.current)
      }
      if (bondsIntervalRef.current) {
        clearInterval(bondsIntervalRef.current)
      }
      if (indicesIntervalRef.current) {
        clearInterval(indicesIntervalRef.current)
      }
      if (a3IntervalRef.current) {
        clearInterval(a3IntervalRef.current)
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
      }
    }
  }, [isOnline, isPageVisible])

  // Manual refresh - SIEMPRE en background si ya hay datos
  const handleManualRefresh = () => {
    const hasData =
      cauciones.length > 0 ||
      stocks.length > 0 ||
      bondsNY.length > 0 ||
      bondsARG.length > 0 ||
      indicesData ||
      a3Data.length > 0

    fetchCauciones(hasData)
    fetchStocks(hasData)
    fetchBonds(hasData)
    fetchIndices(hasData)
    fetchA3(hasData)
    startCountdown()
  }

  // Formatear tiempo de countdown
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Función para determinar el estado general del mercado
  const getOverallMarketStatus = () => {
    const statuses = [marketStatus, stocksMarketStatus, bondsMarketStatus, indicesMarketStatus, a3MarketStatus].filter(
      Boolean,
    )
    if (statuses.length === 0) return null

    // Si al menos uno está abierto, consideramos que hay actividad
    const isAnyOpen = statuses.some((status) => status?.isOpen)
    const allClosed = statuses.every((status) => !status?.isOpen)

    // NUEVO: Verificar si estamos mostrando datos de cierre
    const isShowingAnyCloseData =
      isShowingMarketCloseData ||
      isStocksShowingMarketCloseData ||
      isBondsShowingMarketCloseData ||
      isIndicesShowingMarketCloseData ||
      isA3ShowingMarketCloseData

    if (isAnyOpen) {
      return {
        isOpen: true,
        status: "Mercado Abierto",
        color: "bg-green-500",
        textColor: "text-green-800",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      }
    } else if (allClosed) {
      return {
        isOpen: false,
        status: isShowingAnyCloseData ? "Datos de Cierre del Mercado" : "Mercado Cerrado",
        color: isShowingAnyCloseData ? "bg-blue-500" : "bg-red-500",
        textColor: isShowingAnyCloseData ? "text-blue-800" : "text-red-800",
        bgColor: isShowingAnyCloseData ? "bg-blue-50" : "bg-red-50",
        borderColor: isShowingAnyCloseData ? "border-blue-200" : "border-red-200",
      }
    }

    return {
      isOpen: false,
      status: "Estado Desconocido",
      color: "bg-gray-500",
      textColor: "text-gray-800",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
    }
  }

  const overallMarketStatus = getOverallMarketStatus()

  // Crear array de índices dinámico con datos reales de SPY, EWZ y ROFEX 20
  const indices = [
    {
      name: "MERVAL",
      value: "1,245,678",
      change: "+2.34%",
      changeValue: "+28,456",
      positive: true,
      indexBadge: "INDEX", // Changed from volume: "$ 2.8B"
      high: "1,250,123",
      low: "1,220,456",
    },
    // SPY con datos reales
    indicesData?.spy
      ? {
          name: indicesData.spy.name,
          value: indicesData.spy.price,
          change: indicesData.spy.variation,
          changeValue: indicesData.spy.positive
            ? `+${indicesData.spy.price.split(",").join("").split(".")[0] || "0"}`
            : `-${indicesData.spy.price.split(",").join("").split(".")[0] || "0"}`,
          positive: indicesData.spy.positive,
          high: indicesData.spy.high || "--",
          low: indicesData.spy.low || "--",
          indexBadge: "ETF", // Add this line
        }
      : {
          name: "SPY",
          value: initialIndicesLoading ? "Cargando..." : indicesError ? "Error" : "N/A",
          change: "0.00%",
          changeValue: "+0.00",
          positive: true,
          high: "--",
          low: "--",
          indexBadge: "ETF", // Add this line
        },
    // EWZ con datos reales
    indicesData?.ewz
      ? {
          name: indicesData.ewz.name,
          value: indicesData.ewz.price,
          change: indicesData.ewz.variation,
          changeValue: indicesData.ewz.positive
            ? `+${indicesData.ewz.price.split(",").join("").split(".")[0] || "0"}`
            : `-${indicesData.ewz.price.split(",").join("").split(".")[0] || "0"}`,
          positive: indicesData.ewz.positive,
          high: indicesData.ewz.high || "--",
          low: indicesData.ewz.low || "--",
          indexBadge: "ETF", // Add this line
        }
      : {
          name: "EWZ",
          value: initialIndicesLoading ? "Cargando..." : indicesError ? "Error" : "N/A",
          change: "0.00%",
          changeValue: "+0.00",
          positive: true,
          high: "--",
          low: "--",
          indexBadge: "ETF", // Add this line
        },
    // ROFEX 20 con datos reales incluyendo máximos y mínimos
    indicesData?.rofex
      ? {
          name: indicesData.rofex.name,
          value: indicesData.rofex.price,
          change: indicesData.rofex.variation, // "N/A"
          changeValue: "N/A",
          positive: true, // Neutral
          high: indicesData.rofex.high || "--",
          low: indicesData.rofex.low || "--",
          indexBadge: "INDEX", // Add this line
        }
      : {
          name: "ROFEX 20",
          value: initialIndicesLoading ? "Cargando..." : indicesError ? "Error" : "N/A",
          change: "N/A",
          changeValue: "N/A",
          positive: true,
          high: "--",
          low: "--",
          indexBadge: "INDEX", // Add this line
        },
  ].filter(Boolean) // Filtrar elementos null/undefined

  const a3DataSimulated = [
    {
      posicion: "AL30",
      maturity: "2030-07-09",
      ttm: "5.2",
      price: "45.25",
      directa: "12.5%",
      tem: "0.98%",
      tea: "12.45%",
      tna: "11.80%",
    },
    {
      posicion: "GD30",
      maturity: "2030-07-09",
      ttm: "5.2",
      price: "46.10",
      directa: "12.1%",
      tem: "0.95%",
      tea: "12.05%",
      tna: "11.45%",
    },
    {
      posicion: "AE38",
      maturity: "2038-01-09",
      ttm: "13.1",
      price: "38.75",
      directa: "13.8%",
      tem: "1.08%",
      tea: "13.65%",
      tna: "12.95%",
    },
    {
      posicion: "AL35",
      maturity: "2035-07-09",
      ttm: "10.2",
      price: "42.90",
      directa: "13.2%",
      tem: "1.02%",
      tea: "13.15%",
      tna: "12.50%",
    },
  ]

  const marketNews = [
    {
      title: "BCRA mantiene tasa de interés en 40%",
      time: "Hace 2 horas",
      impact: "Alto",
      type: "monetary",
    },
    {
      title: "YPF anuncia inversión en Vaca Muerta",
      time: "Hace 4 horas",
      impact: "Medio",
      type: "corporate",
    },
    {
      title: "Inflación de octubre: 2.7%",
      time: "Hace 6 horas",
      impact: "Alto",
      type: "economic",
    },
  ]

  // Datos simulados para el gráfico de caución
  const caucionChartData = cauciones.map((caucion, index) => ({
    plazo: caucion.plazo,
    tna: Number.parseFloat(caucion.tna.replace("%", "")) || 0,
    index: index + 1,
  }))

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Market Data</h1>
              <p className="text-slate-600">Cotizaciones con control de horarios de mercado (11:00-17:00 hs)</p>
              <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    Última actualización:{" "}
                    {lastUpdate ||
                      stocksLastUpdate ||
                      bondsLastUpdate ||
                      indicesLastUpdate ||
                      a3LastUpdate ||
                      new Date().toLocaleString("es-AR")}
                  </span>
                </div>
                {overallMarketStatus?.isOpen && <span>Próxima en: {formatCountdown(nextUpdateIn)}</span>}
                <div className="flex items-center gap-1">
                  {isPageVisible ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                  <span className={isPageVisible ? "text-green-600" : "text-gray-400"}>
                    {isPageVisible ? "Activo" : "Pausado"}
                  </span>
                </div>
                {(isCached || isStocksCached || isBondsCached || isIndicesCached || isA3Cached) && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                    Cache 3min
                  </Badge>
                )}
                {(backgroundLoading ||
                  stocksBackgroundLoading ||
                  bondsBackgroundLoading ||
                  indicesBackgroundLoading ||
                  a3BackgroundLoading) && (
                  <div className="flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Actualizando...</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
                onClick={handleManualRefresh}
                disabled={
                  initialLoading ||
                  backgroundLoading ||
                  initialStocksLoading ||
                  stocksBackgroundLoading ||
                  initialBondsLoading ||
                  bondsBackgroundLoading ||
                  initialIndicesLoading ||
                  indicesBackgroundLoading ||
                  initialA3Loading ||
                  a3BackgroundLoading
                }
              >
                <RefreshCw
                  className={`h-4 w-4 ${initialLoading || backgroundLoading || initialStocksLoading || stocksBackgroundLoading || initialBondsLoading || bondsBackgroundLoading || initialIndicesLoading || indicesBackgroundLoading || initialA3Loading || a3BackgroundLoading ? "animate-spin" : ""}`}
                />
                Actualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Market Status con información de horarios */}
        <div className="mb-8">
          <Card
            className={`${overallMarketStatus?.bgColor || "bg-gray-50"} ${overallMarketStatus?.borderColor || "border-gray-200"}`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 ${overallMarketStatus?.color || "bg-gray-500"} rounded-full ${overallMarketStatus?.isOpen ? "animate-pulse" : ""}`}
                  ></div>
                  <span className={`font-medium ${overallMarketStatus?.textColor || "text-gray-800"}`}>
                    {overallMarketStatus?.status || "Cargando estado..."}
                  </span>
                  {marketStatus && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>{marketStatus.currentTime}</span>
                    </div>
                  )}
                </div>
                <div className="text-sm text-slate-700 flex items-center gap-4">
                  <span>Horario: 11:00-17:00 hs (Lun-Vie)</span>
                  {marketStatus?.nextOpenTime && <span>Próxima apertura: {marketStatus.nextOpenTime}</span>}
                  <span>Cache: 3min | Auto-refresh: {isPageVisible ? "Activo" : "Pausado"}</span>
                </div>
              </div>
              {/* Mostrar razón del estado si el mercado está cerrado */}
              {!overallMarketStatus?.isOpen && marketStatus && (
                <div className="mt-2 text-sm text-slate-600">
                  <span>{marketStatus.reason}</span>
                  {/* NUEVO: Información adicional para datos de cierre */}
                  {(isShowingMarketCloseData ||
                    isStocksShowingMarketCloseData ||
                    isBondsShowingMarketCloseData ||
                    isIndicesShowingMarketCloseData ||
                    isA3ShowingMarketCloseData) && (
                    <span className="ml-2 text-blue-600">• Se muestran datos del último cierre del mercado</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Indices */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Índices Principales</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {indices.map((index, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    {index.name}
                    {index.indexBadge && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          index.indexBadge === "INDEX"
                            ? "bg-purple-100 text-purple-800 border-purple-200"
                            : "bg-orange-100 text-orange-800 border-orange-200"
                        }`}
                      >
                        {index.indexBadge}
                      </Badge>
                    )}
                    {index.volume && (
                      <Badge variant="outline" className="text-xs">
                        {index.volume}
                      </Badge>
                    )}
                    {/* Badge especial para SPY, EWZ y ROFEX 20 si está cargando o tiene error */}
                    {(index.name === "SPY" || index.name === "EWZ" || index.name === "ROFEX 20") &&
                      initialIndicesLoading && (
                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Cargando
                        </Badge>
                      )}
                    {(index.name === "SPY" || index.name === "EWZ" || index.name === "ROFEX 20") && indicesError && (
                      <Badge variant="outline" className="text-xs bg-red-100 text-red-800">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Error
                      </Badge>
                    )}
                    {(index.name === "SPY" || index.name === "EWZ" || index.name === "ROFEX 20") &&
                      isIndicesCached &&
                      !initialIndicesLoading &&
                      !indicesError && (
                        <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                          Cache 3min
                        </Badge>
                      )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{index.value}</div>
                  <div
                    className={`flex items-center gap-1 text-sm font-medium mb-3 ${
                      index.name === "ROFEX 20"
                        ? "text-gray-600" // Color neutral para ROFEX 20 ya que no tiene variación
                        : index.positive
                          ? "text-green-600"
                          : "text-red-600"
                    }`}
                  >
                    {index.name === "ROFEX 20" ? (
                      <Activity className="h-4 w-4" />
                    ) : index.positive ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {index.change} {index.changeValue !== "N/A" && `(${index.changeValue})`}
                  </div>
                  {/* Mostrar máximos y mínimos para todos los índices que los tengan */}
                  {index.high && index.low && (
                    <div className="text-xs text-slate-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Máximo:</span>
                        <span>{index.high}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mínimo:</span>
                        <span>{index.low}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* A3 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">A3</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Análisis A3
                {isA3Cached && (
                  <Badge variant="outline" className="text-xs ml-2 bg-green-100 text-green-800">
                    Cache 3min
                  </Badge>
                )}
                {isA3ShowingMarketCloseData && (
                  <Badge variant="outline" className="text-xs ml-2 bg-blue-100 text-blue-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Datos de Cierre
                  </Badge>
                )}
                {a3MarketStatus && !a3MarketStatus.isOpen && !isA3ShowingMarketCloseData && (
                  <Badge variant="outline" className="text-xs ml-2 bg-red-100 text-red-800">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Mercado Cerrado
                  </Badge>
                )}
                {a3BackgroundLoading && <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />}
              </CardTitle>
              <CardDescription>
                {initialA3Loading
                  ? "Cargando análisis A3..."
                  : a3Error
                    ? "Error al cargar"
                    : isA3ShowingMarketCloseData
                      ? `${a3Data.length} posiciones (datos del cierre del mercado)`
                      : a3MarketStatus && !a3MarketStatus.isOpen
                        ? `${a3Data.length} posiciones (datos anteriores)`
                        : `${a3Data.length} posiciones disponibles`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {initialA3Loading && a3Data.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : a3Error && a3Data.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>{a3Error}</p>
                </div>
              ) : a3Data.length === 0 && a3MarketStatus && !a3MarketStatus.isOpen ? (
                <div className="text-center py-8 text-slate-500">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p>Mercado cerrado</p>
                  <p className="text-sm mt-1">{a3MarketStatus.reason}</p>
                  {a3MarketStatus.nextOpenTime && (
                    <p className="text-sm mt-1">Próxima apertura: {a3MarketStatus.nextOpenTime}</p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Posición</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-600">Maturity</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-600">TTM</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-600">Price</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-600">Directa</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-600">TEM</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-600">TEA</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-600">TNA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {a3Data.map((item, i) => (
                        <tr key={i} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium">{item.posicion}</td>
                          <td className="py-3 px-4 text-center text-slate-600">{item.maturity}</td>
                          <td className="py-3 px-4 text-center text-slate-600">{item.ttm}</td>
                          <td className="py-3 px-4 text-right font-medium">{item.price}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{item.directa}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{item.tem}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{item.tea}</td>
                          <td className="py-3 px-4 text-right font-medium text-slate-900">{item.tna}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Market News */}
        {/*
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">A3</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {marketNews.map((news, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={news.impact === "Alto" ? "destructive" : "secondary"} className="text-xs">
                      {news.impact}
                    </Badge>
                    <span className="text-xs text-slate-500">{news.time}</span>
                  </div>
                  <h3 className="font-medium text-sm text-slate-900 leading-tight">{news.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        */}

        {/* Panel General (izquierda) + Bonos (derecha) */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Panel General - Lado Izquierdo */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Acciones Destacadas</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Panel General
                  {isStocksCached && (
                    <Badge variant="outline" className="text-xs ml-2 bg-green-100 text-green-800">
                      Cache 3min
                    </Badge>
                  )}
                  {/* NUEVO: Badge para datos de cierre */}
                  {isStocksShowingMarketCloseData && (
                    <Badge variant="outline" className="text-xs ml-2 bg-blue-100 text-blue-800">
                      <Clock className="h-3 w-3 mr-1" />
                      Datos de Cierre
                    </Badge>
                  )}
                  {stocksMarketStatus && !stocksMarketStatus.isOpen && !isStocksShowingMarketCloseData && (
                    <Badge variant="outline" className="text-xs ml-2 bg-red-100 text-red-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Mercado Cerrado
                    </Badge>
                  )}
                  {stocksBackgroundLoading && <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />}
                </CardTitle>
                <CardDescription>
                  {initialStocksLoading
                    ? "Cargando acciones..."
                    : stocksError
                      ? "Error al cargar"
                      : isStocksShowingMarketCloseData
                        ? `${stocks.length} acciones (datos del cierre del mercado)`
                        : stocksMarketStatus && !stocksMarketStatus.isOpen
                          ? `${stocks.length} acciones (datos anteriores)`
                          : `${stocks.length} acciones disponibles`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* NUEVO: Solo mostrar loading si es la primera carga Y no hay datos */}
                {initialStocksLoading && stocks.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : stocksError && stocks.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>{stocksError}</p>
                  </div>
                ) : stocks.length === 0 && stocksMarketStatus && !stocksMarketStatus.isOpen ? (
                  <div className="text-center py-8 text-slate-500">
                    <Clock className="h-8 w-8 mx-auto mb-2" />
                    <p>Mercado cerrado</p>
                    <p className="text-sm mt-1">{stocksMarketStatus.reason}</p>
                    {stocksMarketStatus.nextOpenTime && (
                      <p className="text-sm mt-1">Próxima apertura: {stocksMarketStatus.nextOpenTime}</p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Ticker</th>
                          <th className="text-right py-3 px-4 font-medium text-slate-600">Close</th>
                          <th className="text-right py-3 px-4 font-medium text-slate-600">Last</th>
                          <th className="text-right py-3 px-4 font-medium text-slate-600">Var</th>
                          <th className="text-right py-3 px-4 font-medium text-slate-600">Var %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stocks.map((stock, i) => (
                          <tr key={i} className="border-b hover:bg-slate-50">
                            <td className="py-3 px-4 font-medium">{stock.ticker}</td>
                            <td className="py-3 px-4 text-right font-medium">${stock.close}</td>
                            <td className="py-3 px-4 text-right text-slate-600">${stock.last}</td>
                            <td className="py-3 px-4 text-right text-slate-600">{stock.var}</td>
                            <td
                              className={`py-3 px-4 text-right font-medium ${
                                stock.positive ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {stock.varPercent}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Bonos - Lado Derecho */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Bonos</h2>
            <div className="space-y-6">
              {/* Hard Dollar Ley NY */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Hard Dollar (Ley NY)
                    {isBondsCached && (
                      <Badge variant="outline" className="text-xs ml-2 bg-green-100 text-green-800">
                        Cache 3min
                      </Badge>
                    )}
                    {/* NUEVO: Badge para datos de cierre */}
                    {isBondsShowingMarketCloseData && (
                      <Badge variant="outline" className="text-xs ml-2 bg-blue-100 text-blue-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Datos de Cierre
                      </Badge>
                    )}
                    {bondsMarketStatus && !bondsMarketStatus.isOpen && !isBondsShowingMarketCloseData && (
                      <Badge variant="outline" className="text-xs ml-2 bg-red-100 text-red-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Mercado Cerrado
                      </Badge>
                    )}
                    {bondsBackgroundLoading && <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />}
                  </CardTitle>
                  <CardDescription>
                    {initialBondsLoading
                      ? "Cargando bonos..."
                      : bondsError
                        ? "Error al cargar"
                        : isBondsShowingMarketCloseData
                          ? `${bondsNY.length} bonos (datos del cierre del mercado)`
                          : bondsMarketStatus && !bondsMarketStatus.isOpen
                            ? `${bondsNY.length} bonos (datos anteriores)`
                            : `${bondsNY.length} bonos disponibles`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* NUEVO: Solo mostrar loading si es la primera carga Y no hay datos */}
                  {initialBondsLoading && bondsNY.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  ) : bondsError && bondsNY.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>{bondsError}</p>
                    </div>
                  ) : bondsNY.length === 0 && bondsMarketStatus && !bondsMarketStatus.isOpen ? (
                    <div className="text-center py-8 text-slate-500">
                      <Clock className="h-8 w-8 mx-auto mb-2" />
                      <p>Mercado cerrado</p>
                      <p className="text-sm mt-1">{bondsMarketStatus.reason}</p>
                      {bondsMarketStatus.nextOpenTime && (
                        <p className="text-sm mt-1">Próxima apertura: {bondsMarketStatus.nextOpenTime}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bondsNY.map((bond, i) => (
                        <div key={i} className="flex justify-between items-center py-3 border-b last:border-b-0">
                          <div>
                            <div className="font-medium">{bond.ticker}</div>
                            <div className="text-sm text-slate-600">TIR: {bond.tir}</div>
                            <div className="text-sm text-slate-600">Duration: {bond.duration}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">${bond.price}</div>
                            <div className={`text-sm ${bond.positive ? "text-green-600" : "text-red-600"}`}>
                              {bond.variation}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Hard Dollar Ley ARG */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Hard Dollar (Ley ARG)
                    {isBondsCached && (
                      <Badge variant="outline" className="text-xs ml-2 bg-green-100 text-green-800">
                        Cache 3min
                      </Badge>
                    )}
                    {/* NUEVO: Badge para datos de cierre */}
                    {isBondsShowingMarketCloseData && (
                      <Badge variant="outline" className="text-xs ml-2 bg-blue-100 text-blue-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Datos de Cierre
                      </Badge>
                    )}
                    {bondsMarketStatus && !bondsMarketStatus.isOpen && !isBondsShowingMarketCloseData && (
                      <Badge variant="outline" className="text-xs ml-2 bg-red-100 text-red-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Mercado Cerrado
                      </Badge>
                    )}
                    {bondsBackgroundLoading && <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />}
                  </CardTitle>
                  <CardDescription>
                    {initialBondsLoading
                      ? "Cargando bonos..."
                      : bondsError
                        ? "Error al cargar"
                        : isBondsShowingMarketCloseData
                          ? `${bondsARG.length} bonos (datos del cierre del mercado)`
                          : bondsMarketStatus && !bondsMarketStatus.isOpen
                            ? `${bondsARG.length} bonos (datos anteriores)`
                            : `${bondsARG.length} bonos disponibles`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* NUEVO: Solo mostrar loading si es la primera carga Y no hay datos */}
                  {initialBondsLoading && bondsARG.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  ) : bondsError && bondsARG.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>{bondsError}</p>
                    </div>
                  ) : bondsARG.length === 0 && bondsMarketStatus && !bondsMarketStatus.isOpen ? (
                    <div className="text-center py-8 text-slate-500">
                      <Clock className="h-8 w-8 mx-auto mb-2" />
                      <p>Mercado cerrado</p>
                      <p className="text-sm mt-1">{bondsMarketStatus.reason}</p>
                      {bondsMarketStatus.nextOpenTime && (
                        <p className="text-sm mt-1">Próxima apertura: {bondsMarketStatus.nextOpenTime}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bondsARG.map((bond, i) => (
                        <div key={i} className="flex justify-between items-center py-3 border-b last:border-b-0">
                          <div>
                            <div className="font-medium">{bond.ticker}</div>
                            <div className="text-sm text-slate-600">TIR: {bond.tir}</div>
                            <div className="text-sm text-slate-600">Duration: {bond.duration}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">${bond.price}</div>
                            <div className={`text-sm ${bond.positive ? "text-green-600" : "text-red-600"}`}>
                              {bond.variation}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        </div>

        {/* Caución con layout de dos columnas: datos a la izquierda, gráfico a la derecha */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Caución</h2>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Datos de Caución - Lado Izquierdo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Tasas de Caución
                  {isCached && (
                    <Badge variant="outline" className="text-xs ml-2 bg-green-100 text-green-800">
                      Cache 3min
                    </Badge>
                  )}
                  {isShowingMarketCloseData && (
                    <Badge variant="outline" className="text-xs ml-2 bg-blue-100 text-blue-800">
                      <Clock className="h-3 w-3 mr-1" />
                      Datos de Cierre
                    </Badge>
                  )}
                  {marketStatus && !marketStatus.isOpen && !isShowingMarketCloseData && (
                    <Badge variant="outline" className="text-xs ml-2 bg-red-100 text-red-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Mercado Cerrado
                    </Badge>
                  )}
                  {backgroundLoading && <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />}
                </CardTitle>
                <CardDescription>
                  {initialLoading
                    ? "Cargando tasas..."
                    : error
                      ? "Error al cargar"
                      : isShowingMarketCloseData
                        ? `${cauciones.length} plazos (datos del cierre del mercado)`
                        : marketStatus && !marketStatus.isOpen
                          ? `${cauciones.length} plazos (datos anteriores)`
                          : `${cauciones.length} plazos disponibles`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {initialLoading && cauciones.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : error && cauciones.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>{error}</p>
                  </div>
                ) : cauciones.length === 0 && marketStatus && !marketStatus.isOpen ? (
                  <div className="text-center py-8 text-slate-500">
                    <Clock className="h-8 w-8 mx-auto mb-2" />
                    <p>Mercado cerrado</p>
                    <p className="text-sm mt-1">{marketStatus.reason}</p>
                    {marketStatus.nextOpenTime && (
                      <p className="text-sm mt-1">Próxima apertura: {marketStatus.nextOpenTime}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cauciones.map((caucion, i) => (
                      <div key={i} className="flex justify-between items-center py-3 border-b last:border-b-0">
                        <div className="font-medium text-slate-900">{caucion.plazo}</div>
                        <div className="text-xl font-bold text-slate-900">{caucion.tna}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfico de Caución - Lado Derecho */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Evolución de Tasas
                </CardTitle>
                <CardDescription>Visualización de las tasas por plazo</CardDescription>
              </CardHeader>
              <CardContent>
                {cauciones.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={caucionChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="plazo" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          label={{ value: "TNA (%)", angle: -90, position: "insideLeft" }}
                        />
                        <Tooltip
                          formatter={(value: any) => [`${value}%`, "TNA"]}
                          labelFormatter={(label) => `Plazo: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="tna"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-slate-500">
                    <div className="text-center">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No hay datos para mostrar</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
