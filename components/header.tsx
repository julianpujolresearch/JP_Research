"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, ChevronDown, BarChart3 } from "lucide-react"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link className="mr-6 flex items-center space-x-2" href="/">
            <BarChart3 className="h-6 w-6 text-green-600" />
            <span className="hidden font-bold sm:inline-block">JP Research</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="/">
              INICIO
            </Link>
            <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="/market-data">
              MARKET DATA
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 transition-colors hover:text-foreground/80 text-foreground/60">
                <span>COTIZACIONES</span>
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href="/cotizaciones?sector=CCL">CCL</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/cotizaciones?sector=MEP">MEP</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/cotizaciones?sector=CANJE">CANJE</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/cotizaciones?sector=OFICIAL">OFICIAL</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/cotizaciones?sector=CRYPTO">CRYPTO</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 transition-colors hover:text-foreground/80 text-foreground/60">
                <span>CURVAS</span>
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href="/curvas?tipo=PESOS">PESOS</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/curvas?tipo=CER">CER</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/curvas?tipo=TAMAR">TAMAR</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/curvas?tipo=DOLAR_LINKED">DOLAR LINKED</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="/informes">
              INFORMES
            </Link>
            <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="/publicaciones">
              PUBLICACIONES
            </Link>
            <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="/sobre-mi">
              SOBRE MI
            </Link>
            <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="/contacto">
              CONTACTO
            </Link>
          </nav>
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <Link className="flex items-center space-x-2" href="/" onClick={() => setIsOpen(false)}>
              <BarChart3 className="h-6 w-6 text-green-600" />
              <span className="font-bold">JP Research</span>
            </Link>
            <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
              <div className="flex flex-col space-y-3">
                <Link
                  href="/"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                  onClick={() => setIsOpen(false)}
                >
                  INICIO
                </Link>
                <Link
                  href="/market-data"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                  onClick={() => setIsOpen(false)}
                >
                  MARKET DATA
                </Link>
                <div className="flex flex-col space-y-2">
                  <span className="font-medium text-foreground/80">COTIZACIONES</span>
                  <div className="flex flex-col space-y-2 pl-4">
                    <Link
                      href="/cotizaciones?sector=CCL"
                      className="transition-colors hover:text-foreground/80 text-foreground/60"
                      onClick={() => setIsOpen(false)}
                    >
                      CCL
                    </Link>
                    <Link
                      href="/cotizaciones?sector=MEP"
                      className="transition-colors hover:text-foreground/80 text-foreground/60"
                      onClick={() => setIsOpen(false)}
                    >
                      MEP
                    </Link>
                    <Link
                      href="/cotizaciones?sector=CANJE"
                      className="transition-colors hover:text-foreground/80 text-foreground/60"
                      onClick={() => setIsOpen(false)}
                    >
                      CANJE
                    </Link>
                    <Link
                      href="/cotizaciones?sector=OFICIAL"
                      className="transition-colors hover:text-foreground/80 text-foreground/60"
                      onClick={() => setIsOpen(false)}
                    >
                      OFICIAL
                    </Link>
                    <Link
                      href="/cotizaciones?sector=CRYPTO"
                      className="transition-colors hover:text-foreground/80 text-foreground/60"
                      onClick={() => setIsOpen(false)}
                    >
                      CRYPTO
                    </Link>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <span className="font-medium text-foreground/80">CURVAS</span>
                  <div className="flex flex-col space-y-2 pl-4">
                    <Link
                      href="/curvas?tipo=PESOS"
                      className="transition-colors hover:text-foreground/80 text-foreground/60"
                      onClick={() => setIsOpen(false)}
                    >
                      PESOS
                    </Link>
                    <Link
                      href="/curvas?tipo=CER"
                      className="transition-colors hover:text-foreground/80 text-foreground/60"
                      onClick={() => setIsOpen(false)}
                    >
                      CER
                    </Link>
                    <Link
                      href="/curvas?tipo=TAMAR"
                      className="transition-colors hover:text-foreground/80 text-foreground/60"
                      onClick={() => setIsOpen(false)}
                    >
                      TAMAR
                    </Link>
                    <Link
                      href="/curvas?tipo=DOLAR_LINKED"
                      className="transition-colors hover:text-foreground/80 text-foreground/60"
                      onClick={() => setIsOpen(false)}
                    >
                      DOLAR LINKED
                    </Link>
                  </div>
                </div>
                <Link
                  href="/informes"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                  onClick={() => setIsOpen(false)}
                >
                  INFORMES
                </Link>
                <Link
                  href="/publicaciones"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                  onClick={() => setIsOpen(false)}
                >
                  PUBLICACIONES
                </Link>
                <Link
                  href="/sobre-mi"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                  onClick={() => setIsOpen(false)}
                >
                  SOBRE MI
                </Link>
                <Link
                  href="/contacto"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                  onClick={() => setIsOpen(false)}
                >
                  CONTACTO
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Link className="inline-flex items-center space-x-2 md:hidden" href="/">
              <BarChart3 className="h-6 w-6 text-green-600" />
              <span className="font-bold">JP Research</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
