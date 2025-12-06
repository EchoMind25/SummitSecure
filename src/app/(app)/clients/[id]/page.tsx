'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Unlock, Download, Eye, FileText, Image, File, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase, isSupabaseAvailable } from '@/lib/supabase'
import { useAuth } from '@/components/providers'
import { formatDate, formatFileSize } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import { AuditLogPanel } from '@/components/audit-log-panel'
import { playUnlockSound } from '@/lib/sounds'

interface File {
  id: string
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  storage_path: string
  is_locked: boolean
  unlocked_at: string | null
  created_at: string
}

interface Client {
  id: string
  name: string
  email: string | null
  share_id: string
  created_at: string
}

export default function ClientDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [unlockDialog, setUnlockDialog] = useState(false)
  const [unlockCode, setUnlockCode] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const [auditLogOpen, setAuditLogOpen] = useState(false)
  const [configError, setConfigError] = useState(false)

  // Check if Supabase is available and fetch data
  useEffect(() => {
    if (!isSupabaseAvailable()) {
      setConfigError(true)
      setLoading(false)
      return
    }

    if (id && user) {
      fetchClientData()
    }
  }, [id, user])

  // Show config error if Supabase is not available
  if (configError) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Configuration Error</h2>
        <p className="text-muted-foreground">
          Supabase is not properly configured. Please check your environment variables.
        </p>
      </div>
    )
  }

  const fetchClientData = async () => {
    if (!user || !id || !supabase) return

    try {
      // Fetch client details
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

      if (clientError) throw clientError
      setClient(clientData)

      // Fetch client files
      const { data: filesData, error: filesError } = await supabase!
        .from('files')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false })

      if (filesError) throw filesError
      setFiles(filesData || [])
    } catch (error) {
      console.error('Error fetching client data:', error)
      toast({
        title: "Error",
        description: "Failed to load client data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnlock = async () => {
    if (unlockCode !== '000000') {
      toast({
        title: "Invalid code",
        description: "Please enter the correct unlock code.",
        variant: "destructive",
      })
      return
    }

    setUnlocking(true)
    try {
      const { error } = await supabase!.rpc('unlock_client_files', {
        p_client_id: id as string
      })

      if (error) throw error

      // Update local state
      setFiles(files.map(file => ({ ...file, is_locked: false })))
      setUnlockDialog(false)
      setUnlockCode('')

      // Play unlock sound
      playUnlockSound()

      toast({
        title: "Files unlocked",
        description: "All client files have been unlocked successfully.",
      })
    } catch (error) {
      console.error('Error unlocking files:', error)
      toast({
        title: "Error",
        description: "Failed to unlock files. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUnlocking(false)
    }
  }

  const downloadFile = async (file: File) => {
    try {
      const { data, error } = await supabase!.storage
        .from('files')
        .download(file.storage_path)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.original_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Download started",
        description: `${file.original_name} is being downloaded.`,
      })
    } catch (error) {
      console.error('Error downloading file:', error)
      toast({
        title: "Download failed",
        description: "Failed to download the file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image
    if (mimeType.includes('pdf')) return FileText
    return File
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-64"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="w-12 h-12 bg-muted rounded mb-3"></div>
                  <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-24"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Client not found</h2>
        <p className="text-muted-foreground mb-4">
          The client you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button onClick={() => router.push('/clients')}>
          Back to Clients
        </Button>
      </div>
    )
  }

  const lockedFiles = files.filter(file => file.is_locked)
  const unlockedFiles = files.filter(file => !file.is_locked)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground">
            {client.email} • {files.length} files uploaded
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant={lockedFiles.length > 0 ? "destructive" : "secondary"}>
            {lockedFiles.length} locked, {unlockedFiles.length} unlocked
          </Badge>
          <Button variant="outline" onClick={() => setAuditLogOpen(true)}>
            <History className="h-4 w-4 mr-2" />
            Audit Log
          </Button>
          {lockedFiles.length > 0 && (
            <Button onClick={() => setUnlockDialog(true)}>
              <Unlock className="h-4 w-4 mr-2" />
              Unlock Files
            </Button>
          )}
        </div>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {files.map((file, index) => {
            const FileIcon = getFileIcon(file.mime_type)
            const isLocked = file.is_locked

            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className={`relative overflow-hidden ${isLocked ? 'filter blur-sm' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <FileIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate text-sm">
                          {file.original_name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.file_size)} • {formatDate(file.created_at)}
                        </p>
                      </div>
                    </div>

                    {!isLocked && (
                      <div className="mt-3 flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => downloadFile(file)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {isLocked && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                        <Lock className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {files.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No files yet</h3>
          <p className="text-muted-foreground mb-4">
            This client hasn't uploaded any files yet.
          </p>
          <p className="text-sm text-muted-foreground">
            Share link: {`${window.location.origin}/drop/${client.share_id}`}
          </p>
        </div>
      )}

      {/* Unlock Dialog */}
      <Dialog open={unlockDialog} onOpenChange={setUnlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock Client Files</DialogTitle>
            <DialogDescription>
              Enter the 6-digit unlock code to access all files for {client.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <Input
                type="text"
                placeholder="000000"
                value={unlockCode}
                onChange={(e) => setUnlockCode(e.target.value)}
                className="text-center text-2xl font-mono tracking-widest w-32"
                maxLength={6}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setUnlockDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUnlock}
                disabled={unlocking || unlockCode.length !== 6}
              >
                {unlocking ? 'Unlocking...' : 'Unlock Files'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Audit Log Panel */}
      <AuditLogPanel
        isOpen={auditLogOpen}
        onClose={() => setAuditLogOpen(false)}
        clientId={id as string}
      />
    </div>
  )
}
