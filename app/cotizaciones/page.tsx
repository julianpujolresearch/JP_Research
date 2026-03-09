"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  Clock,
  AlertTriangle,
} from "lucide-react"

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

export default function CotizacionesPage() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<CotizacionData[]>([])
  const [loading, setLoading] = useState(true)
  const [backgroundLoading, setBackgroundLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>("")
  const [sectorFilter, setSectorFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [isOnline, setIsOnline] = useState(true)
  const [nextUpdateIn, setNextUpdateIn] = useState(180) // OPTIMIZADO: 3 minutos
  const [isPageVisible, setIsPageVisible] = useState(true)
  const [lastResponse, setLastResponse] = useState<ApiResponse | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  // Aplicar filtros desde URL al cargar la página
  useEffect(() => {
    const sectorParam = searchParams?.get("sector")
    const typeParam = searchParams?.get("type")

    if (sectorParam) {
      setSectorFilter(sectorParam)
    }

    if (typeParam) {
      setTypeFilter(typeParam)
    }
  }, [searchParams])

  // Monitorear visibilidad de la página (OPTIMIZACIÓN para reducir créditos)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden)
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

  const fetchData = async (isBackground = false) => {
    try {
      if (isBackground) {
        setBackgroundLoading(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const response = await fetch("/api/cotizaciones?type=FX", {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse = await response.json()
      setLastResponse(result) // Guardar respuesta completa

      if (result.success) {
        setData(result.data || [])
        setLastUpdate(result.lastUpdate || "")
        setError(null)
      } else {
        throw new Error(result.error || "Error desconocido")
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Error al cargar los datos")
    } finally {
      if (isBackground) {
        setBackgroundLoading(false)
      } else {
        setLoading(false)
      }
    }
  }

  // Countdown para próxima actualización (OPTIMIZADO: 3 minutos)
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
    fetchData()

    // Auto-refresh cada 3 minutos SOLO si la página está visible (OPTIMIZACIÓN)
    intervalRef.current = setInterval(() => {
      if (isOnline && isPageVisible) {
        console.log("🔄 Auto-refresh activado (página visible)")
        fetchData(true)
      } else if (!isPageVisible) {
        console.log("⏸️ Auto-refresh pausado (página oculta - AHORRO DE CRÉDITOS)")
      }
    }, 180000) // 3 minutos

    // Iniciar countdown
    startCountdown()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
      }
    }
  }, [isOnline, isPageVisible])

  const handleManualRefresh = () => {
    fetchData(data.length > 0) // Si ya hay datos, hacer refresh en background
    startCountdown()
  }

  // Formatear tiempo de countdown
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Filtrar datos
  const filteredData = data.filter((item) => {
    const sectorMatch = sectorFilter === "all" || item.sector === sectorFilter
    const typeMatch =
      typeFilter === "all" ||
      (typeFilter === "LAST" && item.symbol.includes("LAST")) ||
      (typeFilter === "CLOSE" && item.symbol.includes("CLOSE")) ||
      (typeFilter === "PERCENT" && item.symbol.includes("%"))

    return sectorMatch && typeMatch
  })

  // Obtener sectores únicos
  const uniqueSectors = Array.from(new Set(data.map((item) => item.sector).filter(Boolean)))

  // Determinar el estado del mercado y tipo de datos
  const getMarketStatusInfo = () => {
    if (!lastResponse) return null

    const isMarketClosed = lastResponse.marketClosed || !lastResponse.marketStatus?.isOpen
    const isShowingCloseData = lastResponse.type?.includes("MARKET_CLOSE")
    const isCached = lastResponse.cached
    const isFallback = lastResponse.fallback

    if (isFallback) {
      return {
        status: "Datos de Respaldo",
        color: "bg-yellow-500",
        textColor: "text-yellow-800",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        description: "Usando datos guardados por error en la conexión",
      }
    }

    if (isShowingCloseData) {
      return {
        status: "Datos de Cierre del Mercado",
        color: "bg-blue-500",
        textColor: "text-blue-800",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        description: "Mostrando datos del último cierre del mercado",
      }
    }

    if (isMarketClosed) {
      return {
        status: "Mercado Cerrado",
        color: "bg-red-500",
        textColor: "text-red-800",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        description: lastResponse.marketStatus?.reason || "Fuera del horario de mercado",
      }
    }

    return {
      status: "Mercado Abierto",
      color: "bg-green-500",
      textColor: "text-green-800",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      description: "Datos en tiempo real",
    }
  }

  // Función para obtener el color del badge según el tipo de cotización
  const getBadgeStyle = (symbol: string, sector?: string) => {
    if (symbol.includes("CCL") || sector === "CCL") {
      return "bg-blue-500 text-white hover:bg-blue-600"
    }
    if (symbol.includes("MEP") || sector === "MEP") {
      return "bg-green-500 text-white hover:bg-green-600"
    }
    if (symbol.includes("OFICIAL") || sector === "OFICIAL") {
      return "bg-red-500 text-white hover:bg-red-600"
    }
    if (symbol.includes("CRYPTO") || sector === "CRYPTO") {
      return "bg-purple-500 text-white hover:bg-purple-600"
    }
    if (symbol.includes("CANJE") || sector === "CANJE") {
      return "bg-orange-500 text-white hover:bg-orange-600"
    }
    return "bg-gray-500 text-white hover:bg-gray-600"
  }

  // Función para obtener el texto del badge
  const getBadgeText = (symbol: string, sector?: string) => {
    if (symbol.includes("CCL") || sector === "CCL") return "CCL"
    if (symbol.includes("MEP") || sector === "MEP") return "MEP"
    if (symbol.includes("OFICIAL") || sector === "OFICIAL") return "OFICIAL"
    if (symbol.includes("CRYPTO") || sector === "CRYPTO") return "CRYPTO"
    if (symbol.includes("CANJE") || sector === "CANJE") return "CANJE"
    return sector || "FX"
  }

  const marketStatusInfo = getMarketStatusInfo()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Cotizaciones FX</h1>
              <p className="text-slate-600">
                Cotizaciones de dólar MEP, CCL, Oficial y Crypto con control de horarios de mercado
              </p>
              <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Última actualización: {lastUpdate || new Date().toLocaleString("es-AR")}</span>
                </div>
                {lastResponse?.marketStatus?.isOpen && <span>Próxima en: {formatCountdown(nextUpdateIn)}</span>}
                <div className="flex items-center gap-1">
                  {isOnline ? (
                    <Wifi className="h-4 w-4 text-green-600" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-600" />
                  )}
                  <span className={isOnline ? "text-green-600" : "text-red-600"}>
                    {isOnline ? "Conectado" : "Sin conexión"}
                  </span>
                </div>
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
                {lastResponse?.cached && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                    Cache 3min
                  </Badge>
                )}
                {backgroundLoading && (
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
                disabled={loading || backgroundLoading}
              >
                <RefreshCw className={`h-4 w-4 ${loading || backgroundLoading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Market Status */}
        {marketStatusInfo && (
          <div className="mb-8">
            <Card className={`${marketStatusInfo.bgColor} ${marketStatusInfo.borderColor}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 ${marketStatusInfo.color} rounded-full ${lastResponse?.marketStatus?.isOpen ? "animate-pulse" : ""}`}
                    ></div>
                    <span className={`font-medium ${marketStatusInfo.textColor}`}>{marketStatusInfo.status}</span>
                    {lastResponse?.marketStatus && (
                      <span className="text-sm text-slate-600">{lastResponse.marketStatus.currentTime}</span>
                    )}
                  </div>
                  <div className="text-sm text-slate-700 flex items-center gap-4">
                    <span>Horario: 11:00-17:00 hs (Lun-Vie)</span>
                    {lastResponse?.marketStatus?.nextOpenTime && (
                      <span>Próxima apertura: {lastResponse.marketStatus.nextOpenTime}</span>
                    )}
                    <span>Cache: 3min | Auto-refresh: {isPageVisible ? "Activo" : "Pausado"}</span>
                  </div>
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  <span>{marketStatusInfo.description}</span>
                  {lastResponse?.marketClosed && lastResponse.type?.includes("MARKET_CLOSE") && (
                    <span className="ml-2 text-blue-600">• Se muestran datos del último cierre del mercado</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <div className="mb-8 flex flex-wrap gap-4">
          <Select value={sectorFilter} onValueChange={setSectorFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por sector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los FX</SelectItem>
              {uniqueSectors.map((sector) => (
                <SelectItem key={sector} value={sector || ""}>
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="LAST">Solo LAST</SelectItem>
              <SelectItem value="CLOSE">Solo CLOSE</SelectItem>
              <SelectItem value="PERCENT">Solo %</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Total: {filteredData.length} instrumentos</span>
            {lastResponse?.count && lastResponse.count !== filteredData.length && (
              <span>({lastResponse.count} disponibles)</span>
            )}
          </div>
        </div>

        {/* Contenido principal */}
        {loading && data.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-600">Cargando cotizaciones...</span>
          </div>
        ) : error && data.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
              <p className="text-lg font-medium">Error al cargar los datos</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button onClick={handleManualRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        ) : data.length === 0 && lastResponse?.marketStatus && !lastResponse.marketStatus.isOpen ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <p className="text-lg font-medium text-slate-600">Mercado cerrado</p>
            <p className="text-sm text-slate-500 mt-1">{lastResponse.marketStatus.reason}</p>
            {lastResponse.marketStatus.nextOpenTime && (
              <p className="text-sm text-slate-500 mt-1">Próxima apertura: {lastResponse.marketStatus.nextOpenTime}</p>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredData.map((item, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <Badge className={`text-xs ${getBadgeStyle(item.symbol, item.sector)}`}>
                      {getBadgeText(item.symbol, item.sector)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-2xl font-bold">{item.price}</div>
                    <div
                      className={`flex items-center gap-1 text-sm font-medium ${
                        item.change.startsWith("+") ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {item.change.startsWith("+") ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {item.change}
                    </div>
                    {item.volume && (
                      <div className="text-xs text-slate-500">
                        <span>Volumen: {item.volume}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
