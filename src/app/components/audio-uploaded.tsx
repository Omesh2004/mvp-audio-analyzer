"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Pause, Upload, FileAudio } from "lucide-react"

export default function AudioUploader() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("audio/")) {
      setAudioFile(file)
      // Revoke previous URL to avoid memory leaks
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      const url = URL.createObjectURL(file)
      setAudioUrl(url)
      setIsPlaying(false)
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

  const handleUpload = async () => {
    if (!audioFile) return

    setIsUploading(true)
    try {
      // Create a FormData instance
      const formData = new FormData()
      formData.append("audio", audioFile)

      // Send the file to your server endpoint
      const response = await fetch("/api/upload-audio", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        alert("Audio uploaded successfully!")
      } else {
        alert("Failed to upload audio")
      }
    } catch (error) {
      console.error("Error uploading audio:", error)
      alert("Error uploading audio")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Select Audio File</CardTitle>
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
              <p className="text-xs text-gray-500 dark:text-gray-400">MP3, WAV, OGG, etc.</p>
            </div>
            <input id="audio-file" type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>

        {audioUrl && (
          <div className="space-y-2">
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
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleUpload} disabled={!audioFile || isUploading}>
          {isUploading ? (
            "Uploading..."
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" /> Upload Audio
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

