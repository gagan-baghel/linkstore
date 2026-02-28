"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
}

export function ImageUpload({ images, onChange, maxImages = 5 }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files

    if (!files || files.length === 0) return

    if (images.length + files.length > maxImages) {
      toast({
        title: "Error",
        description: `You can only upload up to ${maxImages} images.`,
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const newImages = [...images]

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Failed to upload image")
        }

        const uploadData = await response.json()
        newImages.push(uploadData.url)
      }

      onChange(newImages)
      toast({
        title: "Success",
        description: "Images uploaded successfully",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    onChange(newImages)
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
        {images.map((image, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-0 relative">
              <img
                src={image || "/placeholder.svg"}
                alt={`Product image ${index + 1}`}
                className="h-28 w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {images.length < maxImages && (
          <Card className="flex h-28 items-center justify-center">
            <CardContent className="p-0">
              <Button
                type="button"
                variant="outline"
                className="h-full w-full relative px-3 text-sm"
                disabled={isUploading}
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={handleUpload}
                  disabled={isUploading}
                />
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? "Uploading..." : "Upload Image"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
