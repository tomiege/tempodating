"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, HelpCircle } from "lucide-react"
import { useState } from "react"

interface FAQItem {
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: "Do I need to prepare for the speed dating event?",
    answer: "Just be yourself! Find a quiet space with good lighting and stable internet."
  },
  {
    question: "How do I join the event?",
    answer: "Complete the personality quiz next to your event in \"My Events\" to get registered."
  },
  {
    question: "What happens after the event?",
    answer: "Return here to select your matches. If there's mutual interest, you'll connect!"
  },
  {
    question: "Technical issues during the event?",
    answer: "Contact support through the event chat or our support team."
  }
]

export default function WelcomeComponent() {
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({})
  const [showFAQ, setShowFAQ] = useState(false)

  const toggleItem = (index: number) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  return (
    <Card className="bg-gray-800/30 backdrop-blur-sm shadow-md border-gray-600/20">
      <CardHeader className="pb-3">
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Welcome to Luv2! Create your profile below, join events, and return after events to select matches.
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="text-center">
          <button 
            onClick={() => setShowFAQ(!showFAQ)}
            className="inline-flex items-center space-x-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>FAQ</span>
            <ChevronDown 
              className={`w-3 h-3 transition-transform ${showFAQ ? 'transform rotate-180' : ''}`} 
            />
          </button>
        </div>
        
        {showFAQ && (
          <div className="mt-4 space-y-2">
            {faqItems.map((item, index) => (
              <div key={index} className="space-y-1">
                <button 
                  onClick={() => toggleItem(index)}
                  className="flex items-center justify-between w-full p-2 text-left bg-gray-800/30 hover:bg-gray-700/30 rounded border border-gray-600/20 transition-colors"
                >
                  <span className="text-gray-300 text-sm">{item.question}</span>
                  <ChevronDown 
                    className={`w-3 h-3 text-gray-500 transition-transform ${
                      openItems[index] ? 'transform rotate-180' : ''
                    }`} 
                  />
                </button>
                {openItems[index] && (
                  <div className="px-2 py-1">
                    <p className="text-gray-400 text-xs">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
