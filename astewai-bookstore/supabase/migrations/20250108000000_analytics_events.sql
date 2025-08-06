  -- Analytics Events Table (Optional)
  -- This table stores analytics events for admin dashboard analysis
  -- Only created if STORE_ANALYTICS_EVENTS is enabled

  CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_name TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Create indexes for better query performance
  CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
  CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
  CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

  -- Create a composite index for common queries
  CREATE INDEX IF NOT EXISTS idx_analytics_events_name_date ON analytics_events(event_name, created_at);

  -- User Sessions Table for tracking active users
  CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Create indexes for user sessions
  CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
  CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON user_sessions(created_at);

  -- RLS Policies for analytics_events
  ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

  -- Only admins can read analytics events
  CREATE POLICY "Admins can read analytics events" ON analytics_events
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
      )
    );

  -- System can insert analytics events
  CREATE POLICY "System can insert analytics events" ON analytics_events
    FOR INSERT WITH CHECK (true);

  -- RLS Policies for user_sessions
  ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

  -- Users can read their own sessions
  CREATE POLICY "Users can read own sessions" ON user_sessions
    FOR SELECT USING (user_id = auth.uid());

  -- Admins can read all sessions
  CREATE POLICY "Admins can read all sessions" ON user_sessions
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
      )
    );

  -- System can insert and update sessions
  CREATE POLICY "System can manage sessions" ON user_sessions
    FOR ALL WITH CHECK (true);

  -- Function to clean up old analytics events (optional)
  CREATE OR REPLACE FUNCTION cleanup_old_analytics_events()
  RETURNS void AS $$
  BEGIN
    -- Delete events older than 90 days
    DELETE FROM analytics_events 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Delete sessions older than 30 days
    DELETE FROM user_sessions 
    WHERE created_at < NOW() - INTERVAL '30 days';
  END;
  $$ LANGUAGE plpgsql;

  -- Create a scheduled job to run cleanup (if pg_cron is available)
  -- SELECT cron.schedule('cleanup-analytics', '0 2 * * *', 'SELECT cleanup_old_analytics_events();');