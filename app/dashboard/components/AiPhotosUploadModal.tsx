"use client"

import { useState, useRef, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import {
  Upload,
  X,
  CheckCircle2,
  Camera,
  Loader2,
  Sun,
  Smile,
  User,
  AlertTriangle,
  Glasses,
  Users,
  EyeOff,
  ImageOff,
} from "lucide-react"
import Image from "next/image"
import { downscaleImage } from "@/lib/image-utils"

interface AiPhotosUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmitted?: () => void
}

const MAX_PHOTOS = 20
const MIN_PHOTOS = 8

export default function AiPhotosUploadModal({ isOpen, onClose, onSubmitted }: AiPhotosUploadModalProps) {
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const remaining = MAX_PHOTOS - photos.length
    const toAdd = files.slice(0, remaining)

    if (files.length > remaining) {
      toast({
        title: "Too many photos",
        description: `Only ${remaining} more photo(s) can be added. Maximum is ${MAX_PHOTOS}.`,
        variant: "destructive",
      })
    }

    // Validate and compress each file
    const newPhotos: { file: File; preview: string }[] = []
    for (const file of toAdd) {
      if (!file.type.startsWith("image/")) continue
      try {
        const compressed = await downscaleImage(file, 800)
        const preview = URL.createObjectURL(compressed)
        newPhotos.push({ file: compressed, preview })
      } catch {
        // Use original if compression fails
        const preview = URL.createObjectURL(file)
        newPhotos.push({ file, preview })
      }
    }

    setPhotos((prev) => [...prev, ...newPhotos])

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [photos.length, toast])

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async () => {
    if (photos.length < MIN_PHOTOS) return

    setUploading(true)
    try {
      const formData = new FormData()
      photos.forEach((p) => formData.append("photos", p.file))

      const response = await fetch("/api/ai-photos", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Upload failed")
      }

      setSubmitted(true)
      toast({
        title: "Photos submitted!",
        description: "We'll start training your AI model. You'll receive your photos within 5 working days.",
      })
      onSubmitted?.()
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (!uploading) {
      // Clean up preview URLs
      photos.forEach((p) => URL.revokeObjectURL(p.preview))
      setPhotos([])
      setSubmitted(false)
      onClose()
    }
  }

  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-serif font-semibold">Photos Submitted!</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              We&apos;ve received your {photos.length} photos and will begin training your personalized AI model.
              You&apos;ll receive your AI-generated photos within 5 working days.
            </p>
            <Button onClick={handleClose} className="mt-4">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Upload Your Training Photos</DialogTitle>
          <DialogDescription className="sr-only">Upload photos for AI training</DialogDescription>
        </DialogHeader>

        {/* Steps */}
        <div className="flex items-center gap-3 py-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
            <span className="font-medium">Upload Photos</span>
          </div>
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold">2</div>
            <span className="text-muted-foreground">Train Your AI</span>
          </div>
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold">3</div>
            <span className="text-muted-foreground">Get Results</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          We&apos;ll use these to create your personalized model
        </p>

        {/* Counter + progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{photos.length} / {MAX_PHOTOS} photos</span>
            <span className="text-muted-foreground">Minimum {MIN_PHOTOS} photos</span>
          </div>
          <Progress value={(photos.length / MAX_PHOTOS) * 100} className="h-2" />
        </div>

        {/* Photo grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border group">
              <Image
                src={photo.preview}
                alt={`Training photo ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {photos.length < MAX_PHOTOS && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Add</span>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Guidelines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1.5 text-green-700">
              <CheckCircle2 className="w-4 h-4" />
              What works best
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li className="flex items-start gap-2">
                <Sun className="w-3.5 h-3.5 mt-0.5 text-green-600 flex-shrink-0" />
                Clear, well-lit photos of your face
              </li>
              <li className="flex items-start gap-2">
                <Smile className="w-3.5 h-3.5 mt-0.5 text-green-600 flex-shrink-0" />
                Variety of angles and expressions
              </li>
              <li className="flex items-start gap-2">
                <User className="w-3.5 h-3.5 mt-0.5 text-green-600 flex-shrink-0" />
                Solo shots where you&apos;re the focus
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1.5 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              Please avoid
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li className="flex items-start gap-2">
                <Glasses className="w-3.5 h-3.5 mt-0.5 text-red-500 flex-shrink-0" />
                Hats or sunglasses that obscure face
              </li>
              <li className="flex items-start gap-2">
                <Users className="w-3.5 h-3.5 mt-0.5 text-red-500 flex-shrink-0" />
                Group photos with multiple faces
              </li>
              <li className="flex items-start gap-2">
                <EyeOff className="w-3.5 h-3.5 mt-0.5 text-red-500 flex-shrink-0" />
                Photos without a visible face
              </li>
              <li className="flex items-start gap-2">
                <ImageOff className="w-3.5 h-3.5 mt-0.5 text-red-500 flex-shrink-0" />
                Blurry or low-quality images
              </li>
            </ul>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={photos.length < MIN_PHOTOS || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading {photos.length} photos...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Submit {photos.length} Photos
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
