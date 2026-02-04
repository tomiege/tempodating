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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, UserPlus, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface InviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventTitle: string
  productId: number
  productType: string
  city?: string
}

export function InviteDialog({
  open,
  onOpenChange,
  eventTitle,
  productId,
  productType,
  city
}: InviteDialogProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()

  const handleSendInvite = async () => {
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/events/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          toEmail: email,
          productId,
          productType,
          discountAmount: 20,
          city
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation")
      }

      // Show success state
      setSuccess(true)

      // Reset after 2 seconds
      setTimeout(() => {
        setEmail("")
        setSuccess(false)
        onOpenChange(false)
      }, 2000)
    } catch (error) {
      toast({
        title: "Failed to send invitation",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading && !success) {
      setEmail("")
      setSuccess(false)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        {success ? (
          // Success state
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center mb-2">
              Invitation Sent!
            </DialogTitle>
            <DialogDescription className="text-center">
              Your friend will receive an email with a 20% discount code for {eventTitle}
            </DialogDescription>
          </div>
        ) : (
          // Form state
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Invite a Friend
              </DialogTitle>
              <DialogDescription>
                Send your friend a 20% discount code for {eventTitle}. They&apos;ll receive an email with their special offer.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Friend&apos;s Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="friend@example.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !loading) {
                        handleSendInvite()
                      }
                    }}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleSendInvite} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invite
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
