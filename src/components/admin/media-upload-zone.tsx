"use client";

import React, { useState, useCallback, useRef } from "react";
import { Upload, X, AlertCircle, CheckCircle, RefreshCw, Film, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface UploadConstraints {
  image: {
    maxSize: number;
    maxSizeMB: number;
    acceptedTypes: string[];
    acceptedExtensions: string[];
    minDimension: number;
    maxDimension: number;
  };
  video: {
    maxSize: number;
    maxSizeMB: number;
    acceptedTypes: string[];
    acceptedExtensions: string[];
    maxDurationSeconds: number;
  };
}

export interface UploadFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  errorCode?: string;
}

export interface MediaUploadZoneProps {
  onUpload: (files: File[]) => Promise<void>;
  constraints?: UploadConstraints;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  slotKey?: string;
  section?: string;
  mediaType?: "image" | "video";
}

const DEFAULT_CONSTRAINTS: UploadConstraints = {
  image: {
    maxSize: 5 * 1024 * 1024,
    maxSizeMB: 5,
    acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
    acceptedExtensions: ["jpg", "jpeg", "png", "webp"],
    minDimension: 100,
    maxDimension: 4096,
  },
  video: {
    maxSize: 100 * 1024 * 1024,
    maxSizeMB: 100,
    acceptedTypes: ["video/mp4"],
    acceptedExtensions: ["mp4"],
    maxDurationSeconds: 120,
  },
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileType(file: File): "image" | "video" | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

export function MediaUploadZone({
  onUpload,
  constraints = DEFAULT_CONSTRAINTS,
  accept,
  multiple = false,
  maxFiles = 5,
  disabled = false,
  className,
  slotKey,
  section,
  mediaType,
}: MediaUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute accepted file types
  const computedAccept = accept || [
    ...constraints.image.acceptedTypes,
    ...constraints.video.acceptedTypes,
  ].join(",");

  // Validate a single file
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    const type = getFileType(file);
    
    if (!type) {
      return { valid: false, error: "File must be an image or video" };
    }
    
    // Filter by mediaType if specified
    if (mediaType && type !== mediaType) {
      return { valid: false, error: `Only ${mediaType}s are allowed` };
    }

    const typeConstraints = constraints[type];
    
    // Check size
    if (file.size > typeConstraints.maxSize) {
      return { 
        valid: false, 
        error: `${type === "image" ? "Image" : "Video"} must be under ${typeConstraints.maxSizeMB}MB` 
      };
    }

    // Check extension
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!typeConstraints.acceptedExtensions.includes(ext)) {
      return { 
        valid: false, 
        error: `Accepted formats: ${typeConstraints.acceptedExtensions.join(", ")}` 
      };
    }

    return { valid: true };
  }, [constraints, mediaType]);

  // Create preview URL for file
  const createPreview = useCallback((file: File): string | undefined => {
    const type = getFileType(file);
    if (type === "image") {
      return URL.createObjectURL(file);
    }
    return undefined;
  }, []);

  // Handle file selection
  const handleFiles = useCallback((selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles).slice(0, maxFiles - files.length);
    
    const newFiles: UploadFile[] = fileArray.map(file => {
      const validation = validateFile(file);
      return {
        id: generateId(),
        file,
        preview: createPreview(file),
        progress: 0,
        status: validation.valid ? "pending" : "error",
        error: validation.error,
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length, maxFiles, validateFile, createPreview]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    const droppedFiles = e.dataTransfer.files;
    handleFiles(droppedFiles);
  }, [disabled, handleFiles]);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  }, [handleFiles]);

  // Remove a file from the list
  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  // Retry a failed upload
  const retryFile = useCallback((id: string) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, status: "pending", error: undefined, progress: 0 } : f
    ));
  }, []);

  // Upload all pending files
  const uploadFiles = useCallback(async () => {
    const pendingFiles = files.filter(f => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    for (const uploadFile of pendingFiles) {
      try {
        // Update to uploading
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: "uploading", progress: 10 } : f
        ));

        // Simulate progress
        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id && f.status === "uploading" && f.progress < 90
              ? { ...f, progress: f.progress + 10 }
              : f
          ));
        }, 200);

        // Perform upload
        await onUpload([uploadFile.file]);

        clearInterval(progressInterval);

        // Success
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: "success", progress: 100 } : f
        ));
      } catch (error) {
        // Error
        const message = error instanceof Error ? error.message : "Upload failed";
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: "error", error: message } : f
        ));
      }
    }

    setIsUploading(false);
  }, [files, onUpload]);

  // Clear all files
  const clearFiles = useCallback(() => {
    files.forEach(f => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setFiles([]);
  }, [files]);

  const hasFiles = files.length > 0;
  const hasPending = files.some(f => f.status === "pending");
  const hasErrors = files.some(f => f.status === "error");

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragging && "border-primary bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed",
          !isDragging && !disabled && "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={computedAccept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            isDragging ? "bg-primary/10" : "bg-muted"
          )}>
            <Upload className={cn(
              "w-6 h-6",
              isDragging ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          
          <div>
            <p className="font-medium text-foreground">
              {isDragging ? "Drop files here" : "Drag and drop or click to upload"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {mediaType === "image" && `Images up to ${constraints.image.maxSizeMB}MB (${constraints.image.acceptedExtensions.join(", ")})`}
              {mediaType === "video" && `Videos up to ${constraints.video.maxSizeMB}MB (${constraints.video.acceptedExtensions.join(", ")})`}
              {!mediaType && `Images up to ${constraints.image.maxSizeMB}MB, Videos up to ${constraints.video.maxSizeMB}MB`}
            </p>
          </div>
        </div>
      </div>

      {/* File list */}
      {hasFiles && (
        <div className="space-y-3">
          {files.map(uploadFile => (
            <div 
              key={uploadFile.id}
              className={cn(
                "flex items-center gap-4 p-3 rounded-lg border",
                uploadFile.status === "error" && "border-destructive/50 bg-destructive/5",
                uploadFile.status === "success" && "border-green-500/50 bg-green-500/5",
                uploadFile.status === "pending" && "border-border",
                uploadFile.status === "uploading" && "border-primary/50 bg-primary/5"
              )}
            >
              {/* Preview */}
              <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                {uploadFile.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={uploadFile.preview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : getFileType(uploadFile.file) === "video" ? (
                  <Film className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{uploadFile.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(uploadFile.file.size)}
                </p>
                
                {/* Progress bar */}
                {uploadFile.status === "uploading" && (
                  <Progress value={uploadFile.progress} className="h-1 mt-2" />
                )}
                
                {/* Error message */}
                {uploadFile.status === "error" && uploadFile.error && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {uploadFile.error}
                  </p>
                )}
              </div>

              {/* Status/Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {uploadFile.status === "success" && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                
                {uploadFile.status === "error" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      retryFile(uploadFile.id);
                    }}
                    className="h-8 px-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(uploadFile.id);
                  }}
                  className="h-8 px-2 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFiles}
              disabled={isUploading}
            >
              Clear All
            </Button>
            
            <Button
              size="sm"
              onClick={uploadFiles}
              disabled={isUploading || !hasPending}
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {files.filter(f => f.status === "pending").length} File{files.filter(f => f.status === "pending").length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MediaUploadZone;
