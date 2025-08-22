'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, Loader2, Database } from 'lucide-react'

export const dynamic = 'force-dynamic';

export default function AdminSetupPage() {
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [setupResult, setSetupResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)

  const setupStorage = async () => {
    setIsSettingUp(true)
    setSetupResult(null)

    try {
      const response = await fetch('/api/admin/setup/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (response.ok) {
        setSetupResult({
          success: true,
          message: result.message,
          details: result.bucket
        })
      } else {
        setSetupResult({
          success: false,
          message: result.error || 'Setup failed',
          details: result.details
        })
      }
    } catch (error) {
      setSetupResult({
        success: false,
        message: 'Network error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsSettingUp(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Setup</h1>
          <p className="text-muted-foreground">
            Set up required infrastructure for the bookstore admin panel.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Storage Bucket Setup</span>
            </CardTitle>
            <CardDescription>
              Create the required storage bucket for book files and cover images.
              This is needed for file uploads to work properly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">What this will create:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Storage bucket named "books"</li>
                <li>• Public access for reading files</li>
                <li>• 50MB file size limit</li>
                <li>• Support for images (JPEG, PNG, WebP, GIF)</li>
                <li>• Support for documents (PDF, EPUB, TXT, DOCX)</li>
              </ul>
            </div>

            {setupResult && (
              <div className={`p-4 rounded-lg border ${
                setupResult.success 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {setupResult.success ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span className="font-medium">{setupResult.message}</span>
                </div>
                {setupResult.details && (
                  <pre className="text-xs mt-2 p-2 bg-black/10 rounded overflow-auto">
                    {JSON.stringify(setupResult.details, null, 2)}
                  </pre>
                )}
              </div>
            )}

            <Button 
              onClick={setupStorage} 
              disabled={isSettingUp}
              className="w-full"
            >
              {isSettingUp ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up storage...
                </>
              ) : (
                'Set Up Storage Bucket'
              )}
            </Button>

            {setupResult?.success && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  ✅ Storage setup complete! You can now upload book files and cover images.
                  <br />
                  <a href="/admin/books" className="underline font-medium">
                    Go to Book Management →
                  </a>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}