'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function CopyEmailsButton({ emails }: { emails: string[] }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const text = emails.join(',')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (emails.length === 0) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 px-1.5 text-xs"
      onClick={handleCopy}
      title={`Copy ${emails.length} email(s)`}
    >
      {copied ? '✓' : '📋'}
    </Button>
  )
}
