import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, User, Calendar, Upload } from "lucide-react"

export function EmployeeDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi Panel</h1>
        <p className="text-gray-600 mt-2">Gestiona tu perfil, documentos y capacitaciones</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Mi Perfil
            </CardTitle>
            <CardDescription>Actualiza tu información personal</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Ver Perfil</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Mis Documentos
            </CardTitle>
            <CardDescription>Gestiona tus documentos personales</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Ver Documentos</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Capacitaciones
            </CardTitle>
            <CardDescription>Revisa tus capacitaciones programadas</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Ver Capacitaciones</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado del Contrato</CardTitle>
            <CardDescription>Información sobre tu contrato actual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Estado:</span>
              <span className="text-sm text-green-600 font-medium">Activo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Fecha de ingreso:</span>
              <span className="text-sm">01/01/2024</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Tiempo restante:</span>
              <span className="text-sm">8 meses, 15 días</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Tareas frecuentes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <Upload className="h-4 w-4 mr-2" />
              Subir Documento
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <FileText className="h-4 w-4 mr-2" />
              Solicitar Certificado
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <Calendar className="h-4 w-4 mr-2" />
              Agendar Cita
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
