"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Mic,
  MicOff,
  Send,
  Clock,
  Sun,
  Moon,
  Volume2,
  Search,
  MoreHorizontal,
  Play,
  Pause,
  MessageSquare,
  FileText, 
} from "lucide-react"

interface ReportSystemProps {
  user: string
  shift: "diurno" | "nocturno" | ""
  onBack: () => void
}

interface ChatMessage {
  id: string
  type: "user" | "system"
  content: string
  timestamp: Date
  isAudio?: boolean
  audioBlob?: Blob
  audioUrl?: string
  duration?: string
  messageType?: "reporte" | "evidencia" | "comunicacion"
}

// Componente para visualización de frecuencia de audio
const AudioWaveform = ({ isPlaying, duration = "0:00" }: { isPlaying: boolean; duration?: string }) => {
  const bars = Array.from({ length: 12 }, (_, i) => Math.random() * 60 + 20) // Menos barras y altura más baja
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {bars.map((height, index) => (
          <div
            key={index}
            className={`w-0.5 bg-white rounded-full transition-all duration-300 ${
              isPlaying ? 'animate-pulse' : ''
            }`}
            style={{ 
              height: `${height}%`,
              animationDelay: `${index * 0.1}s`
            }}
          />
        ))}
      </div>
      <span className="text-xs text-white/70 font-mono ml-2">{duration}</span>
    </div>
  )
}

export default function ReportSystem({ user, shift, onBack }: ReportSystemProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Mensaje inicial del sistema
  useEffect(() => {
    const today = new Date()
    const formattedDate = today.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    const initialMessage: ChatMessage = {
      id: "1",
      type: "system",
      content: `${formattedDate} - Turno ${shift}`,
      timestamp: new Date(),
      messageType: "comunicacion"
    }

    // Datos de ejemplo con diferentes fechas
    const exampleMessages: ChatMessage[] = [
      // 1 de agosto de 2025
      {
        id: "2",
        type: "user",
        content: "Reporte de seguridad - Área A",
        timestamp: new Date('2025-08-01T08:30:00'),
        messageType: "reporte"
      },
      {
        id: "3",
        type: "user",
        content: "Audio de reporte",
        timestamp: new Date('2025-08-01T10:15:00'),
        isAudio: true,
        audioUrl: "#",
        duration: "2:34",
        messageType: "reporte"
      },
      {
        id: "4",
        type: "user",
        content: "Audio de reporte",
        timestamp: new Date('2025-08-01T12:45:00'),
        isAudio: true,
        audioUrl: "#",
        duration: "1:52",
        messageType: "reporte"
      },
      {
        id: "5",
        type: "user",
        content: "Audio de reporte",
        timestamp: new Date('2025-08-01T15:20:00'),
        isAudio: true,
        audioUrl: "#",
        duration: "3:15",
        messageType: "reporte"
      },
      {
        id: "6",
        type: "user",
        content: "Audio de reporte",
        timestamp: new Date('2025-08-01T18:00:00'),
        isAudio: true,
        audioUrl: "#",
        duration: "2:08",
        messageType: "reporte"
      },

      // 3 de agosto de 2025
      {
        id: "7",
        type: "user",
        content: "Reporte de vigilancia - Área B",
        timestamp: new Date('2025-08-03T09:00:00'),
        messageType: "reporte"
      },
      {
        id: "8",
        type: "user",
        content: "Audio de reporte",
        timestamp: new Date('2025-08-03T11:30:00'),
        isAudio: true,
        audioUrl: "#",
        duration: "1:45",
        messageType: "reporte"
      },
      {
        id: "9",
        type: "user",
        content: "Audio de reporte",
        timestamp: new Date('2025-08-03T14:15:00'),
        isAudio: true,
        audioUrl: "#",
        duration: "2:22",
        messageType: "reporte"
      },
      {
        id: "10",
        type: "user",
        content: "Audio de reporte",
        timestamp: new Date('2025-08-03T16:45:00'),
        isAudio: true,
        audioUrl: "#",
        duration: "1:58",
        messageType: "reporte"
      },
      {
        id: "11",
        type: "user",
        content: "Audio de reporte",
        timestamp: new Date('2025-08-03T19:30:00'),
        isAudio: true,
        audioUrl: "#",
        duration: "2:41",
        messageType: "reporte"
      },

      // 5 de agosto de 2025
      {
        id: "12",
        type: "user",
        content: "Reporte de patrullaje - Área C",
        timestamp: new Date('2025-08-05T08:45:00'),
        messageType: "reporte"
      },
      {
        id: "13",
        type: "user",
        content: "Audio de reporte",
        timestamp: new Date('2025-08-05T10:30:00'),
        isAudio: true,
        audioUrl: "#",
        duration: "2:15",
        messageType: "reporte"
      },
      {
        id: "14",
        type: "user",
        content: "Audio de reporte",
        timestamp: new Date('2025-08-05T13:20:00'),
        isAudio: true,
        audioUrl: "#",
        duration: "1:33",
        messageType: "reporte"
      },
      {
        id: "15",
        type: "user",
        content: "Audio de reporte",
        timestamp: new Date('2025-08-05T15:55:00'),
        isAudio: true,
        audioUrl: "#",
        duration: "3:02",
        messageType: "reporte"
      },
      {
        id: "16",
        type: "user",
        content: "Audio de reporte",
        timestamp: new Date('2025-08-05T18:40:00'),
        isAudio: true,
        audioUrl: "#",
        duration: "2:47",
        messageType: "reporte"
      }
    ]

    setMessages([initialMessage, ...exampleMessages])
  }, [shift])

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Timer para grabación
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        setRecordingDuration(0)
      }
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [isRecording])

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
        
        // Calcular duración real del audio
        const duration = formatDuration(recordingDuration)
        
        // Agregar mensaje de audio del usuario
        const audioMessage: ChatMessage = {
          id: Date.now().toString(),
          type: "user",
          content: "Reporte de voz",
          timestamp: new Date(),
          isAudio: true,
          audioBlob: audioBlob,
          audioUrl: URL.createObjectURL(audioBlob),
          duration: duration,
          messageType: "reporte"
        }
        setMessages(prev => [...prev, audioMessage])
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

  const playAudio = (audioUrl: string) => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
    }

    const audio = new Audio(audioUrl)
    audio.onended = () => setIsPlaying(false)
    audio.onplay = () => setIsPlaying(true)
    audio.onpause = () => setIsPlaying(false)
    
    audio.play()
    setCurrentAudio(audio)
  }

  const pauseAudio = () => {
    if (currentAudio) {
      currentAudio.pause()
      setIsPlaying(false)
    }
  }

  const sendMessage = () => {
    if (!inputMessage.trim()) return

    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
      messageType: "reporte"
    }
    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-ES", { 
      hour: "2-digit", 
      minute: "2-digit" 
    })
  }

  const formatDuration = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getMessageTypeIcon = (messageType?: string) => {
    switch (messageType) {
      case "reporte":
        return <FileText className="w-4 h-4" />
      case "evidencia":
        return <MessageSquare className="w-4 h-4" />
      case "comunicacion":
        return <Clock className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  // Agrupar mensajes por fecha
  const groupMessagesByDate = () => {
    const groups: { date: string; messages: ChatMessage[] }[] = []
    
    messages.slice(1).forEach((message) => {
      const messageDate = formatDate(message.timestamp)
      const existingGroup = groups.find(group => group.date === messageDate)
      
      if (existingGroup) {
        existingGroup.messages.push(message)
      } else {
        groups.push({
          date: messageDate,
          messages: [message]
        })
      }
    })
    
    return groups
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-zinc-900 border-b border-zinc-800 p-4 flex items-center gap-3">
          <Button 
            onClick={onBack} 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-zinc-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
              {shift === "diurno" ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </div>
            <div>
              <h1 className="font-semibold text-white">Reportes de Comunicación</h1>
              <p className="text-xs text-zinc-400">{user}</p>
            </div>
          </div>
          
          <Button variant="ghost" size="icon" className="text-white hover:bg-zinc-800">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-black">
          {groupMessagesByDate().map((group, groupIndex) => (
            <div key={group.date}>
              {/* Fecha centrada */}
              <div className="flex justify-center mb-6">
                <div className="text-xs text-zinc-500 text-center">
                  {group.date}
                </div>
              </div>
              
              {/* Mensajes de esa fecha */}
              <div className="space-y-4">
                {group.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-sm lg:max-w-lg px-4 py-3 rounded-2xl ${
                        message.type === "user"
                          ? "bg-zinc-800 text-white border border-zinc-700"
                          : "bg-zinc-900 text-white border border-zinc-700"
                      }`}
                    >
                      {message.isAudio ? (
                        <div className="flex items-center gap-3 py-1 w-full">
                          <div className="w-6 h-6 bg-zinc-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <Volume2 className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <AudioWaveform isPlaying={isPlaying} duration={message.duration} />
                          </div>
                          <Button
                            onClick={() => isPlaying ? pauseAudio() : playAudio(message.audioUrl!)}
                            variant="ghost"
                            size="sm"
                            className="w-6 h-6 p-0 bg-zinc-700 hover:bg-zinc-600 flex-shrink-0"
                          >
                            {isPlaying ? (
                              <Pause className="w-3 h-3 text-white" />
                            ) : (
                              <Play className="w-3 h-3 text-white" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          {message.type === "system" && (
                            <div className="mt-1">
                              {getMessageTypeIcon(message.messageType)}
                            </div>
                          )}
                          <p className="text-sm text-white">{message.content}</p>
                        </div>
                      )}
                      <p className="text-xs mt-2 text-zinc-400">
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="px-4 py-2 bg-red-900/20 border-t border-red-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-400">Grabando...</span>
              </div>
              <span className="text-sm text-red-400 font-mono">
                {formatDuration(recordingDuration)}
              </span>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu reporte de comunicación..."
                className="pl-10 pr-4 py-3 resize-none bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400 focus:border-zinc-600 focus:ring-zinc-600"
                rows={1}
              />
            </div>
            
            {/* Botón de envío */}
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim()}
              className="w-12 h-12 rounded-full bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5 text-white" />
            </Button>
            
            {/* Botón de grabación */}
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-12 h-12 rounded-full ${
                isRecording 
                  ? "bg-red-600 hover:bg-red-700 animate-pulse" 
                  : "bg-zinc-700 hover:bg-zinc-600"
              } text-white`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
