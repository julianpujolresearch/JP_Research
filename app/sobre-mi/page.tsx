import { Award, BookOpen, TrendingUp, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SobreMiPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-32 h-32 bg-lacoste-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-4xl font-bold text-lacoste-green-500">JP</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Julián Pujol</h1>
            <p className="text-xl text-slate-600 mb-6">Economist & Sr Trader</p>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Con más de 3 años de experiencia en análisis financiero y mercados de capitales, me especializo en trading
              institucional, análisis de datos y research macroeconómico, tanto a nivel local como internacional.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Experience Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Experiencia Profesional</h2>
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">Sr Trader</CardTitle>
                    <CardDescription className="text-lg">NASINI SA • Oct. 2025 - Actualidad</CardDescription>
                    <CardDescription className="text-sm text-slate-500">Rosario, Santa Fe, Argentina</CardDescription>
                  </div>
                  <span className="text-sm text-slate-500">3 meses</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-slate-600 space-y-2">
                  <li>• Trading institucional en mercados de renta fija y variable</li>
                  <li>• Atención y asesoramiento a clientes institucionales</li>
                  <li>• Análisis de oportunidades de inversión y gestión de riesgo</li>
                  <li>• Elaboración de informes de research macroeconómico y financiero</li>
                  <li>• Seguimiento de mercado y monitoreo de instrumentos financieros</li>
                  <li>• Desarrollo de estrategias de trading y optimización de carteras</li>
                  <li>• Análisis técnico y fundamental para la toma de decisiones</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">Ssr Trader</CardTitle>
                    <CardDescription className="text-lg">NASINI SA • Sept. 2023 - Oct. 2025</CardDescription>
                    <CardDescription className="text-sm text-slate-500">Rosario, Santa Fe, Argentina</CardDescription>
                  </div>
                  <span className="text-sm text-slate-500">2 años 1 mes</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-slate-600 space-y-2">
                  <li>• Trading institucional en mercados de renta fija y variable</li>
                  <li>• Análisis de oportunidades de inversión y gestión de riesgo</li>
                  <li>• Investigación de mercado y seguimiento de instrumentos financieros</li>
                  <li>• Desarrollo de estrategias de trading y optimización de carteras</li>
                  <li>• Análisis técnico y fundamental para toma de decisiones</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">Jr Trader</CardTitle>
                    <CardDescription className="text-lg">NASINI SA • Abr. 2023 - Sept. 2023</CardDescription>
                    <CardDescription className="text-sm text-slate-500">Rosario, Santa Fe, Argentina</CardDescription>
                  </div>
                  <span className="text-sm text-slate-500">6 meses</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-slate-600 space-y-2">
                  <li>• Soporte en operaciones de trading y ejecución de órdenes</li>
                  <li>• Monitoreo de mercados financieros y análisis de precios</li>
                  <li>• Asistencia en investigación de mercado y análisis sectorial</li>
                  <li>• Elaboración de reportes diarios de posiciones y performance</li>
                  <li>• Aprendizaje de herramientas de trading y plataformas institucionales</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Skills & Expertise */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Especialidades</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-lacoste-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-lacoste-green-500" />
                </div>
                <CardTitle className="text-lg">Trading Institucional</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">
                  Ejecución de operaciones en mercados de renta fija y variable con enfoque institucional
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-lacoste-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-lacoste-green-500" />
                </div>
                <CardTitle className="text-lg">Research Macroeconómico</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">
                  Análisis macroeconómico local e internacional para identificación de oportunidades
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-lacoste-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-lacoste-green-500" />
                </div>
                <CardTitle className="text-lg">Análisis de Datos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">
                  Procesamiento y análisis de grandes volúmenes de datos financieros para toma de decisiones
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-lacoste-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-lacoste-green-500" />
                </div>
                <CardTitle className="text-lg">Gestión de Riesgo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">
                  Evaluación y gestión de riesgos en carteras de inversión y operaciones de trading
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Education */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Educación</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Bachillerato, Economía</CardTitle>
                <CardDescription className="text-lg">Colegio San Patricio</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-2">
                  <span className="font-medium">2003 - 2015</span>
                </p>
                <p className="text-slate-600">
                  Bachillerato con orientación en Economía y Administración, proporcionando una base sólida en
                  principios económicos y gestión empresarial.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Licenciatura, Economía</CardTitle>
                <CardDescription className="text-lg">Universidad Nacional de Rosario - UNR</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-2">
                  <span className="font-medium">2016 - 2022</span>
                </p>
                <p className="text-slate-600">
                  Formación integral en teoría económica, análisis macroeconómico y microeconómico, con especialización
                  en mercados financieros y econometría aplicada.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Licenses and Certifications */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Licencias y Certificaciones</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Python para finanzas</CardTitle>
                <CardDescription className="text-sm">Universidad del CEMA</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">Expedición: jun. 2025</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revista Dissertatio</CardTitle>
                <CardDescription className="text-sm">
                  Consejo Profesional de Ciencias Económicas Cámara II
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">Expedición: nov. 2023</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Operador de Mercado de Capitales</CardTitle>
                <CardDescription className="text-sm">BYMA Bolsas y Mercados Argentinos S.A.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">Expedición: jul. 2023</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Programa Intensivo de Verano de FyO (PIV2023)</CardTitle>
                <CardDescription className="text-sm">A3 Mercados</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">Expedición: feb. 2023</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Introducción a los Futuros de Tipo de Cambio</CardTitle>
                <CardDescription className="text-sm">Bolsa de Comercio de Rosario</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">Expedición: sept. 2022</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cuartas Jornada de Jóvenes Investigadores</CardTitle>
                <CardDescription className="text-sm">Universidad Nacional de Rosario - UNR</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">Expedición: abr. 2022</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Introducción a las Finanzas Descentralizadas</CardTitle>
                <CardDescription className="text-sm">Bolsa de Comercio de Rosario</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">Expedición: mar. 2022</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">CAE - Certificate in Advanced English</CardTitle>
                <CardDescription className="text-sm">Cambridge University Press & Assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">Expedición: ene. 2016</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">TOEFL</CardTitle>
                <CardDescription className="text-sm">TOEFL</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">Expedición: sept. 2015</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">FCE - First Certificate in English</CardTitle>
                <CardDescription className="text-sm">Cambridge University Press & Assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">Expedición: ene. 2014</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
