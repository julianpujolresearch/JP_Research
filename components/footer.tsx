import Link from "next/link"
import { BarChart3, Mail, MapPin } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <BarChart3 className="h-8 w-8 text-lacoste-green-500" />
              <span className="text-xl font-bold">JP Research</span>
            </Link>
            <p className="text-slate-400 mb-4">
              Análisis financiero profesional y market data para el mercado argentino.
            </p>
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>julianpujol.research@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Rosario, Argentina</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4">Servicios</h3>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link href="/informes" className="hover:text-white">
                  Informes de Research
                </Link>
              </li>
              <li>
                <Link href="/market-data" className="hover:text-white">
                  Market Data
                </Link>
              </li>
              <li>
                <Link href="/publicaciones" className="hover:text-white">
                  Publicaciones
                </Link>
              </li>
              <li>
                <a
                  href="https://v0-jp-global-macro-database.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  JP Global Macro Database
                </a>
              </li>
            </ul>
          </div>

          {/* Data Base */}
          <div>
            <h3 className="font-semibold mb-4">Database</h3>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a
                  href="https://v0-jp-global-macro-database.vercel.app/argentina/banco-central"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  BCRA
                </a>
              </li>
              <li>
                <a
                  href="https://v0-jp-global-macro-database.vercel.app/argentina/sector-publico"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  Sector Público
                </a>
              </li>
              <li>
                <a
                  href="https://v0-jp-global-macro-database.vercel.app/argentina/sector-externo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  Sector Externo
                </a>
              </li>
              <li>
                <a
                  href="https://docs.google.com/spreadsheets/d/1RWLdcsa1Y01K3uvo9OoX5q8xf5iQ6j4TEohav4XbrcE/edit?usp=drive_link"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  Renta Fija
                </a>
              </li>
              <li>
                <a
                  href="https://docs.google.com/spreadsheets/d/1aRIARLG_52iPrXf1qVDFFGbDfhHVvutdNbKKuy2QNxg/edit?gid=695283588#gid=695283588"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  Obligaciones Negociables
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Empresa</h3>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link href="/sobre-mi" className="hover:text-white">
                  Sobre Mí
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-white">
                  Contacto
                </Link>
              </li>
              <li>
                <a
                  href="https://drive.google.com/file/d/14gG3SR6GC1YV4hjIbIK6isYbMN5s9cB9/view?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  Términos
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
          <p>&copy; 2025 JP Research. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
