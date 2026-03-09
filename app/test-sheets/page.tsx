"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestSheetsPage() {
  const [cclValue, setCclValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState("")

  const testConnection = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/cotizaciones?type=CCL")
      if (res.ok) setStatus("✅ Conexión exitosa")
      else setStatus("❌ Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const fetchCCL = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/cotizaciones?type=CCL")
      const json = await res.json()
      setCclValue(json.data?.[0]?.price || "N/D")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test de Conexión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testConnection} disabled={loading}>
              {loading ? "Probando..." : "Probar Conexión"}
            </Button>
            {status && <div className="bg-slate-100 p-3 rounded">{status}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Obtener CCL (celda G6)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={fetchCCL} disabled={loading}>
              {loading ? "Obteniendo…" : "Obtener CCL"}
            </Button>
            {cclValue && (
              <div className="bg-slate-100 p-3 rounded">
                <strong>CCL:</strong> {cclValue}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
