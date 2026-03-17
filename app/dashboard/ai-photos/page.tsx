'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, X, Loader2, Sparkles, ArrowRight, Check, Camera, Download, ShoppingBag, Star } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const EXAMPLE_STYLES = [
  { src: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/st1.jpg", label: "Professional Headshot" },
  { src: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/st5.jpg", label: "Luxury Lifestyle" },
  { src: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/st6.jpg", label: "Date Night" },
  { src: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/st7.jpg", label: "Coffee Date" },
  { src: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/st3.jpg", label: "Fitness Active" },
  { src: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/st4.jpg", label: "Outdoor Adventure" },
  { src: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/st2.jpg", label: "Travel Shot" },
  { src: "https://photolike.s3.us-east-2.amazonaws.com/assets/dating/landing/st8.jpg", label: "Artistic Depth" },
]

const LOADING_MESSAGES = [
  "Analyzing your facial features...",
  "Matching your skin tone and lighting...",
  "Composing the perfect scene...",
  "This isn't a face swap — it's YOUR face, enhanced.",
  "Real lens physics. Real shadows. Real you.",
  "Perfecting posture and expression...",
  "Adding natural lighting and depth...",
  "Almost there — final touches...",
]

function RotatingMessages() {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <p className="text-sm text-primary font-medium text-center animate-pulse">
      {LOADING_MESSAGES[msgIndex]}
    </p>
  )
}

const MALE_PRESET = {
  referenceImage: 'https://photolike.s3.us-east-2.amazonaws.com/images/24150/708LSsLV42kfQnwNnD7NM_IvvVoqq2.png',
  prompt: "There are 6 reference images of the target. put the target at the table, holding a glass as if on a date. Keep the target's body type, hair length and style but wearing a stylish black sweater. Sharpen their jawline, whiten their teeth and perfect their posture. The target should be looking directly at the camera, confident, relaxed, smiling. No rings on finger.",
}

const FEMALE_PRESET = {
  referenceImage: 'https://i.pinimg.com/1200x/36/ec/74/36ec74631e56c6c344c52065687504ca.jpg',
  prompt: "Using the attached 6 reference images, place the subject at a cafe table. Maintain the subject's exact body type, hair length, and signature hairstyle, but style them in a chic, slim-fitting black sweater with a flattering neckline. Subtle enhancements: sharpen the jawline for a delicate yet defined look, ensure teeth are bright and white, and adjust posture to be upright, poised, and relaxed. The subject should be looking directly into the camera with an expression that is confident, warm, and invitingly feminine. Realistic, high-end photography, soft bokeh cafe background. No rings on finger.",
}

type Step = 'loading' | 'landing' | 'upload' | 'generating' | 'result' | 'purchased'

export default function AiPhotosPage() {
  const [step, setStep] = useState<Step>('loading')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [isMale, setIsMale] = useState<boolean | null>(null)
  const { toast } = useToast()
  const { user, loading } = useAuth()
  const router = useRouter()

  // Gender-specific example images
  const exampleInputs = isMale === false
    ? ['/aiPhotos/f1.png', '/aiPhotos/f2.png', '/aiPhotos/f3.png']
    : ['/aiPhotos/o1.png', '/aiPhotos/o2.png', '/aiPhotos/o3.png']
  const exampleOutput = isMale === false ? '/aiPhotos/female_output.png' : '/aiPhotos/male_output.png'

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    try {
      // Fetch the aiPhotos product to get price info
      const prodRes = await fetch('/api/products/onDemand')
      if (!prodRes.ok) throw new Error('Could not load products')
      const products = await prodRes.json()
      const aiProduct = products.find((p: any) => p.productType === 'aiPhotos')
      if (!aiProduct) throw new Error('AI Photos product not found')

      // Fetch user profile for email/name/gender
      const profileRes = await fetch('/api/profile')
      if (!profileRes.ok) throw new Error('Could not load profile')
      const profile = await profileRes.json()

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: aiProduct.productId,
          productType: 'aiPhotos',
          items: [{ price: aiProduct.price, quantity: 1, name: aiProduct.title }],
          currency: aiProduct.currency || 'usd',
          email: profile.email || user?.email || '',
          name: profile.name || '',
          isMale: profile.isMale ?? true,
        }),
      })
      if (!res.ok) throw new Error('Checkout failed')
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Something went wrong', variant: 'destructive' })
    } finally {
      setCheckoutLoading(false)
    }
  }

  // Check for existing free AI photo generation and paid purchase on load
  useEffect(() => {
    if (loading || !user) return
    const checkExisting = async () => {
      try {
        // Fetch user profile for gender
        const profileRes = await fetch('/api/profile')
        if (profileRes.ok) {
          const profile = await profileRes.json()
          if (profile.isMale !== undefined && profile.isMale !== null) {
            setIsMale(profile.isMale)
          }
        }

        // Check if user has paid for AI photos (checkout with confirmationEmailSent)
        const checkoutsRes = await fetch('/api/user/checkouts')
        if (checkoutsRes.ok) {
          const checkouts = await checkoutsRes.json()
          const hasPaid = checkouts.some((c: any) => c.productType === 'aiPhotos' && c.confirmationEmailSent)
          if (hasPaid) {
            // Also check if they have a free generation to show
            const genRes = await fetch('/api/ai-photos/generate')
            if (genRes.ok) {
              const genData = await genRes.json()
              if (genData.outputUrl) setExistingPhotoUrl(genData.outputUrl)
            }
            setStep('purchased')
            return
          }
        }

        // Check if user already used their free generation
        const res = await fetch('/api/ai-photos/generate')
        if (res.ok) {
          const data = await res.json()
          if (data.outputUrl) {
            setExistingPhotoUrl(data.outputUrl)
            setStep('result')
            return
          }
        }
      } catch {}
      setStep('landing')
    }
    checkExisting()
  }, [user, loading])

  if (!loading && !user) {
    router.push('/login')
    return null
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
      toast({ title: 'Too many images', description: `Only ${totalAllowed} more slot(s) available.`, variant: 'destructive' })
    }

    if (toAdd.length === 0) return

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
    addFiles(Array.from(e.dataTransfer.files))
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
      e.target.value = ''
    }
  }

  const uploadToSupabase = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch('/api/upload-image', { method: 'POST', body: formData })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }
    return (await response.json()).url
  }

  const handleGenerate = async () => {
    if (files.length !== 6) {
      toast({ title: 'Need 6 photos', description: `Upload ${6 - files.length} more photo(s)`, variant: 'destructive' })
      return
    }

    try {
      setStep('generating')
      setUploading(true)

      const imageUrls = await Promise.all(files.map(uploadToSupabase))

      setUploading(false)
      setGenerating(true)

      // Auto-detect gender from profile, default to male preset
      let profileRes
      try { profileRes = await fetch('/api/profile') } catch {}
      const profile = profileRes?.ok ? await profileRes.json() : null
      const preset = profile?.isMale === false ? FEMALE_PRESET : MALE_PRESET

      const response = await fetch('/api/ai-photos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrls,
          prompt: preset.prompt,
          referenceImageUrl: preset.referenceImage,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Generation failed')

      setResult(data.result)
      setExistingPhotoUrl(data.outputUrl || data.result?.images?.[0]?.url || null)
      setStep('result')
      toast({ title: 'Your photo is ready!', description: 'Check out your match-ready photo below' })
    } catch (error) {
      console.error('Generation error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      })
      setStep('upload')
    } finally {
      setUploading(false)
      setGenerating(false)
    }
  }

  // ─── STEP: Loading ───────────────────────────────────────────
  if (step === 'loading' || loading) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <section className="pt-24 pb-16">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading...</span>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  // ─── STEP: Landing ──────────────────────────────────────────
  if (step === 'landing') {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <section className="pt-24 pb-16">
          <div className="max-w-3xl mx-auto px-4">
            {/* Hero */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                Free AI Photo
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-3">
                Get Your Match-Ready Photo
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Upload 6 selfies and our AI will create a stunning, professional-quality dating photo in about 2 minutes.
              </p>
            </div>

            {/* Example Before → After */}
            <Card className="p-6 mb-8">
              <h3 className="font-semibold text-foreground mb-4 text-center">See the Transformation</h3>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground text-center mb-2">Your selfies</p>
                  <div className="grid grid-cols-3 gap-2">
                    {exampleInputs.map((src, i) => (
                      <img key={i} src={src} alt={`Example input ${i + 1}`} className="rounded-lg w-full aspect-square object-cover" />
                    ))}
                  </div>
                </div>
                <ArrowRight className="w-8 h-8 text-primary shrink-0 rotate-90 sm:rotate-0" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground text-center mb-2">AI Match-Ready Photo</p>
                  <img src={exampleOutput} alt="Example result" className="rounded-lg w-full aspect-[3/4] object-cover" />
                </div>
              </div>
            </Card>

            {/* CTA */}
            <div className="text-center">
              <Button
                size="lg"
                className="px-8 text-lg h-14"
                onClick={() => setStep('upload')}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Get My Free Match-Ready Photo
              </Button>
              <p className="text-muted-foreground text-sm mt-3">
                1 free match-ready photo for your profile • unlock 30 for $29.99 only if you love it
              </p>
            </div>

            {/* How it works */}
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: Camera, title: 'Upload 6 Selfies', desc: 'Any casual photos of yourself — the more variety, the better.' },
                { icon: Sparkles, title: 'AI Enhancement', desc: 'Our AI creates a professional match-ready photo in ~2 minutes.' },
                { icon: Check, title: 'Use It Anywhere', desc: 'Download and use on your dating profile, social media, or anywhere.' },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  // ─── STEP: Upload ───────────────────────────────────────────
  if (step === 'upload') {
    const uploadedCount = files.length
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <section className="pt-24 pb-16">
          <div className="max-w-2xl mx-auto px-4">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-2">Upload Your 6 Best Selfies</h2>
            <p className="text-muted-foreground mb-6">
              Use clear, well-lit photos of yourself. Different angles and expressions work best.
            </p>

            {/* Example good inputs */}
            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-2">Good example photos:</p>
              <div className="flex gap-2">
                {exampleInputs.map((src, i) => (
                  <img key={i} src={src} alt={`Example ${i + 1}`} className="w-16 h-16 rounded-lg object-cover" />
                ))}
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors mb-4 ${
                dragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              } ${uploadedCount >= 6 ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
            >
              <label className="flex flex-col items-center gap-2 cursor-pointer">
                <Upload className="w-10 h-10 text-muted-foreground" />
                <span className="text-muted-foreground text-sm">
                  Drag & drop images here, or <span className="text-primary underline">browse</span>
                </span>
                <span className="text-muted-foreground/60 text-xs">
                  {uploadedCount >= 6 ? 'All 6 photos selected' : `Select up to ${6 - uploadedCount} more`}
                </span>
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

            {/* Preview grid */}
            {uploadedCount > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden group bg-muted">
                    <img src={preview} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 bg-destructive hover:bg-destructive/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1 rounded">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">{uploadedCount}/6 photos</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('landing')}>Back</Button>
                <Button
                  onClick={handleGenerate}
                  disabled={uploadedCount !== 6}
                  className="px-6"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate My Photo
                </Button>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  // ─── STEP: Generating ───────────────────────────────────────
  if (step === 'generating') {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <section className="pt-24 pb-16">
          <div className="max-w-2xl mx-auto px-4">
            {/* Spinner + main message */}
            <div className="text-center mb-10">
              <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-6" />
              <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                {uploading ? 'Uploading your photos...' : 'Creating your match-ready photo...'}
              </h2>
              <p className="text-muted-foreground">
                {uploading
                  ? 'Securely uploading your images.'
                  : 'Our AI is working its magic. This usually takes about 2 minutes.'}
              </p>
              <div className="mt-6 w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-full rounded-full animate-pulse" style={{ width: uploading ? '30%' : '70%' }} />
              </div>
            </div>

            {/* rotating message */}
            {!uploading && <RotatingMessages />}

            {/* Style preview while waiting */}
            {!uploading && (
              <div className="mt-10">
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Love your free photo? Unlock 30 photos in styles like these:
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {EXAMPLE_STYLES.map((style, i) => (
                    <div key={i} className="text-center">
                      <img
                        src={style.src}
                        alt={style.label}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">{style.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  // ─── STEP: Purchased — 30 photos being prepared ─────────────
  if (step === 'purchased') {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <section className="pt-24 pb-16">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                30-Photo Pack Purchased
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-3">
                Your AI Photos Are Being Prepared
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                We&apos;re generating your 30 match-ready photos in multiple styles and backgrounds. This may take some time — we&apos;ll notify you when they&apos;re ready.
              </p>
            </div>

            {/* Show their free photo if they have one */}
            {existingPhotoUrl && (
              <Card className="p-4 sm:p-6 mb-8">
                <h3 className="font-semibold text-foreground mb-3">Your Free Preview Photo</h3>
                <img
                  src={existingPhotoUrl}
                  alt="Your AI-generated preview"
                  className="w-full max-w-sm rounded-lg mx-auto"
                />
                <div className="flex gap-3 mt-3 justify-center">
                  <a
                    href={existingPhotoUrl}
                    download="match-ready-photo.jpg"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-1.5" />
                      Download
                    </Button>
                  </a>
                </div>
              </Card>
            )}

            {/* Status card */}
            <Card className="p-6 sm:p-8 border-primary/30 bg-primary/5">
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-1">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg mb-1">Processing Your 30 Photos</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Our AI is generating your photos across multiple styles — professional headshots, date night, outdoor, lifestyle, and more.
                  </p>
                  <ul className="space-y-1.5">
                    {[
                      '30 professional-quality photos',
                      'Multiple styles & backgrounds',
                      'Optimized for dating apps & social media',
                      'Keep forever — one-time purchase',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            <div className="text-center mt-8">
              <Button variant="outline" asChild>
                <Link href="/dashboard">← Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  // ─── STEP: Result + Upsell ──────────────────────────────────
  const photoUrl = result?.images?.[0]?.url || existingPhotoUrl

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Check className="w-4 h-4" />
              Your photo is ready!
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Your Match-Ready Photo
            </h2>
          </div>

          {/* Two-column: Photo + Upsell side-by-side */}
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {/* Left: Photo result */}
            <Card className="p-4 sm:p-6">
              {photoUrl ? (
                <div>
                  <img
                    src={photoUrl}
                    alt="Your AI-generated photo"
                    className="w-full rounded-lg"
                  />
                  <div className="flex gap-3 mt-3">
                    <a
                      href={photoUrl}
                      download="match-ready-photo.jpg"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5"
                    >
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-1.5" />
                        Download
                      </Button>
                    </a>
                    <a
                      href={photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm self-center"
                    >
                      Open full size →
                    </a>
                  </div>
                </div>
              ) : result && !result.images ? (
                <pre className="text-sm text-muted-foreground overflow-auto max-h-96 bg-muted p-4 rounded">
                  {JSON.stringify(result, null, 2)}
                </pre>
              ) : null}
            </Card>

            {/* Right: Upsell */}
            <Card className="p-6 border-primary/30 bg-primary/5 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag className="w-6 h-6 text-primary" />
                <h3 className="font-serif text-xl font-bold text-foreground">
                  Love it? Get 30 More
                </h3>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Unlock a full pack of 30 AI-enhanced photos — dating profiles, social media, LinkedIn &amp; more.
              </p>

              <ul className="space-y-1.5 mb-4">
                {[
                  '30 professional-quality photos',
                  'Multiple styles & backgrounds',
                  'Optimized for dating apps',
                  'Ready in 5 minutes',
                  'One-time payment, keep forever',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-xs text-muted-foreground ml-1">Loved by 500+ users</span>
              </div>

              <Button
                size="lg"
                className="w-full text-lg h-14 mt-auto"
                onClick={handleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Redirecting...</>
                ) : (
                  <>Unlock 30 Photos — $29.99</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">One-time purchase. No subscription.</p>
            </Card>
          </div>

          {/* Example styles grid */}
          <div className="mb-10">
            <h3 className="font-serif text-lg font-bold text-foreground text-center mb-4">
              Styles included in your pack
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {EXAMPLE_STYLES.map((style, i) => (
                <div key={i} className="text-center">
                  <img
                    src={style.src}
                    alt={style.label}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{style.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Back to dashboard */}
          <div className="text-center">
            <Button variant="outline" asChild>
              <Link href="/dashboard">← Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
