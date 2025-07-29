import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Hero() {
  return (
    <section id="inicio" className="relative min-h-screen flex items-center justify-center text-white overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "url(/placeholder.svg?height=1080&width=1920)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto mb-6 bg-white rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-slate-900">OS</span>
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          Bienvenidos a <span className="text-blue-400">Opera Soluciones</span>
        </h1>

        <p className="text-xl md:text-2xl mb-8 text-gray-300">Innovación y excelencia en cada proyecto</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="#contacto">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3">
              Contáctanos
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-slate-900 text-lg px-8 py-3 bg-transparent"
            >
              Acceso al Sistema
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
