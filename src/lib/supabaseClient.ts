import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
// These should be set in Vercel Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.'
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Realtime subscription manager for debate sessions
export class SupabaseRealtimeClient {
  private channel: ReturnType<typeof supabase.channel> | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    // Channel will be created when needed
  }

  connect(): void {
    if (this.channel) {
      console.log('Supabase Realtime already connected');
      return;
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Cannot connect to Supabase Realtime: credentials missing');
      return;
    }

    try {
      // Create a channel for database changes
      this.channel = supabase
        .channel('debate-sessions-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'debate_sessions',
          },
          (payload) => {
            console.log('Debate session change received:', payload);
            // Emit event based on the operation type
            const eventType = this.mapPostgresEventToEventType(payload.eventType);
            this.emit(eventType, payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
          },
          (payload) => {
            console.log('Notification change received:', payload);
            this.emit('notification', payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Supabase Realtime connected');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Supabase Realtime channel error');
          } else if (status === 'TIMED_OUT') {
            console.warn('Supabase Realtime connection timed out');
          } else if (status === 'CLOSED') {
            console.log('Supabase Realtime channel closed');
          }
        });
    } catch (error) {
      console.error('Failed to connect to Supabase Realtime:', error);
    }
  }

  private mapPostgresEventToEventType(eventType: string): string {
    switch (eventType) {
      case 'INSERT':
        return 'session_created';
      case 'UPDATE':
        return 'session_updated';
      case 'DELETE':
        return 'session_deleted';
      default:
        return 'session_changed';
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  disconnect(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
      console.log('Supabase Realtime disconnected');
    }
  }
}

// Export singleton instance
export const supabaseRealtimeClient = new SupabaseRealtimeClient();
