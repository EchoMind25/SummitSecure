'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, FileText, Users, Shield, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase, isSupabaseAvailable } from '@/lib/supabase'
import { useAuth } from '@/components/providers'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

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

interface RecentFile {
  id: string
  filename: string
  original_name: string
  created_at: string
  client: {
    name: string
  }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([])
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
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    if (!user || !supabase) return

    try {
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase!
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6)

      if (clientsError) throw clientsError

      // Fetch recent files with client info
      const { data: filesData, error: filesError } = await supabase!
        .from('files')
        .select(`
          id,
          filename,
          original_name,
          created_at,
          clients(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (filesError) throw filesError

      // Transform the files data to match our interface
      const transformedFiles = (filesData || []).map((file: any) => ({
        ...file,
        client: Array.isArray(file.clients) ? file.clients[0] : file.clients
      }))

      setClients(clientsData || [])
      setRecentFiles(transformedFiles)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = [
    {
      title: 'Total Clients',
      value: clients.length.toString(),
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Files Received',
      value: recentFiles.length.toString(),
      icon: FileText,
      color: 'text-green-600'
    },
    {
      title: 'Active Sessions',
      value: '12',
      icon: Shield,
      color: 'text-purple-600'
    },
    {
      title: 'This Month',
      value: '98%',
      icon: Clock,
      color: 'text-orange-600'
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-16"></div>
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
      {/* Welcome section */}
      <div>
        <h2 className="text-3xl font-bold mb-2">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
        </h2>
        <p className="text-muted-foreground">
          Here's what's happening with your client files today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent clients */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Clients</CardTitle>
                <CardDescription>
                  Your most recently added clients
                </CardDescription>
              </div>
              <Link href="/clients">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No clients found matching your search.' : 'No clients yet. Add your first client to get started.'}
                    </p>
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <Link key={client.id} href={`/clients/${client.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                            {client.name[0]?.toUpperCase() || 'C'}
                          </div>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {client.email || 'No email'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">
                            {client._count?.files || 0} files
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest file uploads from your clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentFiles.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No recent file uploads.
                  </p>
                </div>
              ) : (
                recentFiles.map((file) => (
                  <div key={file.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.original_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {file.client.name} • {formatDate(file.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
