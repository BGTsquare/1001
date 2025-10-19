"use client"

import React, { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

// This is the new type that matches our database table
export type Submission = {
  id: string
  created_at: string
  status: 'pending' | 'approved' | 'rejected'
  storage_path: string
  users: { email: string | null } | null // Assuming a 'users' table with profiles
}

// Client component to handle interactions
function SubmissionsClient({ initialSubmissions }: { initialSubmissions: Submission[] }) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/admin/submissions/${id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      )

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || 'Failed to update submission.')
      }

      toast.success(`Submission ${status}.`)

      // Refresh the data on the page
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      console.error(error)
      toast.error(error.message)
    }
  }

  const viewReceipt = async (path: string) => {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('receipts') // Corrected bucket name
      .createSignedUrl(path, 60) // 60 seconds expiry

    if (error) {
      toast.error('Could not generate receipt URL.')
      console.error(error)
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Submissions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell>{new Date(submission.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{submission.users?.email || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={submission.status === 'approved' ? 'default' : submission.status === 'rejected' ? 'destructive' : 'secondary'}>
                    {submission.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => viewReceipt(submission.storage_path)}>
                      View Receipt
                    </Button>
                    {submission.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => handleUpdateStatus(submission.id, 'approved')} disabled={isPending}>
                          {isPending ? '...' : 'Approve'}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(submission.id, 'rejected')} disabled={isPending}>
                          {isPending ? '...' : 'Reject'}
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// Server Component to fetch data securely
export default async function SubmissionsDashboard() {
  // This part runs on the server
  const { supabaseAdmin } = await import('@/lib/supabase/admin')
  
  const { data, error } = await supabaseAdmin
    .from('manual_payment_submissions')
    .select(`
      id,
      created_at,
      status,
      storage_path,
      users ( email )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="text-red-500">Error loading submissions: {error.message}</div>
  }

  return <SubmissionsClient initialSubmissions={data as Submission[]} />
}