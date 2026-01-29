"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface PhotoGalleryProps {
  photos: string[]
  title: string
}

export function PhotoGallery({ photos, title }: PhotoGalleryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const openModal = (index: number) => {
    setCurrentIndex(index)
    setIsOpen(true)
  }

  const closeModal = () => setIsOpen(false)

  const showPrev = () => setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
  const showNext = () => setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">{title} ({photos.length})</h3>
        <Button variant="link" onClick={() => openModal(0)}>See all</Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {photos.slice(0, 3).map((photo, index) => (
          <Image
            key={index}
            src={photo}
            alt={`${title} ${index + 1}`}
            width={300}
            height={200}
            className="rounded-lg cursor-pointer object-cover"
            onClick={() => openModal(index)}
          />
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogOverlay className="bg-black/80" />
        <DialogContent className="max-w-5xl h-[90vh] flex items-center justify-center bg-transparent border-none shadow-none">
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              onClick={closeModal}
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
            >
              <X className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </Button>
            <Button 
              onClick={showPrev} 
              variant="ghost" 
              size="icon"
              className="absolute left-4 z-40 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={photos[currentIndex]}
                alt={`Photo ${currentIndex + 1}`}
                fill
                style={{ objectFit: 'contain' }}
                className="rounded-lg"
              />
            </div>
            <Button 
              onClick={showNext} 
              variant="ghost" 
              size="icon"
              className="absolute right-4 z-40 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

