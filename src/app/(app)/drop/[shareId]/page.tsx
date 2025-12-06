'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, X, CheckCircle, Shield, Lock, Eye, EyeOff } from 'lucide-react'
import Confetti from 'react-confetti'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase, isSupabaseAvailable } from '@/lib/supabase'
import { formatFileSize } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import { playSuccessSound } from '@/lib/sounds'

interface Client {
  id: string
  name: string
  email: string | null
  firm_id: string
}

interface BrandingSettings {
  logo_url: string | null
  primary_color: string
  require_client_password: boolean
  show_powered_by: boolean
}

interface UploadFile extends File {
  id: string
  preview?: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
}

export default function DropPage() {
  const { shareId } = useParams()
  const [client, setClient] = useState<Client | null>(null)
  const [branding, setBranding] = useState<BrandingSettings | null>(null)
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check if Supabase is available
  if (!isSupabaseAvailable()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Configuration Error</h2>
          <p className="text-muted-foreground">
            The file upload service is not properly configured.
          </p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    fetchClientData()
  }, [shareId])

  const fetchClientData = async () => {
    if (!shareId || !supabase) return

    try {
      // Fetch client by share_id
      const { data: clientData, error: clientError } = await supabase!
        .from('clients')
        .select('*')
        .eq('share_id', shareId)
        .single()

      if (clientError) throw clientError
      setClient(clientData)

      // Fetch branding settings
      const { data: brandingData, error: brandingError } = await supabase!
        .from('branding_settings')
        .select('*')
        .eq('firm_id', clientData.firm_id)
        .single()

      if (brandingError) {
        // Use defaults if no branding settings
        setBranding({
          logo_url: null,
          primary_color: '#2563EB',
          require_client_password: false,
          show_powered_by: true
        })
      } else {
        setBranding(brandingData)
      }

      // Check if password is required
      if (!brandingData?.require_client_password) {
        setAuthenticated(true)
      }
    } catch (error) {
      console.error('Error fetching client data:', error)
      toast({
        title: "Error",
        description: "Invalid or expired share link.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = () => {
    // For demo purposes, accept any password
    setAuthenticated(true)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    addFiles(selectedFiles)
  }

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map(file => ({
      ...file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending'
    }))

    setFiles(prev => [...prev, ...uploadFiles])

    // Generate previews for images
    uploadFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFiles(prev => prev.map(f =>
            f.id === file.id
              ? { ...f, preview: e.target?.result as string }
              : f
          ))
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const uploadFiles = async () => {
    if (!client || files.length === 0) return

    setUploading(true)

    try {
      for (const file of files) {
        setFiles(prev => prev.map(f =>
          f.id === file.id ? { ...f, status: 'uploading' } : f
        ))

        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
        const filePath = `files/${client.id}/${fileName}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase!.storage
          .from('files')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Save file metadata to database
        const { error: dbError } = await supabase!
          .from('files')
          .insert({
            client_id: client.id,
            firm_id: client.firm_id,
            filename: fileName,
            original_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            storage_path: filePath,
            is_locked: true
          })

        if (dbError) throw dbError

        setFiles(prev => prev.map(f =>
          f.id === file.id ? { ...f, status: 'completed', progress: 100 } : f
        ))
      }

      setUploaded(true)
      setShowConfetti(true)

      // Play success sound
      playSuccessSound()

      // Hide confetti after 5 seconds
      setTimeout(() => setShowConfetti(false), 5000)

      toast({
        title: "Upload complete!",
        description: `Successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''}.`,
      })

    } catch (error) {
      console.error('Error uploading files:', error)
      toast({
        title: "Upload failed",
        description: "Some files failed to upload. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Invalid Link</h2>
            <p className="text-muted-foreground">
              This share link is invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Password authentication screen
  if (branding?.require_client_password && !authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle>Secure Upload Portal</CardTitle>
              <CardDescription>
                Enter the password provided by {client.name} to access the upload area.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <Button
                className="w-full"
                onClick={handlePasswordSubmit}
                disabled={!password.trim()}
              >
                Access Portal
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Success screen
  if (uploaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
        {showConfetti && (
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={200}
          />
        )}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="h-8 w-8 text-green-600" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold mb-2"
          >
            Upload Complete!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-muted-foreground mb-6"
          >
            Your files have been securely uploaded and will be reviewed by {client.name}.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Button onClick={() => window.location.reload()}>
              Upload More Files
            </Button>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            {branding?.logo_url ? (
              <img src={branding.logo_url} alt="Logo" className="h-12 mx-auto mb-4" />
            ) : (
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
            )}
            <h1 className="text-2xl font-bold mb-2">Secure File Upload</h1>
            <p className="text-muted-foreground">
              Upload files securely for {client.name}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8">
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                ${files.length > 0 ? 'border-solid' : ''}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />

              <div className="space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>

                {files.length === 0 ? (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Drop files here or click to browse
                      </h3>
                      <p className="text-muted-foreground">
                        Support for all file types • Maximum 100MB per file
                      </p>
                    </div>
                    <Button variant="outline">
                      Choose Files
                    </Button>
                  </>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {files.length} file{files.length > 1 ? 's' : ''} selected
                    </h3>
                    <Button onClick={uploadFiles} disabled={uploading}>
                      {uploading ? 'Uploading...' : 'Upload Files'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* File List */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 space-y-3"
                >
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {file.preview ? (
                          <img
                            src={file.preview}
                            alt={file.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            <File className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          file.status === 'completed' ? 'default' :
                          file.status === 'error' ? 'destructive' :
                          'secondary'
                        }>
                          {file.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Footer */}
        {branding?.show_powered_by && (
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Powered by Summit Secure
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
