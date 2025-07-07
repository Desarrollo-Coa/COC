import { Card, CardContent } from "@/components/ui/card"

export function About() {
  return (
    <section id="quienes-somos" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Quiénes Somos</h2>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-lg text-gray-700 leading-relaxed">
              Opera Soluciones es una empresa consolidada en el ámbito de mantenimiento, logística y construcción,
              comprometida con la excelencia y la profesionalidad en cada uno de nuestros proyectos. Nuestro equipo
              multidisciplinario está formado por profesionales con amplia experiencia y formación, lo que nos permite
              abordar los desafíos de nuestros clientes con rigor y creatividad.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed">
              En Opera Soluciones, valoramos la confianza, la transparencia y la colaboración como pilares fundamentales
              de nuestra relación con los clientes y la comunidad, trabajando constantemente para transformar cada
              proyecto en una oportunidad de mejora y desarrollo.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed">
              Nuestro equipo de profesionales altamente calificados trabaja incansablemente para ofrecer servicios de
              calidad, adaptados a las necesidades específicas de cada proyecto. En Opera Soluciones, creemos en el
              poder de la tecnología para transformar negocios y mejorar vidas.
            </p>
          </div>

          <div className="text-center">
            <Card className="card-hover">
              <CardContent className="p-6">
                <img
                  src="/placeholder.svg?height=400&width=400"
                  alt="Equipo de Opera Soluciones"
                  className="w-full h-80 object-cover rounded-lg mb-4"
                />
                <h3 className="text-xl font-semibold text-gray-900">Nuestro Equipo</h3>
                <p className="text-gray-600 mt-2">Profesionales comprometidos con la excelencia</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
