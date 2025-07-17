import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Textarea } from './components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import { Slider } from './components/ui/slider'
import { Label } from './components/ui/label'
import { Progress } from './components/ui/progress'
import { Separator } from './components/ui/separator'
import { Badge } from './components/ui/badge'
import { useToast } from './hooks/use-toast'
import { Toaster } from './components/ui/toaster'
import { 
  Play, 
  Pause, 
  Download, 
  Volume2, 
  Mic, 
  Loader2, 
  AudioWaveform,
  Settings,
  History,
  Sparkles
} from 'lucide-react'

interface AudioGeneration {
  id: string
  text: string
  voice: string
  speed: number
  audioUrl: string
  createdAt: Date
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [voice, setVoice] = useState('nova')
  const [speed, setSpeed] = useState([1])
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentAudio, setCurrentAudio] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const [generations, setGenerations] = useState<AudioGeneration[]>([])
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  // Voice options
  const voices = [
    { value: 'nova', label: 'Nova (Female)', accent: 'American' },
    { value: 'alloy', label: 'Alloy (Neutral)', accent: 'American' },
    { value: 'echo', label: 'Echo (Male)', accent: 'American' },
    { value: 'fable', label: 'Fable (British)', accent: 'British' },
    { value: 'onyx', label: 'Onyx (Deep Male)', accent: 'American' },
    { value: 'shimmer', label: 'Shimmer (Soft Female)', accent: 'American' }
  ]

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const generateSpeech = async () => {
    if (!text.trim()) {
      toast({
        title: "Please enter some text",
        description: "You need to provide text to convert to speech.",
        variant: "destructive"
      })
      return
    }

    if (text.length > 100000) {
      toast({
        title: "Text too long",
        description: "Please keep your text under 100,000 characters.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90))
    }, 200)

    try {
      const result = await blink.ai.generateSpeech({
        text: text.trim(),
        voice: voice as any,
        speed: speed[0]
      })

      setProgress(100)
      setCurrentAudio(result.url)
      
      // Add to generations history
      const newGeneration: AudioGeneration = {
        id: Date.now().toString(),
        text: text.trim(),
        voice,
        speed: speed[0],
        audioUrl: result.url,
        createdAt: new Date()
      }
      
      setGenerations(prev => [newGeneration, ...prev.slice(0, 9)]) // Keep last 10

      toast({
        title: "Speech generated successfully!",
        description: "Your audio is ready to play.",
      })

    } catch (error) {
      console.error('Speech generation failed:', error)
      toast({
        title: "Generation failed",
        description: "There was an error generating your speech. Please try again.",
        variant: "destructive"
      })
    } finally {
      clearInterval(progressInterval)
      setIsGenerating(false)
      setProgress(0)
    }
  }

  const playAudio = (url: string) => {
    if (audioElement) {
      audioElement.pause()
    }

    const audio = new Audio(url)
    setAudioElement(audio)
    
    audio.onplay = () => setIsPlaying(true)
    audio.onpause = () => setIsPlaying(false)
    audio.onended = () => setIsPlaying(false)
    
    audio.play()
  }

  const pauseAudio = () => {
    if (audioElement) {
      audioElement.pause()
    }
  }

  const downloadAudio = (url: string, filename?: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `speech-${Date.now()}.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          <span className="text-slate-600">Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Mic className="h-6 w-6 text-indigo-600" />
            </div>
            <CardTitle>Welcome to AI Text to Speech</CardTitle>
            <p className="text-slate-600">Please sign in to start converting text to speech</p>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => blink.auth.login()} 
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI Text to Speech
            </h1>
          </div>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Transform your text into natural-sounding speech with AI-powered voice synthesis. 
            Choose from multiple voices and customize speed to create the perfect audio.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Input Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Text Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mic className="h-5 w-5 text-indigo-600" />
                  <span>Enter Your Text</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Textarea
                    placeholder="Type or paste your text here... (up to 100,000 characters)"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-[120px] resize-none"
                    maxLength={100000}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-slate-500">
                    {text.length.toLocaleString()}/100,000
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Voice Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-indigo-600" />
                  <span>Voice Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Voice</Label>
                    <Select value={voice} onValueChange={setVoice}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {voices.map((v) => (
                          <SelectItem key={v.value} value={v.value}>
                            <div className="flex items-center justify-between w-full">
                              <span>{v.label}</span>
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {v.accent}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Speed: {speed[0]}x</Label>
                    <Slider
                      value={speed}
                      onValueChange={setSpeed}
                      min={0.25}
                      max={4}
                      step={0.25}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>0.25x</span>
                      <span>4x</span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={generateSpeech}
                  disabled={isGenerating || !text.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-12"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Speech...
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4 mr-2" />
                      Generate Speech
                    </>
                  )}
                </Button>

                {isGenerating && (
                  <div className="space-y-2">
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-slate-600 text-center">
                      Processing your text...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audio Player */}
            {currentAudio && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AudioWaveform className="h-5 w-5 text-indigo-600" />
                    <span>Generated Audio</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={() => isPlaying ? pauseAudio() : playAudio(currentAudio)}
                      variant="outline"
                      size="lg"
                      className="flex-shrink-0"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </Button>
                    
                    <div className="flex-1 bg-slate-100 rounded-lg h-12 flex items-center justify-center">
                      <div className="flex items-center space-x-1">
                        {[...Array(20)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 bg-indigo-600 rounded-full transition-all duration-300 ${
                              isPlaying ? 'animate-pulse' : ''
                            }`}
                            style={{
                              height: `${Math.random() * 20 + 10}px`,
                              animationDelay: `${i * 0.1}s`
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={() => downloadAudio(currentAudio)}
                      variant="outline"
                      size="lg"
                      className="flex-shrink-0"
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* History Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="h-5 w-5 text-indigo-600" />
                  <span>Recent Generations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generations.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">
                    No generations yet. Create your first speech!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {generations.map((gen) => (
                      <div key={gen.id} className="border rounded-lg p-3 space-y-2">
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {gen.text}
                        </p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{voices.find(v => v.value === gen.voice)?.label}</span>
                          <span>{gen.speed}x</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => playAudio(gen.audioUrl)}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Play
                          </Button>
                          <Button
                            onClick={() => downloadAudio(gen.audioUrl, `speech-${gen.id}.mp3`)}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                        <Separator />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}

export default App