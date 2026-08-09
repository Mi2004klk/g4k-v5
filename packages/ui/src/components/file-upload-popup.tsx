"use client"

import * as React from "react"
import { UploadCloud, X, File as FileIcon, Loader2 } from "lucide-react"

import { cn } from "../utils/cn"
import { Button } from "./button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog"

export interface FileUploadPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  maxSizeMB?: number
  acceptedTypes?: string[] // e.g. ["image/jpeg", "image/png"]
  onUpload: (file: File) => Promise<void>
  isLoading?: boolean
}

export function FileUploadPopup({
  open,
  onOpenChange,
  title = "Upload File",
  description = "Drag and drop your file here, or click to browse.",
  maxSizeMB = 5,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp"],
  onUpload,
  isLoading = false,
}: FileUploadPopupProps) {
  const [file, setFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Cleanup preview URL
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setFile(null)
      setError(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
    }
  }, [open, previewUrl])

  const validateFile = (selectedFile: File): boolean => {
    setError(null)
    
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(selectedFile.type)) {
      setError(`Invalid file type. Accepted types: ${acceptedTypes.map(t => t.split("/")[1]).join(", ")}`)
      return false
    }

    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB`)
      return false
    }

    return true
  }

  const handleFileSelect = (selectedFile: File) => {
    if (validateFile(selectedFile)) {
      setFile(selectedFile)
      if (selectedFile.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(selectedFile))
      } else {
        setPreviewUrl(null)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleConfirm = async () => {
    if (!file) return
    try {
      await onUpload(file)
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Upload failed. Please try again.")
    }
  }

  const formatTypes = acceptedTypes.map(t => t.split("/")[1].toUpperCase()).join(", ")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
            <br />
            <span className="text-xs text-muted-foreground">
              Supports: {formatTypes} (Max {maxSizeMB}MB)
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {!file ? (
            <div
              className={cn(
                "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/50",
                error ? "border-destructive bg-destructive/5" : ""
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click()
                }
              }}
            >
              <UploadCloud className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-center">
                Click to upload or drag and drop
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={acceptedTypes.join(",")}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0])
                  }
                }}
              />
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-lg border bg-muted/20">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 z-10 h-6 w-6 rounded-full bg-background/80 hover:bg-background"
                onClick={() => {
                  setFile(null)
                  setPreviewUrl(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>

              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-2">
                  <FileIcon className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!file || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
