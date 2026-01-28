"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { User, Camera, Save, Loader2, AlertCircle, ClipboardList, CheckCircle2 } from "lucide-react"
import { User as UserType } from "@/types/profile"
import { downscaleImage } from "@/lib/image-utils"
import Link from "next/link"

interface DashboardProfileComponentProps {
  user: UserType | null
  onUserUpdate?: (updatedUser: UserType) => void
  validationErrors?: string[]
}

export default function DashboardProfileComponent({ user, onUserUpdate, validationErrors = [] }: DashboardProfileComponentProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [name, setName] = useState("")
  const [age, setAge] = useState<number | undefined>(undefined)
  const [bio, setBio] = useState("")
  const [contactInfo, setContactInfo] = useState("")
  const [isMale, setIsMale] = useState<boolean | undefined>(undefined)
  const [photo, setPhoto] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Update form fields when user prop changes
  useEffect(() => {
    if (user) {
      console.log("User data received:", user)
      setName(user.name || "")
      setAge(user.age || undefined)
      setBio(user.bio || "")
      setContactInfo(user.contactInfo || "")
      setIsMale(user.isMale)
      setPhoto(user.image || null)
    }
  }, [user])

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log("Photo file selected:", file.name)
      setCompressing(true)
      
      try {
        // Show compression toast for larger files
        if (file.size > 1024 * 1024) { // > 1MB
          toast({
            title: "Compressing image...",
            description: "Please wait while we optimize your photo for upload.",
          })
        }
        
        // Compress the image before setting it
        const compressedFile = await downscaleImage(file, 800) // 800KB limit
        console.log("Photo compressed:", {
          original: `${(file.size / 1024).toFixed(1)}KB`,
          compressed: `${(compressedFile.size / 1024).toFixed(1)}KB`,
          reduction: `${((file.size - compressedFile.size) / file.size * 100).toFixed(1)}%`
        })
        
        setPhotoFile(compressedFile)
        
        // Create preview URL from compressed file
        const reader = new FileReader()
        reader.onload = (e) => {
          setPhoto(e.target?.result as string)
        }
        reader.readAsDataURL(compressedFile)
        
        if (file.size > 1024 * 1024) {
          toast({
            title: "Image optimized!",
            description: `Reduced from ${(file.size / 1024).toFixed(1)}KB to ${(compressedFile.size / 1024).toFixed(1)}KB`,
          })
        }
      } catch (error) {
        console.error("Error compressing image:", error)
        toast({
          title: "Compression failed",
          description: "Using original image. Upload may be slower.",
          variant: "destructive",
        })
        
        // Fallback to original file
        setPhotoFile(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          setPhoto(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } finally {
        setCompressing(false)
      }
    }
  }

  const handleSave = async () => {
    console.log("Save button clicked")
    console.log("Form data:", { name, age, bio, contactInfo, isMale, photo })
    
    setSaving(true)
    try {
      let response: Response

      // Use FormData if there's a photo file, otherwise use JSON
      if (photoFile) {
        toast({
          title: "Uploading image...",
          description: "Please wait while we upload your photo.",
        })
        
        console.log("Uploading photo file:", photoFile.name)
        
        const formData = new FormData()
        formData.append('name', name || '')
        formData.append('age', age?.toString() || '')
        formData.append('bio', bio || '')
        formData.append('contactInfo', contactInfo || '')
        formData.append('isMale', isMale === undefined ? '' : isMale.toString())
        formData.append('photo', photoFile)

        response = await fetch('/api/profile', {
          method: 'PUT',
          body: formData, // No Content-Type header needed for FormData
        })
      } else {
        // No photo file, use JSON
        response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            age,
            bio,
            contactInfo,
            isMale,
          }),
        })
      }

      if (response.ok) {
        const updatedUser = await response.json()
        console.log("Profile updated successfully:", updatedUser)
        setPhotoFile(null) // Clear the file input
        
        // Call the callback to update the user in parent component
        if (onUserUpdate) {
          onUserUpdate(updatedUser)
        }
        
        toast({
          title: "Profile saved!",
          description: "Your profile has been updated successfully.",
        })
      } else {
        const errorData = await response.json()
        console.error("Save failed:", errorData)
        console.error("Full error response:", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorData
        })
        
        // Show more detailed error message
        const errorMessage = errorData.details 
          ? `Failed to save profile: ${errorData.details}`
          : errorData.error || "Failed to save profile"
        
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const isFormValid = () => {
    return name.trim() !== "" && contactInfo.trim() !== "" && isMale !== undefined
  }

  // Helper function to check if a field has validation errors
  const hasValidationError = (fieldName: string) => {
    return validationErrors.includes(fieldName)
  }

  // Helper function to get field className with validation styling
  const getFieldClassName = (fieldName: string, baseClassName: string) => {
    const hasError = hasValidationError(fieldName)
    return hasError 
      ? `${baseClassName} border-red-500 focus:border-red-500 focus:ring-red-500`
      : baseClassName
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center">
            <User className="mr-2 h-5 w-5" />
            Your Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center">
          <User className="mr-2 h-5 w-5" />
          Your Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personality Quiz Button - At Top */}
        {user.personalityQuizResult ? (
          <div className="flex items-center justify-center p-3 bg-green-100 dark:bg-green-900/20 rounded-lg border border-green-500">
            <CheckCircle2 className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300 font-medium">Personality Quiz Completed</span>
          </div>
        ) : (
          <Button
            asChild
            variant="outline"
            className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Link href="/personality-quiz">
              <ClipboardList className="mr-2 h-4 w-4" />
              Complete Personality Quiz
            </Link>
          </Button>
        )}

        {/* Validation Error Message */}
        {validationErrors.length > 0 && (
          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive">
            <div className="flex items-center text-destructive text-sm mb-2">
              <AlertCircle className="w-4 h-4 mr-2" />
              Complete Profile Required
            </div>
            <p className="text-xs text-destructive/80">
              Please fill in the highlighted fields below to access matching features.
            </p>
          </div>
        )}
        
        {/* Photo Section */}
        <div className="flex flex-col items-center space-y-3">
          <Avatar className="w-32 h-32 border-4 border-muted">
            <AvatarImage src={photo || undefined} alt="Profile" />
            <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
              {name ? name.charAt(0).toUpperCase() : <User className="h-12 w-12" />}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={compressing}
          >
            {compressing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Change Photo
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className={hasValidationError('name') ? 'border-destructive focus:border-destructive' : ''}
          />
          {hasValidationError('name') && (
            <p className="text-destructive text-xs mt-1">Please enter your name to enable matching</p>
          )}
        </div>

        {/* Age */}
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            value={age || ""}
            onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Enter your age"
            min="18"
            max="100"
          />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others a bit about yourself..."
            className="min-h-[100px] resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">{bio.length}/500 characters</p>
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          {isMale !== undefined ? (
            <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted text-muted-foreground">
              {isMale ? "Male" : "Female"}
            </div>
          ) : (
            <Select onValueChange={(value) => setIsMale(value === "male")}>
              <SelectTrigger className={hasValidationError('gender') ? 'border-destructive focus:border-destructive' : ''}>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          )}
          {hasValidationError('gender') && (
            <p className="text-destructive text-xs mt-1">Please select your gender to enable matching</p>
          )}
        </div>

        {/* Contact Info */}
        <div className="space-y-2">
          <Label htmlFor="contactInfo">Contact Information</Label>
          <Textarea
            id="contactInfo"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            placeholder="Share your contact info for potential matches (phone, social media, etc.)"
            className={`min-h-[80px] resize-none ${hasValidationError('contactInfo') ? 'border-destructive focus:border-destructive' : ''}`}
          />
          {hasValidationError('contactInfo') && (
            <p className="text-destructive text-xs mt-1">Please add your contact information to enable matching</p>
          )}
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={!isFormValid() || saving}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </>
          )}
        </Button>


      </CardContent>
    </Card>
  )
}
