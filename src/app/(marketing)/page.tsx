'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Shield, Lock, Users, FileText, ArrowRight, X, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useAuth } from '@/components/providers'

export default function LandingPage() {
  const { user, loading } = useAuth()
  const [showDemo, setShowDemo] = useState(false)

  // Don't auto-redirect authenticated users - let them choose what to do

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Summit Secure</span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/login">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
                Client files that never hit
                <span className="text-primary block">your inbox. Ever.</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Secure file sharing portal for accountants, attorneys, and consultants.
                Professional, encrypted, and completely inbox-free.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              {user ? (
                <Link href="/dashboard">
                  <Button size="lg" className="text-lg px-8 py-3">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button size="lg" className="text-lg px-8 py-3">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-3"
                onClick={() => setShowDemo(true)}
              >
                <Play className="h-4 w-4 mr-2" />
                See 2-Minute Demo
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <svg
            className="absolute left-[max(50%,25rem)] top-0 h-[64rem] w-[128rem] -translate-x-1/2 stroke-border [mask-image:radial-gradient(64rem_64rem_at_top,white,transparent)]"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="e813992c-7d03-4cc4-a2bd-151760b470a0"
                width={200}
                height={200}
                x="50%"
                y={-1}
                patternUnits="userSpaceOnUse"
              >
                <path d="M100 200V.5M.5 .5H200" fill="none" />
              </pattern>
            </defs>
            <rect
              width="100%"
              height="100%"
              strokeWidth={0}
              fill="url(#e813992c-7d03-4cc4-a2bd-151760b470a0)"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Professional-grade security for professional services
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built specifically for accountants, attorneys, and consultants who demand the highest standards of security and professionalism.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Lock,
                title: "End-to-End Encryption",
                description: "Files are encrypted in transit and at rest. Only authorized users can access client files."
              },
              {
                icon: Users,
                title: "Client-First Experience",
                description: "Simple drag-and-drop interface for clients. No technical knowledge required."
              },
              {
                icon: FileText,
                title: "Complete Audit Trail",
                description: "Track every file upload, download, and access with detailed timestamps and IP logging."
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow"
              >
                <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps to secure file sharing
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Create Client Portal",
                description: "Set up a secure drop page for each client with optional password protection."
              },
              {
                step: "2",
                title: "Share Link",
                description: "Send your client a simple link. No accounts, no downloads, no hassle."
              },
              {
                step: "3",
                title: "Receive Files Securely",
                description: "Files appear instantly in your dashboard. Review, unlock, and download as needed."
              }
            ].map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center relative"
              >
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to secure your client files?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of professionals who trust Summit Secure with their most sensitive documents.
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-semibold">Summit Secure</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 Summit Secure. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      <Dialog open={showDemo} onOpenChange={setShowDemo}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <div className="relative w-full h-full">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10"
              onClick={() => setShowDemo(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Play className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Demo Video</h3>
                <p className="text-muted-foreground mb-4">
                  Watch how Summit Secure transforms client file sharing
                </p>
                <p className="text-sm text-muted-foreground">
                  [Demo video would be embedded here - showing drag-and-drop uploads,
                  file unlocking, and the complete workflow]
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
