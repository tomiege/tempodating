'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, CheckCircle, AlertCircle } from 'lucide-react'

interface EmailFormProps {
  sendEmail: (formData: FormData) => Promise<{ success: boolean; error?: string; data?: any }>
}

export default function EmailForm({ sendEmail }: EmailFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  })
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus({ type: null, message: '' })

    const formData = new FormData()
    formData.append('email', email)

    startTransition(async () => {
      const result = await sendEmail(formData)

      if (result.success) {
        setStatus({
          type: 'success',
          message: `Email sent successfully to ${email}!`,
        })
        setEmail('')
      } else {
        setStatus({
          type: 'error',
          message: result.error || 'Failed to send email',
        })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter recipient email"
          required
          disabled={isPending}
          className="h-12"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending || !email}
        className="w-full h-12"
        size="lg"
      >
        {isPending ? 'Sending...' : 'Send Test Email'}
      </Button>

      {status.type && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg ${
            status.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{status.message}</p>
        </div>
      )}
    </form>
  )
}
