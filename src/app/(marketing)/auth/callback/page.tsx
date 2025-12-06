'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/components/ui/use-toast'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if we have auth tokens in the URL
        const hash = window.location.hash
        if (hash && hash.includes('access_token')) {
          // Redirect to API route for proper handling
          const cleanUrl = window.location.pathname + window.location.search
          window.location.href = `/api/auth/callback${window.location.search}${window.location.hash}`
          return
        }

        // If no tokens, redirect to login
        setStatus('error')
        setTimeout(() => {
          router.push('/login?error=no_auth_tokens')
        }, 2000)

      } catch (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setTimeout(() => {
          router.push('/login?error=auth_callback_error')
        }, 2000)
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        {status === 'loading' && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-6"
            />
            <h1 className="text-2xl font-bold mb-2">Signing you in...</h1>
            <p className="text-muted-foreground">Please wait while we complete your authentication.</p>
          </>
        )}

        {status === 'error' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Shield className="h-8 w-8 text-red-600" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold mb-2"
            >
              Authentication Error
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-muted-foreground"
            >
              Redirecting you back to login...
            </motion.p>
          </>
        )}
      </motion.div>
    </div>
  )
}
