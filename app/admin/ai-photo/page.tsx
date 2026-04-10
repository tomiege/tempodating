'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const PRESETS = [
  {
    label: 'Date at Table (Male)',
    referenceImage: 'https://photolike.s3.us-east-2.amazonaws.com/images/24150/708LSsLV42kfQnwNnD7NM_IvvVoqq2.png',
    prompt: "There are 6 reference images of the target. put the target at the table, holding a glass as if on a date. Keep the target's body type, hair length and style but wearing a stylish black sweater. Sharpen their jawline, whiten their teeth and perfect their posture. The target should be looking directly at the camera, confident, relaxed, smiling. No rings on finger.",
  },
  {
    label: 'Cafe Date (Female)',
    referenceImage: 'https://i.pinimg.com/1200x/36/ec/74/36ec74631e56c6c344c52065687504ca.jpg',
    prompt: "Using the attached 6 reference images, place the subject at a cafe table. Maintain the subject's exact body type, hair length, and signature hairstyle, but style them in a chic, slim-fitting black sweater with a flattering neckline. Subtle enhancements: sharpen the jawline for a delicate yet defined look, ensure teeth are bright and white, and adjust posture to be upright, poised, and relaxed. The subject should be looking directly into the camera with an expression that is confident, warm, and invitingly feminine. Realistic, high-end photography, soft bokeh cafe background. No rings on finger.",
  },
]

export default function AdminAiPhotoPage() {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [prompt, setPrompt] = useState(PRESETS[0].prompt)
  const [referenceImage, setReferenceImage] = useState(PRESETS[0].referenceImage)
  const [dragging, setDragging] = useState(false)
  const [bucketFolder, setBucketFolder] = useState<'male' | 'female'>('male')
  const [bucketImages, setBucketImages] = useState<{ name: string; url: string }[]>([])
  const [loadingBucket, setLoadingBucket] = useState(false)
  const { toast } = useToast()

  const fetchBucketImages = useCallback(async (folder: 'male' | 'female') => {
    setLoadingBucket(true)
    try {
      const res = await fetch(`/api/ai-photos/references?folder=${folder}`)
      const data = await res.json()
      if (res.ok) {
        setBucketImages(data.images ?? [])
      } else {
        toast({ title: 'Error loading bucket images', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load bucket images', variant: 'destructive' })
    } finally {
      setLoadingBucket(false)
    }
  }, [toast])

  useEffect(() => {
    fetchBucketImages(bucketFolder)
  }, [bucketFolder, fetchBucketImages])

  const handlePresetChange = (index: number) => {
    setSelectedPreset(index)
    setPrompt(PRESETS[index].prompt)
    setReferenceImage(PRESETS[index].referenceImage)
  }

  const addFiles = (incoming: File[]) => {
    const validFiles: File[] = []
    for (const file of incoming) {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Skipped non-image', description: `"${file.name}" is not an image`, variant: 'destructive' })
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'File too large', description: `"${file.name}" exceeds 10MB`, variant: 'destructive' })
        continue
      }
      validFiles.push(file)
    }

    const totalAllowed = 6 - files.length
    const toAdd = validFiles.slice(0, totalAllowed)
    if (validFiles.length > totalAllowed) {
      toast({ title: 'Too many images', description: `Only ${totalAllowed} more slot(s) available. ${validFiles.length - totalAllowed} image(s) skipped.`, variant: 'destructive' })
    }

    if (toAdd.length === 0) return

    // Generate previews for the new files
    const newPreviews: string[] = []
    let loaded = 0
    toAdd.forEach((file, i) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews[i] = e.target?.result as string
        loaded++
        if (loaded === toAdd.length) {
          setFiles((prev) => [...prev, ...toAdd])
          setPreviews((prev) => [...prev, ...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files))
      e.target.value = '' // reset so same files can be re-selected
    }
  }

  const uploadToSupabase = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }

    const data = await response.json()
    return data.url
  }

  const handleGenerate = async () => {
    if (files.length !== 6) {
      toast({ title: 'Missing images', description: `Please upload exactly 6 images (${files.length}/6 selected)`, variant: 'destructive' })
      return
    }

    try {
      setUploading(true)
      toast({ title: 'Uploading images...', description: 'Uploading 6 images to storage' })

      // Upload all 6 images to Supabase
      const imageUrls = await Promise.all(files.map(uploadToSupabase))

      setUploading(false)
      setGenerating(true)
      toast({ title: 'Generating AI photo...', description: 'This may take a minute' })

      // Send to fal.ai via our API
      const response = await fetch('/api/ai-photos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrls, prompt, referenceImageUrl: referenceImage, adminBypass: true }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      setResult(data.result)
      toast({ title: 'Success!', description: 'AI photo generated successfully' })
    } catch (error) {
      console.error('Generation error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      setGenerating(false)
    }
  }

  const uploadedCount = files.length

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">AI Photo Generator</h1>
        <p className="text-gray-400 mb-8">
          Upload 6 reference images, then generate an AI-styled photo using Fal.ai Nano Banana 2.
        </p>

        {/* Preset Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Preset</label>
          <div className="flex gap-3">
            {PRESETS.map((preset, i) => (
              <button
                key={i}
                onClick={() => handlePresetChange(i)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPreset === i
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reference Image Preview */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Reference Image (appended as 7th image)</label>
          <Card className="bg-gray-800 border-gray-700 p-3 inline-block">
            <img
              src={referenceImage}
              alt="Reference"
              className="h-48 w-auto rounded object-cover"
            />
            <p className="text-xs text-gray-500 mt-2 max-w-xs truncate">{referenceImage}</p>
          </Card>
        </div>

        {/* Bucket Reference Photos */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Or pick from Supabase bucket (ai-photos)</label>
          <div className="flex gap-3 mb-3">
            {(['male', 'female'] as const).map((folder) => (
              <button
                key={folder}
                onClick={() => setBucketFolder(folder)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  bucketFolder === folder
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {folder}
              </button>
            ))}
          </div>
          {loadingBucket ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : bucketImages.length === 0 ? (
            <p className="text-gray-500 text-sm">No images found in {bucketFolder}/ folder</p>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-64 overflow-y-auto">
              {bucketImages.map((img) => (
                <button
                  key={img.name}
                  onClick={() => setReferenceImage(img.url)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    referenceImage === img.url
                      ? 'border-purple-500 ring-2 ring-purple-500/50'
                      : 'border-transparent hover:border-gray-600'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editable Prompt */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-y"
          />
        </div>

        {/* Drag & Drop Upload Zone */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Reference Photos ({uploadedCount}/6)</label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragging
                ? 'border-purple-500 bg-purple-950/30'
                : 'border-gray-700 hover:border-gray-600'
            } ${uploadedCount >= 6 ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
          >
            <label className="flex flex-col items-center gap-2 cursor-pointer">
              <Upload className="w-10 h-10 text-gray-500" />
              <span className="text-gray-400 text-sm">
                Drag & drop images here, or <span className="text-purple-400 underline">browse</span>
              </span>
              <span className="text-gray-600 text-xs">Select up to {6 - uploadedCount} more image(s)</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleInputChange}
                disabled={uploadedCount >= 6}
              />
            </label>
          </div>
        </div>

        {/* Image Preview Grid */}
        {uploadedCount > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
            {previews.map((preview, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden group bg-gray-800">
                <img
                  src={preview}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1 rounded">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Status & Generate Button */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-gray-400">
            {uploadedCount}/6 images selected
          </p>
          <Button
            onClick={handleGenerate}
            disabled={uploadedCount !== 6 || uploading || generating}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8"
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4 mr-2" />
                Generate AI Photo
              </>
            )}
          </Button>
        </div>

        {/* Result */}
        {result && (
          <Card className="bg-gray-800 border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4">Generated Result</h2>
            {result.images?.map((img: { url: string; content_type: string }, i: number) => (
              <div key={i} className="mb-4">
                <img
                  src={img.url}
                  alt={`Generated ${i + 1}`}
                  className="w-full rounded-lg"
                />
                <a
                  href={img.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 text-sm mt-2 inline-block"
                >
                  Open full size →
                </a>
              </div>
            ))}
            {!result.images && (
              <pre className="text-sm text-gray-300 overflow-auto max-h-96 bg-gray-900 p-4 rounded">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
