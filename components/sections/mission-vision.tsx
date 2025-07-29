import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MissionVision() {
  return (
    <section id="mision-vision" className="py-20 bg-slate-900 text-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Nuestra Misión y Visión</h2>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card className="bg-slate-800 border-slate-700 card-hover">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-400">Misión</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed">
                En Opera Soluciones, nos dedicamos a ofrecer servicios de mantenimiento, logística y construcción con un
                enfoque en la calidad y la eficiencia. Nuestro propósito es superar las expectativas de nuestros
                clientes mediante la implementación de soluciones personalizadas, respaldadas por un equipo altamente
                calificado y tecnologías avanzadas, garantizando prácticas sostenibles en todos nuestros procesos.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 card-hover">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-400">Visión</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed">
                Ser la empresa líder en soluciones integrales de mantenimiento, logística y construcción, reconocida por
                nuestra excelencia operativa, innovación constante y compromiso con la sostenibilidad, contribuyendo al
                desarrollo de infraestructuras que mejoren la calidad de vida de las comunidades.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
