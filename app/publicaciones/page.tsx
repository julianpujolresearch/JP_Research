"use client"

import { Calendar, Clock, User, ArrowRight, BookOpen, FileText, Video, Headphones, Download, Eye } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PublicacionesPage() {
  const publicaciones = [
    {
      id: 1,
      title: "El impacto del COVID-19 en el mercado laboral informal y la distribución del ingreso en Argentina",
      description:
        "El trabajo analiza cómo la crisis sanitaria de 2020 afectó al empleo informal y a la distribución del ingreso en Argentina. A partir de indicadores entre 2017 y 2020, examina el aumento de la informalidad, la desocupación y la concentración del ingreso.",
      type: "Artículo",
      date: "27 Nov 2023",
      readTime: "25 min",
      author: "Julián Pujol",
      category: "Economía Laboral",
      featured: true,
      externalUrl: "https://cloud.3dissue.net/7216/7216/7222/103421/index.html",
      hasPreview: true,
    },
    {
      id: 2,
      title:
        "Impactos de la pandemia en el mercado de trabajo y en la distribución del ingreso de los cuentapropistas del Total de Aglomerados Urbanos (TAU) en la Argentina",
      description:
        "El trabajo estudia los impactos diferenciados de la pandemia sobre los cuentapropistas del TAU en Argentina, analizando indicadores laborales entre 2017 y 2020. Se observa una fuerte caída del empleo cuentapropista informal, una migración hacia la inactividad, y una distribución del ingreso más desigual dentro de este grupo.",
      type: "Póster",
      date: "25 Abr 2022",
      readTime: "10 min",
      author: "Julián Pujol",
      category: "Póster Científico",
      featured: false,
      externalUrl: "https://drive.google.com/file/d/1dRGND5wurYd2rM000_0hZTwlyYU5efex/view",
      hasPreview: true,
      event: "IV Jornadas de Jóvenes Investigadores - UNR",
      tutor: "Mg. Verónica Véntola",
    },
    {
      id: 3,
      title: "Perspectivas del Mercado Argentino para 2025",
      description:
        "Análisis completo de las oportunidades y desafíos que presenta el mercado local para el próximo año.",
      type: "Artículo",
      date: "15 Dic 2025",
      readTime: "8 min",
      author: "Juan Pérez",
      category: "Análisis de Mercado",
      featured: false,
      pdfUrl: "/pdfs/perspectivas-mercado-2025.pdf",
      hasPreview: true,
    },
  ]

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Artículo":
        return <FileText className="h-4 w-4" />
      case "Video":
        return <Video className="h-4 w-4" />
      case "Podcast":
        return <Headphones className="h-4 w-4" />
      case "Webinar":
        return <Video className="h-4 w-4" />
      case "Guía":
        return <BookOpen className="h-4 w-4" />
      case "Póster":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Artículo":
        return "bg-blue-100 text-blue-800"
      case "Video":
        return "bg-red-100 text-red-800"
      case "Podcast":
        return "bg-purple-100 text-purple-800"
      case "Webinar":
        return "bg-green-100 text-green-800"
      case "Guía":
        return "bg-orange-100 text-orange-800"
      case "Póster":
        return "bg-teal-100 text-teal-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleDownload = (pdfUrl: string, title: string) => {
    const link = document.createElement("a")
    link.href = pdfUrl
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`
    link.click()
  }

  const handlePreview = (pdfUrl: string) => {
    window.open(pdfUrl, "_blank")
  }

  const handleExternalLink = (url: string) => {
    window.open(url, "_blank")
  }

  const featuredPost = publicaciones.find((p) => p.featured)
  const regularPosts = publicaciones.filter((p) => !p.featured)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Publicaciones</h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Artículos, análisis, guías y contenido educativo sobre mercados financieros y estrategias de inversión
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Post */}
        {featuredPost && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Destacado</h2>
            <Card className="overflow-hidden hover:shadow-xl transition-shadow">
              <div className="md:flex">
                <div className="md:w-1/3 bg-gradient-to-br from-lacoste-green-500 to-lacoste-green-700 p-8 text-white flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      {getTypeIcon(featuredPost.type)}
                    </div>
                    <Badge className="bg-white/20 text-white border-white/30">{featuredPost.type}</Badge>
                  </div>
                </div>
                <div className="md:w-2/3 p-8">
                  <div className="flex items-center gap-4 mb-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {featuredPost.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {featuredPost.readTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {featuredPost.author}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">{featuredPost.title}</h3>
                  <p className="text-slate-600 mb-6 text-lg">{featuredPost.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{featuredPost.category}</Badge>
                    <div className="flex gap-2">
                      {featuredPost.externalUrl && (
                        <Button
                          className="bg-lacoste-green-500 hover:bg-lacoste-green-600"
                          onClick={() => handleExternalLink(featuredPost.externalUrl!)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Leer Publicación
                        </Button>
                      )}
                      {featuredPost.pdfUrl && featuredPost.hasPreview && (
                        <Button variant="outline" size="sm" onClick={() => handlePreview(featuredPost.pdfUrl!)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Vista Previa
                        </Button>
                      )}
                      {featuredPost.pdfUrl && (
                        <Button
                          className="bg-lacoste-green-500 hover:bg-lacoste-green-600"
                          onClick={() => handleDownload(featuredPost.pdfUrl!, featuredPost.title)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Descargar PDF
                        </Button>
                      )}
                      {!featuredPost.pdfUrl && !featuredPost.externalUrl && (
                        <Button className="bg-lacoste-green-500 hover:bg-lacoste-green-600">
                          Leer más
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* Regular Posts */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Todas las Publicaciones</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={`text-xs ${getTypeColor(post.type)}`}>
                      <span className="flex items-center gap-1">
                        {getTypeIcon(post.type)}
                        {post.type}
                      </span>
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {post.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                  <CardDescription className="line-clamp-3">{post.description}</CardDescription>
                  {post.event && (
                    <div className="mt-2 text-xs text-slate-500">
                      <strong>Evento:</strong> {post.event}
                    </div>
                  )}
                  {post.tutor && (
                    <div className="text-xs text-slate-500">
                      <strong>Tutora:</strong> {post.tutor}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {post.externalUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium text-lacoste-green-500"
                        onClick={() => handleExternalLink(post.externalUrl!)}
                      >
                        {post.type === "Póster" ? "Ver Póster →" : "Leer →"}
                      </Button>
                    )}
                    {post.pdfUrl && post.hasPreview && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 h-auto text-slate-600 hover:text-lacoste-green-500"
                        onClick={() => handlePreview(post.pdfUrl!)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {post.pdfUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 h-auto text-slate-600 hover:text-lacoste-green-500"
                        onClick={() => handleDownload(post.pdfUrl!, post.title)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {post.videoUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium text-lacoste-green-500"
                        onClick={() => window.open(post.videoUrl, "_blank")}
                      >
                        Ver Video →
                      </Button>
                    )}
                    {post.audioUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium text-lacoste-green-500"
                        onClick={() => window.open(post.audioUrl, "_blank")}
                      >
                        Escuchar →
                      </Button>
                    )}
                    {!post.pdfUrl && !post.videoUrl && !post.audioUrl && !post.externalUrl && (
                      <Button variant="ghost" size="sm" className="p-0 h-auto font-medium text-lacoste-green-500">
                        Leer más →
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Upload Instructions */}
        <section className="mt-20">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">¿Cómo subir una nueva publicación?</h3>
                <div className="text-left max-w-4xl mx-auto space-y-4 text-slate-700">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">📁 Paso 1: Subir el archivo</h4>
                      <p className="text-sm">
                        Coloca tu PDF en la carpeta <code className="bg-slate-200 px-1 rounded">public/pdfs/</code> de
                        tu proyecto
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">✏️ Paso 2: Editar el código</h4>
                      <p className="text-sm">
                        Agrega la información de tu publicación en el array{" "}
                        <code className="bg-slate-200 px-1 rounded">publicaciones</code>
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-100 p-4 rounded-lg text-sm">
                    <p className="font-medium mb-2">Ejemplo de estructura:</p>
                    <pre className="text-xs overflow-x-auto">{`{
  id: 4,
  title: "Tu Título Aquí",
  description: "Descripción de tu publicación...",
  type: "Artículo",
  date: "20 Dic 2025",
  readTime: "15 min",
  author: "Tu Nombre",
  category: "Tu Categoría",
  featured: false,
  pdfUrl: "/pdfs/tu-archivo.pdf",
  hasPreview: true,
}`}</pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            Cargar más publicaciones
          </Button>
        </div>

        {/* Newsletter CTA */}
        <section className="mt-20">
          <Card className="bg-lacoste-green-50 border-lacoste-green-200">
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">¿No te quieres perder ninguna publicación?</h3>
                <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                  Suscríbete a nuestro newsletter y recibe las últimas publicaciones, análisis y contenido exclusivo
                  directamente en tu email.
                </p>
                <Button size="lg" className="bg-lacoste-green-500 hover:bg-lacoste-green-600">
                  <Link href="/contacto">Suscribirse al Newsletter</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
