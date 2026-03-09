import { Search, Filter, Calendar, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function InformesPage() {
  const informes = [
    {
      id: 1,
      title: "YPF S.A. - Análisis Fundamental Q3 2025",
      description:
        "Evaluación completa de los resultados del tercer trimestre, análisis de flujo de caja y perspectivas para 2026.",
      category: "Energía",
      date: "15 Nov 2025",
      recommendation: "COMPRAR",
      targetPrice: "$25.50",
      currentPrice: "$22.30",
      upside: "+14.3%",
      analyst: "Juan Pérez",
      pages: 24,
    },
    {
      id: 2,
      title: "Banco Macro - Actualización Trimestral",
      description: "Análisis de márgenes financieros, calidad de cartera y estrategia de expansión digital.",
      category: "Financiero",
      date: "12 Nov 2025",
      recommendation: "MANTENER",
      targetPrice: "$1,850",
      currentPrice: "$1,720",
      upside: "+7.6%",
      analyst: "María González",
      pages: 18,
    },
    {
      id: 3,
      title: "Sector Commodities - Outlook 2025",
      description: "Perspectivas para soja, trigo y maíz. Impacto en Cresud, Los Grobo y principales exportadores.",
      category: "Agro",
      date: "10 Nov 2025",
      recommendation: "SOBREPONDERAR",
      targetPrice: "N/A",
      currentPrice: "N/A",
      upside: "N/A",
      analyst: "Carlos Rodríguez",
      pages: 32,
    },
    {
      id: 4,
      title: "Telecom Argentina - Análisis Post Resultados",
      description: "Evaluación de EBITDA, inversiones en 5G y estrategia de convergencia fijo-móvil.",
      category: "Telecomunicaciones",
      date: "8 Nov 2025",
      recommendation: "VENDER",
      targetPrice: "$580",
      currentPrice: "$650",
      upside: "-10.8%",
      analyst: "Ana Martínez",
      pages: 16,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Informes de Research</h1>
              <p className="text-slate-600">Análisis profesional y recomendaciones de inversión actualizadas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input placeholder="Buscar informes..." className="pl-10" />
            </div>
          </div>
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Calendar className="h-4 w-4" />
            Fecha
          </Button>
        </div>

        {/* Reports Grid */}
        <div className="grid gap-6">
          {informes.map((informe) => (
            <Card key={informe.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{informe.category}</Badge>
                      <span className="text-sm text-slate-500">{informe.date}</span>
                      <span className="text-sm text-slate-500">• {informe.pages} páginas</span>
                    </div>
                    <CardTitle className="text-xl mb-2">{informe.title}</CardTitle>
                    <CardDescription className="text-base">{informe.description}</CardDescription>
                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
                      <span>Analista: {informe.analyst}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant={
                        informe.recommendation === "COMPRAR"
                          ? "default"
                          : informe.recommendation === "MANTENER"
                            ? "secondary"
                            : informe.recommendation === "VENDER"
                              ? "destructive"
                              : "outline"
                      }
                      className="text-xs font-medium"
                    >
                      {informe.recommendation}
                    </Badge>

                    {informe.targetPrice !== "N/A" && (
                      <div className="text-right">
                        <div className="text-sm text-slate-600">Precio Objetivo</div>
                        <div className="font-semibold">{informe.targetPrice}</div>
                        <div className="text-sm text-slate-600">Actual: {informe.currentPrice}</div>
                        <div
                          className={`text-sm font-medium flex items-center gap-1 ${
                            informe.upside.startsWith("+") ? "text-lacoste-green-500" : "text-red-600"
                          }`}
                        >
                          {informe.upside.startsWith("+") ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {informe.upside}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex justify-between items-center">
                  <Button variant="outline" size="sm">
                    Vista Previa
                  </Button>
                  <Button size="sm" className="bg-lacoste-green-500 hover:bg-lacoste-green-600">
                    Descargar PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            Cargar más informes
          </Button>
        </div>
      </div>
    </div>
  )
}
