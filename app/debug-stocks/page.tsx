"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle, XCircle } from "lucide-react"

export default function DebugStocksPage() {
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDebugData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/debug-stocks")
      const data = await response.json()
      setDebugData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Debug Stocks API</h1>
            <p className="text-slate-600">Diagnóstico de conexión a Google Sheets para Stocks</p>
          </div>
          <Button onClick={fetchDebugData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="h-5 w-5" />
                <span>Error: {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {debugData && (
          <div className="space-y-6">
            {/* Environment Variables */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Variables de Entorno
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(debugData.environmentVariables || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Badge variant={value ? "default" : "destructive"}>{value ? "✓" : "✗"}</Badge>
                      <span className="text-sm">{key}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Available Sheets */}
            <Card>
              <CardHeader>
                <CardTitle>Hojas Disponibles</CardTitle>
                <CardDescription>Hojas encontradas en el Google Sheet: {debugData.spreadsheetId}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {debugData.availableSheets?.map((sheet: string) => (
                    <Badge key={sheet} variant="outline">
                      {sheet}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Range Tests */}
            <Card>
              <CardHeader>
                <CardTitle>Pruebas de Rangos</CardTitle>
                <CardDescription>Resultados de {debugData.summary?.totalRangesTested} rangos probados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {debugData.rangeTests?.map((test: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm">{test.range}</span>
                        <div className="flex items-center gap-2">
                          {test.success ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Éxito
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Error
                            </Badge>
                          )}
                          {test.success && <Badge variant="outline">{test.rowCount} filas</Badge>}
                        </div>
                      </div>

                      {test.success && test.firstRows && test.firstRows.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-slate-600 mb-2">Primeras filas:</p>
                          <div className="bg-slate-100 rounded p-2 text-xs font-mono overflow-x-auto">
                            {test.firstRows.map((row: any[], rowIndex: number) => (
                              <div key={rowIndex} className="mb-1">
                                [{rowIndex + 1}] {JSON.stringify(row)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!test.success && <div className="mt-2 text-sm text-red-600">Error: {test.error}</div>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{debugData.summary?.totalRangesTested || 0}</div>
                    <div className="text-sm text-slate-600">Rangos Probados</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{debugData.summary?.successfulRanges || 0}</div>
                    <div className="text-sm text-slate-600">Exitosos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{debugData.summary?.rangesWithData || 0}</div>
                    <div className="text-sm text-slate-600">Con Datos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
