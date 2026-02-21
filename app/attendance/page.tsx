'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Loader2, Shuffle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSearchParams } from 'next/navigation'

// Utility function to generate random animal and fruit emojis
function generateRandomEmoji(): string {
  const animalEmojis = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', 
    '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🐣',
    '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛',
    '🦋', '🐌', '🐞', '🐜', '🕷️', '🦂', '🐢', '🐍', '🦎', '🐙',
    '🦑', '🐠', '🐟', '🐡', '🐬', '🦈', '🐳', '🐋', '🐊', '🐆',
    '🐅', '🐃', '🐂', '🐄', '🦌', '🐪', '🐫', '🐘', '🦏', '🦛',
    '🐐', '🐑', '🐎', '🐖', '🐕', '🐩', '🐈', '🐓', '🦃', '🕊️',
    '🐇', '🐁', '🐀', '🐿️', '🦔', '🐾', '🐉', '🐲', '🦕', '🦖'
  ];

  const fruitEmojis = [
    '🍎', '🍏', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
    '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
    '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠',
    '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞',
    '🧇', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪'
  ];

  const allEmojis = [...animalEmojis, ...fruitEmojis];
  const randomIndex = Math.floor(Math.random() * allEmojis.length);
  return allEmojis[randomIndex];
}

export default function AttendancePage() {
  const [isVisible, setIsVisible] = useState(false)
  const [firstName, setFirstName] = useState<string>('')
  const [lastName, setLastName] = useState<string>('')
  const [assignedEmoji, setAssignedEmoji] = useState<string>('')
  const [gender, setGender] = useState<string>('')
  const [age, setAge] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [confirmedName, setConfirmedName] = useState<string>('')
  const searchParams = useSearchParams()
  const productId = searchParams.get('productId')

  useEffect(() => {
    setIsVisible(true)
    setAssignedEmoji(generateRandomEmoji())

    // Check cookies for existing attendance for this productId
    if (productId) {
      const cookie = document.cookie
        .split('; ')
        .find(row => row.startsWith(`attendance_${productId}=`))
      if (cookie) {
        try {
          const data = JSON.parse(decodeURIComponent(cookie.split('=').slice(1).join('=')))
          if (data.preferredName) {
            setConfirmedName(data.preferredName)
            setHasSubmitted(true)
            setSubmitStatus('success')
          }
        } catch (e) {
          // Invalid cookie, ignore
        }
      }
    }
  }, [productId])

  const handleSubmit = async () => {
    if (!gender || !age || !firstName.trim() || !lastName.trim()) return

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const nameWithEmoji = `${firstName.trim()} ${lastName.trim()} ${assignedEmoji}`
      
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attendeeName: `anonymous_${Date.now()}@event.local`, // Generate anonymous email
          preferredName: nameWithEmoji,
          productId: productId,
          gender,
          age: parseInt(age),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Save to cookie (expires in 24 hours)
        const cookieData = { preferredName: nameWithEmoji, gender, age: parseInt(age) }
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString()
        document.cookie = `attendance_${productId}=${encodeURIComponent(JSON.stringify(cookieData))}; expires=${expires}; path=/`

        setConfirmedName(nameWithEmoji)
        setSubmitStatus('success')
        setHasSubmitted(true)
      } else {
        console.error('Attendance submission failed:', data)
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Error submitting attendance:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!productId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-orange-100 text-gray-800 font-sans overflow-hidden">
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-black mb-8 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent" style={{ fontFamily: "'Inter', sans-serif" }}>
              No Event Found
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Please make sure you have a valid product ID in the URL.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (hasSubmitted && submitStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-orange-100 text-gray-800 font-sans overflow-hidden">
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-black mb-8 bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent" style={{ fontFamily: "'Inter', sans-serif" }}>
              Attendance Confirmed!
            </h1>
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-green-100">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-xl text-gray-700 mb-4">
                You're all set for today's event, {confirmedName}!
              </p>
              <p className="text-gray-600 mb-4">
                Thank you for confirming your attendance.
              </p>
              <p className="text-lg font-semibold text-orange-600">
              Please return to the Zoom call
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-orange-100 text-gray-800 font-sans overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <h1 className={`text-5xl md:text-6xl font-black mb-8 text-center bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ fontFamily: "'Inter', sans-serif" }}>
          Event Attendance
        </h1>
        
        <p className="text-xl text-gray-600 text-center mb-12 font-medium relative z-10" style={{ fontFamily: "'Inter', sans-serif" }}>
          Mark your attendance for today's event
        </p>

        <div className="max-w-2xl mx-auto relative z-10">
          {submitStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="text-green-800 font-medium">Attendance marked successfully!</span>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <span className="text-red-800 font-medium">Failed to mark attendance. Please try again.</span>
            </div>
          )}

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-orange-100">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Confirm Your Attendance</h3>
                <p className="text-gray-600">Please fill out your details to mark your attendance</p>
              </div>

              {/* First Name Input */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-12 text-lg border-orange-200 focus:border-orange-500 focus:ring-orange-200 rounded-xl"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>

              {/* Last Name Input with Emoji */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      First + last name helps distinguish you from others
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Enter your last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="flex-1 h-12 text-lg border-orange-200 focus:border-orange-500 focus:ring-orange-200 rounded-xl"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-50 border border-gray-200 rounded-xl">
                      <span className="text-2xl">{assignedEmoji}</span>
                    </div>
                    <Button
                      type="button"
                      onClick={() => setAssignedEmoji(generateRandomEmoji())}
                      variant="outline"
                      size="sm"
                      className="h-12 px-3 border-orange-200 hover:border-orange-500 hover:bg-orange-50 rounded-xl"
                    >
                      <Shuffle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Name Preview */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="font-medium text-gray-700 mb-2">Your name on the pairings will appear as:</h4>
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <span>{firstName.trim() || "First"} {lastName.trim() || "Last"}</span>
                  <span className="text-2xl">{assignedEmoji}</span>
                </div>
              </div>

              {/* Gender Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['male', 'female'].map((option) => (
                    <button
                      key={option}
                      onClick={() => setGender(option)}
                      className={`p-3 text-center rounded-lg border-2 font-medium transition-all ${
                        gender === option
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Input */}
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                  Age <span className="text-red-500">*</span>
                </label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter your age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="16"
                  max="100"
                  className="h-12 text-lg border-orange-200 focus:border-orange-500 focus:ring-orange-200 rounded-xl"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>

              {/* Submit Button */}
              <div>
                <Button
                  onClick={handleSubmit}
                  disabled={!gender || !age || !firstName.trim() || !lastName.trim() || isSubmitting}
                  className="w-full h-12 text-lg font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Confirm Attendance'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
