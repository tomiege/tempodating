"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Star, Send, Loader2, CheckCircle2 } from "lucide-react"

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventTitle: string
  productId: number
  productType: string
  onFeedbackSubmitted: (productId: number, productType: string) => void
}

export function FeedbackDialog({
  open,
  onOpenChange,
  eventTitle,
  productId,
  productType,
  onFeedbackSubmitted,
}: FeedbackDialogProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (rating === 0 || !message.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          message: message.trim(),
          productId,
          productType,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit feedback")
      }

      setSuccess(true)
      onFeedbackSubmitted(productId, productType)

      // Auto-close after 2 seconds
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setRating(0)
      setHoveredRating(0)
      setMessage("")
      setError(null)
      setSuccess(false)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        {success ? (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center mb-2">
              Thank You!
            </DialogTitle>
            <DialogDescription className="text-center">
              Your feedback for {eventTitle} has been submitted.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Leave Feedback
              </DialogTitle>
              <DialogDescription>
                How was your experience at {eventTitle}?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Star Rating */}
              <div>
                <label className="text-sm font-medium mb-2 block">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          star <= (hoveredRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Textarea
                  placeholder="Tell us about your experience..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={1000}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {message.length}/1000
                </p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || rating === 0 || !message.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
