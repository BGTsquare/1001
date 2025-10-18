import React from 'react'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/services/email'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { to, subject, message } = body
    if (!to || !subject || !message) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Create a simple React element for the message to satisfy sendEmail's API
    const template = React.createElement('div', null, message)

    const res = await sendEmail({ to, subject, template })
    if (!res.success) {
      console.error('Failed to send email', res.error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
