import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Shield, TrendingUp } from "lucide-react"

export function AdminDashboard() {
  const stats = [
    {
      title: "Total Usuarios",
      value: "24",
      description: "Usuarios activos en el sistema",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Documentos",
      value: "156",
      description: "Documentos gestionados",
      icon: FileText,
      color: "text-green-600",
    },
    {
      title: "Reportes SST",
      value: "8",
      description: "Reportes pendientes",
      icon: Shield,
      color: "text-orange-600",
    },
    {
      title: "Actividad",
      value: "92%",
      description: "Nivel de actividad del sistema",
      icon: TrendingUp,
      color: "text-purple-600",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
        <p className="text-gray-600 mt-2">Gestiona usuarios, reportes y configuraciones del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
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
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Gestiona el sistema de manera eficiente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <a
                href="/dashboard/users"
                className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Users className="h-5 w-5 text-blue-600 mr-3" />
                <span className="font-medium">Gestionar Usuarios</span>
              </a>
              <a
                href="/dashboard/reports"
                className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <FileText className="h-5 w-5 text-green-600 mr-3" />
                <span className="font-medium">Ver Reportes</span>
              </a>
              <a
                href="/dashboard/settings"
                className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Shield className="h-5 w-5 text-purple-600 mr-3" />
                <span className="font-medium">Configuración</span>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas acciones en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Nuevo usuario registrado</p>
                  <p className="text-xs text-gray-500">Hace 2 horas</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Documento subido</p>
                  <p className="text-xs text-gray-500">Hace 4 horas</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Reporte SST generado</p>
                  <p className="text-xs text-gray-500">Hace 1 día</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
