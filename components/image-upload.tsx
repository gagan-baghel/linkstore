"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
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
  const [isDragging, setIsDragging] = useState(false)
  const isSingleMode = maxImages === 1

  const uploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return
    const file = files[0]

    if (maxImages > 1 && images.length >= maxImages) {
      toast({
        title: "Error",
        description: `Only ${maxImages} images are allowed.`,
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
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
      const nextImages = maxImages === 1 ? [uploadData.url] : [...images, uploadData.url].slice(0, maxImages)
      onChange(nextImages)
      toast({
        title: "Success",
        description: "Image uploaded successfully",
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    await uploadFiles(files)
    e.target.value = ""
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (isUploading) return
    const files = e.dataTransfer.files
    if (!files || files.length === 0) return
    await uploadFiles(files)
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    onChange(newImages)
  }

  return (
    <div className="space-y-2">
      <div className={isSingleMode ? "grid grid-cols-1 gap-3" : "grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5"}>
        {images.map((image, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className={isSingleMode ? "relative h-44 p-0" : "relative h-28 p-0"}>
              <Image
                src={image || "/placeholder.svg"}
                alt={`Product image ${index + 1}`}
                className="object-cover"
                fill
                unoptimized
                sizes={isSingleMode ? "(max-width: 1024px) 100vw, 420px" : "(max-width: 1024px) 50vw, 220px"}
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
          <Card
            className={`flex items-center justify-center border border-dashed border-slate-300 bg-slate-50 ${
              isSingleMode ? "h-44" : "h-28"
            } ${isDragging ? "border-slate-500 bg-slate-100" : ""}`}
            onDragOver={(e) => {
              e.preventDefault()
              if (!isDragging) setIsDragging(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              setIsDragging(false)
            }}
            onDrop={handleDrop}
          >
            <CardContent className="w-full p-3">
              <Button
                type="button"
                variant="outline"
                className="h-full w-full relative border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-none hover:bg-slate-100 hover:text-slate-900"
                disabled={isUploading}
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleUpload}
                  disabled={isUploading}
                />
                <Upload className="mr-2 h-4 w-4 text-slate-600" />
                {isUploading ? "Uploading..." : "Upload / Drop Image"}
              </Button>
              {isSingleMode && <p className="mt-2 text-center text-xs text-slate-500">Use one clear product image.</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
