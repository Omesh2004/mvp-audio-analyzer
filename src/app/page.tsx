import AudioUploader from "./components/audio-uploaded"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-center">Audio Upload</h1>
        <AudioUploader />
      </div>
    </main>
  )
}

