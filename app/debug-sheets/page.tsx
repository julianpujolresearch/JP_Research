"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, Clock, Database } from "lucide-react"

interface DebugResult {
  success: boolean
  test: string
  results?: any
  message: string
  error?: string
}

export default function DebugSheetsPage() {
  const [results, setResults] = useState<DebugResult[]>([])
  const [loading, setLoading] = useState(false)

  const runTest = async (testType: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/debug-sheets?test=${testType}`)
      const result: DebugResult = await response.json()
      setResults((prev) => [...prev, result])
    } catch (error) {
      setResults((prev) => [
        ...prev,
        {
          success: false,
          test: testType,
          message: "Error de conexión",
          error: error instanceof Error ? error.message : "Error desconocido",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const runAllTests = async () => {
    setResults([])
    setLoading(true)

    const tests = ["env", "lastupdate", "complete_diagnostic"]

    for (const test of tests) {
      try {
        const response = await fetch(`/api/debug-sheets?test=${test}`)
        const result: DebugResult = await response.json()
        setResults((prev) => [...prev, result])

        // Pequeña pausa entre tests
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        setResults((prev) => [
          ...prev,
          {
            success: false,
            test,
            message: "Error de conexión",
            error: error instanceof Error ? error.message : "Error desconocido",
          },
        ])
      }
    }

    setLoading(false)
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Diagnóstico Google Sheets</h1>
        <p className="text-gray-600">
          Herramientas para diagnosticar la conexión con Google Sheets y verificar la última actualización desde F1
        </p>
      </div>

      {/* Controles */}
      <div className="mb-6 flex flex-wrap gap-4">
        <Button onClick={() => runTest("env")} disabled={loading} variant="outline">
          <Database className="h-4 w-4 mr-2" />
          Verificar Variables de Entorno
        </Button>

        <Button onClick={() => runTest("lastupdate")} disabled={loading} variant="outline">
          <Clock className="h-4 w-4 mr-2" />
          Verificar Última Actualización (F1)
        </Button>

        <Button onClick={runAllTests} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
          Ejecutar Diagnóstico Completo
        </Button>

        <Button onClick={clearResults} variant="secondary" disabled={loading}>
          Limpiar Resultados
        </Button>
      </div>

      {/* Resultados */}
      <div className="space-y-4">
        {results.map((result, index) => (
          <Card key={index} className={result.success ? "border-green-200" : "border-red-200"}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  Test: {result.test}
                </CardTitle>
                <Badge variant={result.success ? "default" : "destructive"}>{result.success ? "Éxito" : "Error"}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{result.message}</p>

              {result.error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                  <p className="text-sm text-red-800">
                    <strong>Error:</strong> {result.error}
                  </p>
                </div>
              )}

              {result.results && (
                <div className="bg-gray-50 border rounded p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Resultados:</p>
                  <pre className="text-xs text-gray-600 overflow-auto">{JSON.stringify(result.results, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {results.length === 0 && !loading && (
        <div className="text-center py-12">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay resultados de diagnóstico aún.</p>
          <p className="text-sm text-gray-400 mt-2">
            Ejecuta un test para verificar la conexión con Google Sheets y la última actualización desde F1.
          </p>
        </div>
      )}
    </div>
  )
}
