'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, User, FileText, Upload, Download, Lock, Unlock, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase, isSupabaseAvailable } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/components/providers'

interface AuditLogEntry {
  id: string
  action: string
  resource_type: string
  resource_id: string
  created_at: string
  user_id: string | null
  client_id: string | null
  ip_address: string | null
  metadata: Record<string, any>
  user?: {
    email: string
  }
  client?: {
    name: string
  }
}

interface AuditLogPanelProps {
  isOpen: boolean
  onClose: () => void
  clientId?: string
}

export function AuditLogPanel({ isOpen, onClose, clientId }: AuditLogPanelProps) {
  const { user } = useAuth()
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(false)

  // Check if Supabase is available
  if (!isSupabaseAvailable()) {
    return null
  }

  useEffect(() => {
    if (isOpen) {
      fetchAuditLog()
    }
  }, [isOpen, clientId])

  useEffect(() => {
    if (!isOpen) return

    // Set up realtime subscription for new audit entries
    const channel = supabase!
      .channel('audit_log_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_log',
          filter: clientId ? `client_id=eq.${clientId}` : undefined,
        },
        (payload) => {
          // Add new entry to the list
          const newEntry = payload.new as AuditLogEntry
          setEntries(prev => [newEntry, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase!.removeChannel(channel)
    }
  }, [isOpen, clientId])

  const fetchAuditLog = async () => {
    if (!user || !supabase) return

    setLoading(true)
    try {
      let query = supabase!
        .from('audit_log')
        .select(`
          *,
          user:users(email),
          client:clients(name)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (clientId) {
        query = query.eq('client_id', clientId)
      }

      const { data, error } = await query

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Error fetching audit log:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'upload':
        return <Upload className="h-4 w-4 text-green-500" />
      case 'download':
        return <Download className="h-4 w-4 text-blue-500" />
      case 'unlock':
        return <Unlock className="h-4 w-4 text-yellow-500" />
      case 'lock':
        return <Lock className="h-4 w-4 text-red-500" />
      case 'view':
        return <Eye className="h-4 w-4 text-purple-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'upload':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'download':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'unlock':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'lock':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'view':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background border-l border-border shadow-xl"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold">Audit Log</h2>
                  <p className="text-sm text-muted-foreground">
                    {clientId ? 'Client activity' : 'All activity'}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <ScrollArea className="flex-1 p-6">
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="animate-pulse space-y-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-muted rounded"></div>
                              <div className="h-4 bg-muted rounded w-20"></div>
                            </div>
                            <div className="h-3 bg-muted rounded w-32"></div>
                            <div className="h-3 bg-muted rounded w-24"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : entries.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                    <p className="text-muted-foreground">
                      Audit log entries will appear here as actions are performed.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {entries.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="mt-0.5">
                            {getActionIcon(entry.action)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge
                                variant="secondary"
                                className={getActionColor(entry.action)}
                              >
                                {entry.action}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(entry.created_at)}
                              </span>
                            </div>

                            <p className="text-sm mb-2">
                              {entry.user?.email && (
                                <span className="flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  {entry.user.email}
                                </span>
                              )}
                              {entry.client?.name && (
                                <span className="text-muted-foreground">
                                  {' • '}{entry.client.name}
                                </span>
                              )}
                            </p>

                            {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {entry.metadata.filename && (
                                  <p>File: {entry.metadata.filename}</p>
                                )}
                                {entry.metadata.file_size && (
                                  <p>Size: {entry.metadata.file_size} bytes</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
