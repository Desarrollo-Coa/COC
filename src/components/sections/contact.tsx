"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Phone, Mail, Instagram, MapPin } from "lucide-react"

export function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      nombre: formData.get("nombre"),
      email: formData.get("email"),
      telefono: formData.get("telefono"),
      mensaje: formData.get("mensaje"),
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast({
          title: "Mensaje enviado",
          description: "Nos pondremos en contacto contigo pronto.",
        })
        e.currentTarget.reset()
      } else {
        throw new Error("Error al enviar el mensaje")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactInfo = [
    {
      icon: Phone,
      title: "WhatsApp",
      value: "31554535353",
      href: "https://wa.me/31554535353",
    },
    {
      icon: Mail,
      title: "Correo",
      value: "info@operasoluciones.com",
      href: "mailto:info@operasoluciones.com",
    },
    {
      icon: Instagram,
      title: "Instagram",
      value: "@operasoluciones",
      href: "https://instagram.com/operasoluciones",
    },
    {
      icon: MapPin,
      title: "Ubicación",
      value: "Colombia",
      href: "#",
    },
  ]

  return (
    <section id="contacto" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Contáctanos</h2>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Information */}
          <div>
            <h3 className="text-2xl font-semibold mb-6 text-gray-900">Información de Contacto</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              {contactInfo.map((item, index) => (
                <Card key={index} className="card-hover">
                  <CardContent className="p-6 text-center">
                    <item.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                    <a
                      href={item.href}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      {item.value}
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">Envíanos un Mensaje</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nombre">Nombre completo</Label>
                  <Input id="nombre" name="nombre" required placeholder="Tu nombre completo" />
                </div>

                <div>
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input id="email" name="email" type="email" required placeholder="tu@email.com" />
                </div>

                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input id="telefono" name="telefono" placeholder="Tu número de teléfono" />
                </div>

                <div>
                  <Label htmlFor="mensaje">Mensaje</Label>
                  <Textarea
                    id="mensaje"
                    name="mensaje"
                    required
                    placeholder="Cuéntanos sobre tu proyecto o consulta"
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                  {isSubmitting ? "Enviando..." : "Enviar Mensaje"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
