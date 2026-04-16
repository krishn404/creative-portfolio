"use client"

import { useState } from "react"
import StandaloneCDPlayer from "@/components/standalone-cd-player"

export default function CDPlayerPage() {
  const [track, setTrack] = useState({
    title: "",
    artist: "",
    albumArt: "",
    durationMs: 180000, // 3 minutes default
  })
  const [isPlaying, setIsPlaying] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // You can add validation here
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-white mb-6">
            CD Player Generator
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Track Title
              </label>
              <input
                type="text"
                value={track.title}
                onChange={(e) => setTrack({ ...track, title: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter track title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Artist Name
              </label>
              <input
                type="text"
                value={track.artist}
                onChange={(e) => setTrack({ ...track, artist: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter artist name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Album Art URL
              </label>
              <input
                type="url"
                value={track.albumArt}
                onChange={(e) => setTrack({ ...track, albumArt: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/album-art.jpg"
              />
              <p className="text-xs text-gray-400 mt-1">
                Paste a direct image URL (must be publicly accessible)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={track.durationMs / 60000}
                onChange={(e) => setTrack({ ...track, durationMs: parseFloat(e.target.value) * 60000 })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="3"
                min="0.5"
                step="0.5"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTrack({
                    title: "",
                    artist: "",
                    albumArt: "",
                    durationMs: 180000,
                  })
                  setIsPlaying(false)
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* CD Player Preview */}
        <div className="flex items-center justify-center">
          {track.title && track.artist ? (
            <StandaloneCDPlayer
              track={track}
              isPlaying={isPlaying}
              onPlayPause={setIsPlaying}
            />
          ) : (
            <div className="text-center text-gray-500">
              <p>Fill in the form to see the CD player</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

