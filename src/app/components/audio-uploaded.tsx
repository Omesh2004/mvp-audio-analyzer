"use client"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Pause, Upload, FileAudio, Image, Info, Music, Download } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const APIURL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"

export default function Index() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(null)
  const [isGeneratedPlaying, setIsGeneratedPlaying] = useState(false)
  const [generationPrompt, setGenerationPrompt] = useState("")
  const [visualizations, setVisualizations] = useState<{
    waveform: string | null
    harmonic: string | null
    genre: string | null
  }>({ waveform: null, harmonic: null, genre: null })
  const [selectedImage, setSelectedImage] = useState<{url: string, title: string} | null>(null)
  const [detailedAnalysis, setDetailedAnalysis] = useState<{
    genre: string,
    instrument: string,
    key_tempo: number
  } | null>(null)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const generatedAudioRef = useRef<HTMLAudioElement>(null)
  
  useEffect(() => {
    // Update progress bar during audio playback
    const updateProgressBar = () => {
      if (audioRef.current) {
        const progressBar = document.getElementById('audio-progress');
        if (progressBar) {
          const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          progressBar.style.width = `${progress}%`;
        }
      }
    };
    
    // Update progress bar for generated audio
    const updateGeneratedProgressBar = () => {
      if (generatedAudioRef.current) {
        const progressBar = document.getElementById('generated-audio-progress');
        if (progressBar) {
          const progress = (generatedAudioRef.current.currentTime / generatedAudioRef.current.duration) * 100;
          progressBar.style.width = `${progress}%`;
        }
      }
    };
    
    const audioElement = audioRef.current;
    const generatedAudioElement = generatedAudioRef.current;
    
    if (audioElement) {
      audioElement.addEventListener('timeupdate', updateProgressBar);
    }
    
    if (generatedAudioElement) {
      generatedAudioElement.addEventListener('timeupdate', updateGeneratedProgressBar);
    }
    
    return () => {
      if (audioElement) {
        audioElement.removeEventListener('timeupdate', updateProgressBar);
      }
      if (generatedAudioElement) {
        generatedAudioElement.removeEventListener('timeupdate', updateGeneratedProgressBar);
      }
    };
  }, [audioUrl, generatedMusicUrl]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("audio/")) {
      setAudioFile(file)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      setAudioUrl(URL.createObjectURL(file))
      setIsPlaying(false)
      setVisualizations({ waveform: null, harmonic: null, genre: null })
      setDetailedAnalysis(null)
      setGeneratedMusicUrl(null)
      setIsGeneratedPlaying(false)
    }
  }
  
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }
  
  const toggleGeneratedPlayPause = () => {
    if (generatedAudioRef.current) {
      if (isGeneratedPlaying) {
        generatedAudioRef.current.pause()
      } else {
        generatedAudioRef.current.play()
      }
      setIsGeneratedPlaying(!isGeneratedPlaying)
    }
  }
  
  const handleUpload = async () => {
    if (!audioFile) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("audio", audioFile)
      const response = await fetch(`${APIURL}/uploadnew`, {
        method: "POST",
        body: formData,
      })
      if (response.ok) {
        toast.success("Audio uploaded successfully!")
      } else {
        toast.error("Failed to upload audio")
      }
    } catch (error) {
      console.error("Error uploading audio:", error)
      toast.error("Error uploading audio")
    } finally {
      setIsUploading(false)
    }
  }
  
  const handleProcessAudio = async () => {
    if (!audioFile) return
    setIsProcessing(true)
    try {
      const response = await fetch(`${APIURL}/process-audio`, {
        method: "POST",
      })
      const data = await response.json()
      console.log("Process Audio Response:", data)
      if (response.ok) {
        setVisualizations({
          waveform: `${APIURL}${data.waveform_url}`,
          harmonic: `${APIURL}${data.harmonic_url}`,
          genre: data.genre
        })
        toast.success("Audio processed successfully!")
      } else {
        toast.error("Failed to process audio")
      }
    } catch (error) {
      console.error("Error processing audio:", error)
      toast.error("Error processing audio")
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleAnalyzeMusic = async () => {
    if (!audioFile) return
    setIsAnalyzing(true)
    try {
      const response = await fetch(`${APIURL}/analyze-music`, {
        method: "POST",
      })
      const data = await response.json()
      console.log("Music Analysis Response:", data)
      if (response.ok && data.status === 'success') {
        setDetailedAnalysis(data.analyses)
        // Create a prompt based on the analysis
        const genre = data.analyses.genre || "unknown genre";
        let instruments = "various instruments";
        if (data.analyses.instrument) {
          // Get top instruments (those with probability > 0.5)
          const topInstruments = Object.entries(data.analyses.instrument)
            .filter(([_, prob]) => typeof prob === 'number' && prob > 0.5)
            .map(([inst, _]) => inst);
          if (topInstruments.length > 0) {
            instruments = topInstruments.join(", ");
          }
        }
        let tempo = "moderate tempo";
        let key = "";
        if (data.analyses.key_tempo) {
          if (data.analyses.key_tempo.tempo) {
            const tempoValue = parseFloat(data.analyses.key_tempo.tempo);
            if (tempoValue < 80) tempo = "slow tempo";
            else if (tempoValue > 120) tempo = "fast tempo";
            else tempo = "moderate tempo";
          }
          if (data.analyses.key_tempo.key) {
            key = `in ${data.analyses.key_tempo.key}`;
          }
        }
        const autoPrompt = `Generate a ${genre} piece with ${instruments} at ${tempo} ${key}`.trim();
        setGenerationPrompt(autoPrompt);
        toast.success("Music analyzed successfully!")
      } else {
        toast.error("Failed to analyze music: " + (data.error || "Unknown error"))
      }
    } catch (error) {
      console.error("Error analyzing music:", error)
      toast.error("Error analyzing music")
    } finally {
      setIsAnalyzing(false)
    }
  }
  
  const handleGenerateMusic = async () => {
    if (!generationPrompt.trim()) {
      toast.error("Please enter a prompt for music generation")
      return
    }
    setIsGenerating(true)
    try {
      const response = await fetch(`${APIURL}/generate-music`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: generationPrompt
        })
      })
      const data = await response.json()
      console.log("Generate Music Response:", data)
      if (response.ok && data.success) {
        // Reset player state
        setIsGeneratedPlaying(false)
        // Set new URL with a timestamp to prevent caching
        setGeneratedMusicUrl(`${APIURL}${data.file_path}?t=${Date.now()}`)
        toast.success("Music generated successfully!")
      } else {
        toast.error("Failed to generate music: " + (data.error || "Unknown error"))
      }
    } catch (error) {
      console.error("Error generating music:", error)
      toast.error("Error generating music")
    } finally {
      setIsGenerating(false)
    }
  }
  
  const handleGenerateFromAnalysis = async () => {
    if (!detailedAnalysis) {
      toast.error("Please analyze the audio first")
      return
    }
    setIsGenerating(true)
    await handleGenerateMusic()
  }
  
  const openImageModal = (url: string | null, title: string) => {
    if (url) {
      setSelectedImage({url, title})
    }
  }
  
  const closeImageModal = () => {
    setSelectedImage(null)
  }
  
  return (
    <>
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Sonic Genesis Studio</h1>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Audio Processing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="audio-file"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 border-gray-300 dark:border-gray-600"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileAudio className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to select</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">MP3, WAV, etc.</p>
                </div>
                <input id="audio-file" type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
            {audioUrl && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{audioFile?.name || "Selected Audio"}</p>
                  <Button variant="outline" size="icon" onClick={togglePlayPause} className="h-8 w-8">
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  className="w-full"
                  controls={false}
                  onEnded={() => setIsPlaying(false)}
                />
                <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                  <div className="bg-primary h-1.5 rounded-full w-0" id="audio-progress"></div>
                </div>
              </div>
            )}
            {visualizations.waveform && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Audio Visualizations</h3>
                  {visualizations.genre && (
                    <p className="text-sm">Predicted Genre: <span className="font-semibold">{visualizations.genre}</span></p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openImageModal(visualizations.waveform, "Waveform Visualization")}
                    >
                      <h4 className="text-sm font-medium mb-2">Waveform</h4>
                      <img
                        src={visualizations.waveform ?? undefined}
                        alt="Waveform visualization"
                        className="rounded-md border w-full h-auto"
                      />
                    </div>
                    <div
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openImageModal(visualizations.harmonic, "Harmonic/Percussive Visualization")}
                    >
                      <h4 className="text-sm font-medium mb-2">Harmonic/Percussive</h4>
                      <img
                        src={visualizations.harmonic ?? undefined}
                        alt="Harmonic percussive visualization"
                        className="rounded-md border w-full h-auto"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {detailedAnalysis && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <h3 className="text-lg font-medium mb-3">Detailed Audio Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Genre Analysis</h4>
                    <p className="text-sm">{detailedAnalysis.genre}</p>
                  </div>
                  {detailedAnalysis.instrument && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Instrument Analysis</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(detailedAnalysis.instrument).map(([instrument, probability]) => (
                          <div key={instrument} className="flex justify-between text-sm">
                            <span>{instrument}</span>
                            <span className="font-medium">{typeof probability === 'number' ? `${(probability * 100).toFixed(1)}%` : String(probability)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {detailedAnalysis.key_tempo && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Key & Tempo Analysis</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(detailedAnalysis.key_tempo).map(([attribute, value]) => (
                          <div key={attribute} className="flex justify-between text-sm">
                            <span>{attribute.replace('_', ' ').charAt(0).toUpperCase() + attribute.replace('_', ' ').slice(1)}</span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={handleGenerateFromAnalysis}
                    disabled={isGenerating}
                    variant="outline"
                    className="w-full mt-2"
                  >
                    {isGenerating ? "Generating..." : (
                      <>
                        <Music className="mr-2 h-4 w-4" /> Generate Similar Music
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <h3 className="text-lg font-medium mb-3">Generate Music</h3>
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <label htmlFor="generation-prompt" className="text-sm font-medium">
                    Enter a prompt for AI music generation
                  </label>
                  <Input
                    id="generation-prompt"
                    placeholder="e.g., 'Upbeat jazz with piano and saxophone'"
                    value={generationPrompt}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGenerationPrompt(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={handleGenerateMusic}
                  disabled={isGenerating || !generationPrompt.trim()}
                  className="w-full"
                >
                  {isGenerating ? "Generating..." : (
                    <>
                      <Music className="mr-2 h-4 w-4" /> Generate Music (10 seconds)
                    </>
                  )}
                </Button>
                {generatedMusicUrl && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Generated Music</h4>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Music based on: {generationPrompt}</p>
                      <Button variant="outline" size="icon" onClick={toggleGeneratedPlayPause} className="h-8 w-8">
                        {isGeneratedPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                    <audio
                      ref={generatedAudioRef}
                      src={generatedMusicUrl}
                      className="w-full hidden"
                      controls={false}
                      onEnded={() => setIsGeneratedPlaying(false)}
                    />
                    <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 mb-3">
                      <div className="bg-green-500 h-1.5 rounded-full w-0" id="generated-audio-progress"></div>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <a
                        href={generatedMusicUrl}
                        download="generated-music.mp3"
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Download className="h-4 w-4 mr-1" /> Download generated audio
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button
              className="w-full"
              onClick={handleUpload}
              disabled={!audioFile || isUploading}
            >
              {isUploading ? "Uploading..." : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Upload Audio
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleProcessAudio}
              disabled={!audioFile || isProcessing}
            >
              {isProcessing ? "Processing..." : (
                <>
                  <Image className="mr-2 h-4 w-4" /> Generate Visualizations
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleAnalyzeMusic}
              disabled={!audioFile || isAnalyzing}
            >
              {isAnalyzing ? "Analyzing..." : (
                <>
                  <Info className="mr-2 h-4 w-4" /> Get More Details
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        {/* Image Modal */}
        <Dialog open={!!selectedImage} onOpenChange={closeImageModal}>
          <DialogContent className="max-w-[90vw] max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{selectedImage?.title}</DialogTitle>
            </DialogHeader>
            <div className="relative h-full w-full flex items-center justify-center">
              {selectedImage && (
                <img
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}