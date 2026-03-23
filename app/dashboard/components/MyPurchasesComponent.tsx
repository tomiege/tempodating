"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ShoppingBag, Camera, ExternalLink, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { formatLocalPrice } from "@/lib/utils"
import AiPhotosUploadModal from "./AiPhotosUploadModal"

interface CheckoutData {
  checkoutId: number
  productType: string
  productId: number
  productDescription: string | null
  totalOrder: number
  currency: string | null
  checkoutTime: string
}

interface AiPhotoSubmission {
  id: string
  status: "pending" | "processing" | "completed"
  photos: { url: string; path: string; name: string }[]
  created_at: string
}

interface MyPurchasesComponentProps {
  checkouts: CheckoutData[]
  loading?: boolean
}

const EVENT_PRODUCT_TYPES = [
  "event",
  "onlineSpeedDating",
  "onlineSpeedDatingGay",
  "onlineSpeedDatingJewish",
  "onlineSpeedDatingIndian",
  "onlineSpeedDatingMuslim",
]

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  aiPhotos: "AI Photos",
  styleConsultant: "Style Consultation",
  colorPalette: "Color Palette Analysis",
  soulmateSketching: "Soulmate Sketching",
  datingEbook: "Dating eBook",
  socialMediaMaxing: "Social Media Maxing",
  geoMaxing: "Geo Maxing",
  workshop: "Workshop",
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Submitted", className: "bg-yellow-100 text-yellow-800" },
  processing: { label: "Processing", className: "bg-blue-100 text-blue-800" },
  completed: { label: "Completed", className: "bg-green-100 text-green-800" },
}

export function MyPurchasesComponent({ checkouts, loading = false }: MyPurchasesComponentProps) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [aiPhotoSubmission, setAiPhotoSubmission] = useState<AiPhotoSubmission | null>(null)
  const [submissionLoaded, setSubmissionLoaded] = useState(false)

  // Filter to only non-event purchases
  const purchases = checkouts.filter(
    (c) => !EVENT_PRODUCT_TYPES.includes(c.productType)
  )

  // Fetch AI photo submission status on first render
  useState(() => {
    const hasAiPhotos = purchases.some((c) => c.productType === "aiPhotos")
    if (hasAiPhotos && !submissionLoaded) {
      fetch("/api/ai-photos")
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data) setAiPhotoSubmission(data)
          setSubmissionLoaded(true)
        })
        .catch(() => setSubmissionLoaded(true))
    }
  })

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            My Purchases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-muted-foreground">Loading purchases...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (purchases.length === 0) return null

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            My Purchases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {purchases.map((purchase) => (
              <div
                key={purchase.checkoutId}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-secondary/30"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground">
                      {PRODUCT_TYPE_LABELS[purchase.productType] ||
                        purchase.productDescription ||
                        purchase.productType}
                    </h3>
                    {!["aiPhotos", "socialMediaMaxing", "geoMaxing"].includes(purchase.productType) && (
                      <Badge variant="outline" className="text-xs">
                        {formatLocalPrice(Math.round(purchase.totalOrder * 100))}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Purchased{" "}
                    {new Date(purchase.checkoutTime).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>

                  {/* AI Photos specific status */}
                  {purchase.productType === "aiPhotos" && (
                    <div className="mt-2">
                      {aiPhotoSubmission ? (
                        <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                            Come back soon. Your AI Photos are being generated.
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-600 font-medium">
                          Upload your training photos to get started
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {purchase.productType === "aiPhotos" && !aiPhotoSubmission && (
                    <Button
                      size="sm"
                      onClick={() => setUploadModalOpen(true)}
                      className="gap-1.5"
                    >
                      <Camera className="w-4 h-4" />
                      Upload Photos
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AiPhotosUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSubmitted={() => {
          // Refresh submission status
          fetch("/api/ai-photos")
            .then((res) => res.ok ? res.json() : null)
            .then((data) => {
              if (data) setAiPhotoSubmission(data)
            })
            .catch(() => {})
        }}
      />
    </>
  )
}
