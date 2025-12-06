'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, Palette, Shield, Eye, EyeOff, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { supabase, isSupabaseAvailable } from '@/lib/supabase'
import { useAuth } from '@/components/providers'
import { toast } from '@/components/ui/use-toast'

interface BrandingSettings {
  id: string
  firm_id: string
  logo_url: string | null
  primary_color: string
  require_client_password: boolean
  show_powered_by: boolean
}

export default function BrandingSettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<BrandingSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

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
    fetchSettings()
  }, [user])

  const fetchSettings = async () => {
    if (!user || !supabase) return

    try {
      // Get user's firm
      const { data: userData } = await supabase!
        .from('users')
        .select('firm_id')
        .eq('id', user.id)
        .single()

      if (!userData?.firm_id) {
        // Create a firm for the user first
        const { data: newFirm, error: firmError } = await supabase!
          .from('firms')
          .insert({
            name: 'My Firm',
            slug: `firm-${user.id}`
          })
          .select()
          .single()

        if (firmError) throw firmError

        // Update user with firm_id
        await supabase!
          .from('users')
          .update({ firm_id: newFirm.id })
          .eq('id', user.id)

        // Create default settings
        const { data: newSettings, error } = await supabase!
          .from('branding_settings')
          .insert({
            firm_id: newFirm.id,
            primary_color: '#2563EB',
            require_client_password: false,
            show_powered_by: true
          })
          .select()
          .single()

        if (error) throw error
        setSettings(newSettings)
      } else {
        // Fetch existing settings
        const { data: settingsData, error } = await supabase!
          .from('branding_settings')
          .select('*')
          .eq('firm_id', userData.firm_id)
          .single()

        if (error && error.code !== 'PGRST116') throw error
        setSettings(settingsData || {
          id: '',
          firm_id: userData.firm_id,
          logo_url: null,
          primary_color: '#2563EB',
          require_client_password: false,
          show_powered_by: true
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast({
        title: "Error",
        description: "Failed to load branding settings.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    try {
      let logoUrl = settings.logo_url

      // Upload logo if changed
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `logo-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase!.storage
          .from('branding')
          .upload(fileName, logoFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase!.storage
          .from('branding')
          .getPublicUrl(fileName)

        logoUrl = publicUrl
      }

      // Update settings
      const { error } = await supabase!
        .from('branding_settings')
        .upsert({
          ...settings,
          logo_url: logoUrl
        })

      if (error) throw error

      setSettings({ ...settings, logo_url: logoUrl })
      setLogoFile(null)
      setLogoPreview(null)

      toast({
        title: "Settings saved",
        description: "Your branding settings have been updated successfully.",
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Error",
        description: "Failed to save branding settings.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-64"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-10 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-32"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Settings not available</h2>
        <p className="text-muted-foreground">
          Unable to load branding settings. Please try again.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Branding Settings</h1>
        <p className="text-muted-foreground">
          Customize your firm's branding and client portal appearance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Company Logo
            </CardTitle>
            <CardDescription>
              Upload your company logo to appear on client portals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                {logoPreview || settings.logo_url ? (
                  <img
                    src={logoPreview || settings.logo_url || ''}
                    alt="Logo preview"
                    className="w-full h-full object-contain rounded"
                  />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG up to 2MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Primary Color */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="h-5 w-5 mr-2" />
              Primary Color
            </CardTitle>
            <CardDescription>
              Choose your brand's primary color
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={settings.primary_color}
                onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                className="w-12 h-12 rounded border cursor-pointer"
              />
              <Input
                value={settings.primary_color}
                onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                className="font-mono"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              This color will be used for buttons and accents on client portals
            </p>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Security Options
            </CardTitle>
            <CardDescription>
              Configure security settings for client portals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="password-required">Require client password</Label>
                <p className="text-sm text-muted-foreground">
                  Clients must enter a password before accessing upload portals
                </p>
              </div>
              <Switch
                id="password-required"
                checked={settings.require_client_password}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, require_client_password: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Branding Visibility */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Branding Visibility
            </CardTitle>
            <CardDescription>
              Control Summit Secure branding on client portals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-powered-by">Show "Powered by Summit Secure"</Label>
                <p className="text-sm text-muted-foreground">
                  Display Summit Secure branding on client upload pages
                </p>
              </div>
              <Switch
                id="show-powered-by"
                checked={settings.show_powered_by}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, show_powered_by: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
