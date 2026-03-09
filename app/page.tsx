import { ArrowRight, BarChart3, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center text-white overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/hero-background.png')",
          }}
        />

        {/* Fallback gradient if image doesn't load */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

        {/* Green Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-lacoste-green-500/90 via-lacoste-green-600/85 to-lacoste-green-800/95" />

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Research & Market Data
              <span className="block text-green-200">Profesional</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-200 mb-8 max-w-3xl mx-auto">
              Análisis financiero especializado, informes de mercado y data en tiempo real para tomar decisiones de
              inversión informadas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-lacoste-green-500 hover:bg-lacoste-green-600 shadow-lg border-2 border-white"
              >
                <Link href="/informes" className="flex items-center">
                  Ver Informes
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-slate-900 bg-white/10 backdrop-blur-sm border-2"
              >
                <Link href="/market-data">Market Data</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Servicios</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Ofrecemos análisis profundo y data actualizada para el mercado financiero argentino
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-lacoste-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-lacoste-green-500" />
                </div>
                <CardTitle className="text-xl">Informes de Research</CardTitle>
                <CardDescription>
                  Análisis detallados de empresas, sectores y oportunidades de inversión
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-slate-600 space-y-2 mb-6">
                  <li>• Análisis fundamental</li>
                  <li>• Valuaciones DCF</li>
                  <li>• Recomendaciones de inversión</li>
                  <li>• Seguimiento sectorial</li>
                </ul>
                <Button variant="outline" className="w-full bg-transparent">
                  <Link href="/informes">Ver Informes</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-lacoste-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-lacoste-green-500" />
                </div>
                <CardTitle className="text-xl">Market Data</CardTitle>
                <CardDescription>Datos de mercado en tiempo real y análisis técnico especializado</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-slate-600 space-y-2 mb-6">
                  <li>• Cotizaciones en tiempo real</li>
                  <li>• Análisis técnico</li>
                  <li>• Indicadores de mercado</li>
                  <li>• Alertas personalizadas</li>
                </ul>
                <Button variant="outline" className="w-full bg-transparent">
                  <Link href="/market-data">Ver Data</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-slate-900 mb-2">50+</div>
              <div className="text-slate-600">Publicaciones en Data Base</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 mb-2">24/7</div>
              <div className="text-slate-600">Market Data</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 mb-2">3+</div>
              <div className="text-slate-600">Años de Experiencia</div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Reports Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Informes Recientes</h2>
              <p className="text-slate-600">Los últimos análisis y recomendaciones del mercado</p>
            </div>
            <Button variant="outline">
              <Link href="/informes" className="flex items-center">
                Ver Todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Análisis YPF - Q3 2025",
                description: "Evaluación completa de resultados trimestrales y perspectivas futuras",
                date: "15 Nov 2025",
                category: "Energía",
              },
              {
                title: "Sector Bancario Argentino",
                description: "Comparativo de principales bancos y oportunidades de inversión",
                date: "12 Nov 2025",
                category: "Financiero",
              },
              {
                title: "Mercado de Commodities",
                description: "Análisis de precios internacionales y impacto en empresas locales",
                date: "10 Nov 2025",
                category: "Commodities",
              },
            ].map((report, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-lacoste-green-500 bg-lacoste-green-50 px-2 py-1 rounded">
                      {report.category}
                    </span>
                    <span className="text-xs text-slate-500">{report.date}</span>
                  </div>
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" size="sm" className="p-0 h-auto font-medium text-lacoste-green-500">
                    Leer más →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Listo para tomar mejores decisiones de inversión?</h2>
          <p className="text-xl text-slate-300 mb-8">Accede a nuestros informes exclusivos y market data profesional</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-lacoste-green-500 hover:bg-lacoste-green-600">
              <Link href="/informes">Ver Informes</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-slate-900 bg-transparent"
            >
              <Link href="/contacto">Contactar</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
