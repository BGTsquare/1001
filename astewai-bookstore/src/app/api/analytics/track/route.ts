/**
 * Analytics Tracking API Route
 * Server-side endpoint for tracking custom events
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { trackEvent } from '@/lib/analytics';

interface TrackingRequest {
  event: string;
  data?: Record<string, any>;
  userId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TrackingRequest = await request.json();
    const { event, data, userId } = body;

    if (!event) {
      return NextResponse.json(
        { error: 'Event name is required' },
        { status: 400 }
      );
    }

    // Get user context if available
    let userContext = {};
    if (userId) {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, display_name, role')
        .eq('id', userId)
        .single();

      if (profile) {
        userContext = {
          user_id: profile.id,
          user_email: profile.email,
          user_role: profile.role,
        };
      }
    }

    // Add request context
    const requestContext = {
      timestamp: new Date().toISOString(),
      user_agent: request.headers.get('user-agent') || undefined,
      referer: request.headers.get('referer') || undefined,
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown',
    };

    // Combine all context
    const eventData = {
      ...data,
      ...userContext,
      ...requestContext,
    };

    // Track the event
    trackEvent(event, eventData);

    // Store in database for admin analytics (optional)
    if (process.env.STORE_ANALYTICS_EVENTS === 'true') {
      const supabase = await createClient();
      await supabase
        .from('analytics_events')
        .insert({
          event_name: event,
          event_data: eventData,
          user_id: userId || null,
          created_at: new Date().toISOString(),
        });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}