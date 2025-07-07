import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, AlertTriangle, FileText, Users } from "lucide-react"

export function SSTDashboard() {
  const sstStats = [
    {
      title: "Reportes Pendientes",
      value: "5",
      description: "Reportes por revisar",
      icon: AlertTriangle,
      color: "text-orange-600",
    },
    {
      title: "Accidentes del Mes",
      value: "2",
      description: "Incidentes reportados",
      icon: Shield,
      color: "text-red-600",
    },
    {
      title: "Capacitaciones",
      value: "12",
      description: "Programadas este mes",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Documentos SST",
      value: "48",
      description: "Documentos gestionados",
      icon: FileText,
      color: "text-green-600",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Panel SST</h1>
        <p className="text-gray-600 mt-2">Gestión de Seguridad y Salud en el Trabajo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sstStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Reportes Recientes</CardTitle>
            <CardDescription>Últimos reportes de seguridad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Incidente menor - Área 3</p>
                  <p className="text-xs text-gray-500">Hace 2 horas</p>
                </div>
                <Button size="sm" variant="outline">
                  Revisar
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Accidente laboral - Área 1</p>
                  <p className="text-xs text-gray-500">Hace 1 día</p>
                </div>
                <Button size="sm" variant="outline">
                  Revisar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones SST</CardTitle>
            <CardDescription>Herramientas de gestión</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Crear Reporte de Incidente
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Generar Informe Mensual
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Programar Capacitación
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Inspección de Seguridad
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
