'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, MoreHorizontal, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { supabase, isSupabaseAvailable } from '@/lib/supabase'
import { useAuth } from '@/components/providers'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { toast } from '@/components/ui/use-toast'

interface Client {
  id: string
  name: string
  email: string | null
  share_id: string
  created_at: string
  _count?: {
    files: number
  }
}

export default function ClientsPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Check if Supabase is available
  if (!isSupabaseAvailable()) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Configuration Error</h2>
        <p className="text-muted-foreground">
          Supabase is not properly configured. Please check your environment variables.
        </p>
      </div>
    )
  }

  useEffect(() => {
    fetchClients()
  }, [user])

  const fetchClients = async () => {
    if (!user || !supabase) return

    try {
      const { data, error } = await supabase!
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast({
        title: "Error",
        description: "Failed to load clients. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const copyShareLink = async (shareId: string) => {
    const link = `${window.location.origin}/drop/${shareId}`
    try {
      await navigator.clipboard.writeText(link)
      toast({
        title: "Link copied",
        description: "Share link has been copied to clipboard.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      })
    }
  }

  const openShareLink = (shareId: string) => {
    const link = `${window.location.origin}/drop/${shareId}`
    window.open(link, '_blank')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-muted-foreground">Manage your client file portals</p>
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse flex items-center space-x-4">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-48"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage your client file portals</p>
        </div>
        <Link href="/clients/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clients list */}
      <div className="space-y-4">
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No clients found' : 'No clients yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'Try adjusting your search terms.'
                  : 'Create your first client to start receiving secure file uploads.'
                }
              </p>
              {!searchQuery && (
                <Link href="/clients/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Client
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <Link href={`/clients/${client.id}`} className="flex-1">
                      <div className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity">
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                          {client.name[0]?.toUpperCase() || 'C'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{client.name}</h3>
                          <p className="text-muted-foreground">{client.email || 'No email'}</p>
                          <p className="text-sm text-muted-foreground">
                            Created {formatDate(client.created_at)}
                          </p>
                        </div>
                      </div>
                    </Link>

                    <div className="flex items-center space-x-4">
                      <Badge variant="secondary">
                        {client._count?.files || 0} files
                      </Badge>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => copyShareLink(client.share_id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Share Link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openShareLink(client.share_id)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Portal
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
