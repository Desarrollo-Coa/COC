"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Mic,
  MicOff,
  Send,
  CheckCircle,
  Clock,
  Sun,
  Moon,
  MessageSquare,
  Volume2,
  Trash2,
} from "lucide-react"

interface ReportSystemProps {
  user: string
  shift: "diurno" | "nocturno" | ""
  onBack: () => void
}

interface ReportSlot {
  id: string
  time: string
  title: string
  completed: boolean
  message?: string
  audioBlob?: Blob
  timestamp?: string
}

export default function ReportSystem({ user, shift, onBack }: ReportSystemProps) {
  const [selectedReport, setSelectedReport] = useState<ReportSlot | null>(null)
  const [message, setMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [reports, setReports] = useState<ReportSlot[]>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Definir reportes según el turno
  const diurnoReports: Omit<ReportSlot, "completed" | "message" | "audioBlob" | "timestamp">[] = [
    { id: "diurno-1", time: "12:00", title: "Reporte Mediodía" },
    { id: "diurno-2", time: "17:00", title: "Reporte Tarde" },
  ]

  const nocturnoReports: Omit<ReportSlot, "completed" | "message" | "audioBlob" | "timestamp">[] = [
    { id: "nocturno-1", time: "20:00", title: "Reporte Inicio" },
    { id: "nocturno-2", time: "23:00", title: "Reporte Noche" },
    { id: "nocturno-3", time: "02:00", title: "Reporte Madrugada" },
    { id: "nocturno-4", time: "04:00", title: "Reporte Pre-Alba" },
    { id: "nocturno-5", time: "06:00", title: "Reporte Final" },
  ]

  useEffect(() => {
    const baseReports = shift === "diurno" ? diurnoReports : nocturnoReports
    const savedReports = localStorage.getItem(`reports-${shift}`)

    if (savedReports) {
      setReports(JSON.parse(savedReports))
    } else {
      const initialReports = baseReports.map((report) => ({
        ...report,
        completed: false,
      }))
      setReports(initialReports)
    }
  }, [shift])

  const saveReports = (updatedReports: ReportSlot[]) => {
    setReports(updatedReports)
    localStorage.setItem(`reports-${shift}`, JSON.stringify(updatedReports))
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      alert("No se pudo acceder al micrófono")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const playAudio = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      audio.play()
    }
  }

  const deleteAudio = () => {
    setAudioBlob(null)
  }

  const handleQuickReport = (type: "sin-novedad" | "custom") => {
    if (!selectedReport) return

    const reportMessage = type === "sin-novedad" ? "Todo sin novedad. Área segura y sin incidentes." : message

    const updatedReports = reports.map((report) =>
      report.id === selectedReport.id
        ? {
            ...report,
            completed: true,
            message: reportMessage,
            audioBlob: audioBlob || undefined,
            timestamp: new Date().toISOString(),
          }
        : report,
    )

    saveReports(updatedReports)
    setSelectedReport(null)
    setMessage("")
    setAudioBlob(null)
  }

  const openReport = (report: ReportSlot) => {
    setSelectedReport(report)
    setMessage(report.message || "")
    setAudioBlob(report.audioBlob || null)
  }

  if (selectedReport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6 pt-4">
            <Button onClick={() => setSelectedReport(null)} variant="outline" size="icon" className="rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{selectedReport.title}</h1>
              <p className="text-gray-600 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {selectedReport.time}
              </p>
            </div>
          </div>

          {/* Quick Action - Sin Novedad */}
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardContent className="p-4">
              <Button
                onClick={() => handleQuickReport("sin-novedad")}
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12 rounded-xl font-medium"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Todo Sin Novedad
              </Button>
              <p className="text-xs text-green-700 text-center mt-2">Envía reporte automático de área segura</p>
            </CardContent>
          </Card>

          {/* Message Input */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Mensaje Personalizado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escriba su reporte aquí..."
                className="min-h-[100px] resize-none"
              />

              <Button
                onClick={() => handleQuickReport("custom")}
                disabled={!message.trim() && !audioBlob}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl font-medium disabled:opacity-50"
              >
                <Send className="w-5 h-5 mr-2" />
                Enviar Reporte
              </Button>
            </CardContent>
          </Card>

          {/* Audio Recording */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mic className="w-5 h-5 text-purple-600" />
                Grabación de Audio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!audioBlob ? (
                <div className="text-center">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-20 h-20 rounded-full ${
                      isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-purple-600 hover:bg-purple-700"
                    } text-white`}
                  >
                    {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                  </Button>
                  <p className="text-sm text-gray-600 mt-2">
                    {isRecording ? "Grabando... Toque para detener" : "Toque para grabar"}
                  </p>
                </div>
              ) : (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                        <Volume2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Audio grabado</p>
                        <p className="text-sm text-gray-600">Listo para enviar</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={playAudio} variant="outline" size="sm">
                        <Volume2 className="w-4 h-4" />
                      </Button>
                      <Button onClick={deleteAudio} variant="outline" size="sm" className="text-red-600 bg-transparent">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pt-4">
          <Button onClick={onBack} variant="outline" size="icon" className="rounded-full bg-transparent">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes de Comunicación</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {shift === "diurno" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>Turno {shift}</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progreso del turno</span>
              <span className="text-sm text-gray-600">
                {reports.filter((r) => r.completed).length}/{reports.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(reports.filter((r) => r.completed).length / reports.length) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <div className="space-y-4">
          {reports.map((report) => (
            <Card
              key={report.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                report.completed ? "bg-green-50 border-green-200" : "hover:border-blue-300"
              }`}
              onClick={() => openReport(report)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        report.completed ? "bg-green-500" : "bg-gray-100"
                      }`}
                    >
                      {report.completed ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <Clock className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{report.title}</h3>
                      <p className="text-sm text-gray-600">{report.time}</p>
                      {report.completed && report.timestamp && (
                        <p className="text-xs text-green-600">
                          Completado: {new Date(report.timestamp).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={report.completed ? "default" : "secondary"}
                      className={report.completed ? "bg-green-500" : ""}
                    >
                      {report.completed ? "Completado" : "Pendiente"}
                    </Badge>
                    {report.message && (
                      <Badge variant="outline" className="text-xs">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Texto
                      </Badge>
                    )}
                    {report.audioBlob && (
                      <Badge variant="outline" className="text-xs">
                        <Mic className="w-3 h-3 mr-1" />
                        Audio
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        {reports.every((r) => r.completed) && (
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-12 h-12 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900 mb-1">¡Turno Completado!</h3>
              <p className="text-sm text-blue-700">Todos los reportes han sido enviados correctamente</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
