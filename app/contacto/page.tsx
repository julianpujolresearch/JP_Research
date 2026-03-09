"use client"

import type React from "react"

import { useState } from "react"
import { Mail, MapPin, Clock, Send, Linkedin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    empresa: "",
    asunto: "",
    mensaje: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí iría la lógica para enviar el formulario
    console.log("Formulario enviado:", formData)
    alert("Mensaje enviado correctamente. Te contactaré pronto!")
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Contacto</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            ¿Tienes alguna consulta sobre análisis financiero o necesitas asesoramiento especializado? Me encantaría
            ayudarte.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-lacoste-green-500" />
                    Email
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">julianpujol.research@gmail.com</p>
                  <p className="text-sm text-slate-500 mt-1">Respuesta en 24 horas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Linkedin className="h-5 w-5 text-lacoste-green-500" />
                    LinkedIn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href="https://www.linkedin.com/in/juli%C3%A1n-pujol-43b54311b/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 hover:text-lacoste-green-500 transition-colors"
                  >
                    Julián Pujol
                  </a>
                  <p className="text-sm text-slate-500 mt-1">Economist | Trader at NASINI SA</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-lacoste-green-500" />
                    Ubicación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">Rosario, Argentina</p>
                  <p className="text-sm text-slate-500 mt-1">Reuniones presenciales y virtuales</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-lacoste-green-500" />
                    Horarios de Atención
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-slate-600">
                    <p>Lunes - Viernes: 10:00 - 18:00</p>
                    <p>Sábados: Cerrado</p>
                    <p>Domingos: Cerrado</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Envíame un mensaje</CardTitle>
                <CardDescription>
                  Completa el formulario y me pondré en contacto contigo lo antes posible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre completo *</Label>
                      <Input
                        id="nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="empresa">Empresa</Label>
                    <Input
                      id="empresa"
                      name="empresa"
                      value={formData.empresa}
                      onChange={handleChange}
                      placeholder="Nombre de tu empresa"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="asunto">Asunto *</Label>
                    <Input
                      id="asunto"
                      name="asunto"
                      value={formData.asunto}
                      onChange={handleChange}
                      required
                      placeholder="¿En qué puedo ayudarte?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mensaje">Mensaje *</Label>
                    <Textarea
                      id="mensaje"
                      name="mensaje"
                      value={formData.mensaje}
                      onChange={handleChange}
                      required
                      rows={6}
                      placeholder="Describe tu consulta o proyecto en detalle..."
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full bg-lacoste-green-500 hover:bg-lacoste-green-600">
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Mensaje
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Services Section */}
        <section className="mt-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">¿Cómo puedo ayudarte?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-lg">Análisis Macroeconómico</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">
                  Evaluación integral del contexto macroeconómico argentino con foco en variables clave como actividad,
                  inflación, política monetaria y regulaciones del BCRA y CNV. Elaboración de reportes estratégicos con
                  escenarios, riesgos y oportunidades para la toma de decisiones de inversión.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-lg">Data Mining</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">
                  Diseño de soluciones de minería de datos a medida para inversores institucionales y family offices.
                  Extracción, depuración y análisis de grandes volúmenes de información financiera y normativa para la
                  identificación de patrones, generación de alertas y construcción de ventajas informativas.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-lg">Informes de Research</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">
                  Producción de informes sectoriales y temáticos de alto valor agregado. Análisis de industrias,
                  compañías y tendencias con enfoque fundamental, regulatorio y competitivo. Identificación de
                  oportunidades de inversión a partir de insights únicos basados en datos y normativa vigente.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
