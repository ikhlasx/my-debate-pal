// Use relative URL for same-origin requests (Vercel), or full URL for dev
// In production on Vercel, use '/api' (routes to api/index.py serverless function)
// In local dev, use 'http://localhost:8000' (routes to local FastAPI server)
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:8000');

import { supabase } from '@/contexts/AuthContext';

export interface SessionCreate {
  partner: 'husband' | 'wife';
  start_time: string;
  end_time?: string;
  duration?: number;
}

export interface SessionResponse {
  id: number;
  partner: 'husband' | 'wife';
  start_time: string;
  end_time?: string;
  duration?: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationCreate {
  type: string;
  title: string;
  message: string;
  partner?: 'husband' | 'wife';
  data?: Record<string, any>;
}

export interface WeeklyStats {
  week_start: string;
  week_end: string;
  husband: PartnerStats;
  wife: PartnerStats;
  overlap: OverlapStats;
  peak_day?: string;
  peak_time?: string;
  heatmap_data: HeatmapData[];
}

export interface MonthlyStats {
  year: number;
  month: number;
  husband: PartnerStats;
  wife: PartnerStats;
  overlap: OverlapStats;
  trend_data: TrendData[];
  winner?: 'husband' | 'wife';
  winner_reason?: string;
  peacekeeping_winner?: 'husband' | 'wife';
  calendar_heatmap: CalendarHeatmapData[];
}

export interface PartnerStats {
  total_sessions: number;
  total_time: number;
  average_duration: number;
  longest_session: number;
  shortest_session: number;
}

export interface OverlapStats {
  total_overlap_time: number;
  overlap_sessions: number;
  average_overlap_duration: number;
  longest_overlap: number;
}

export interface HeatmapData {
  date: string;
  intensity: number;
  husband_time: number;
  wife_time: number;
  overlap_time: number;
}

export interface TrendData {
  date: string;
  husband_time: number;
  wife_time: number;
  overlap_time: number;
}

export interface CalendarHeatmapData {
  date: string;
  day: number;
  intensity: number;
  husband_sessions: number;
  wife_sessions: number;
}

export interface DailyBreakdown {
  date: string;
  husband_sessions: number;
  wife_sessions: number;
  husband_time: number;
  wife_time: number;
  overlap_time: number;
  sessions: SessionResponse[];
}

export interface AnalyticsStats {
  total_debates: number;
  total_simultaneous: number;
  longest_debate_husband: number;
  longest_debate_wife: number;
  longest_simultaneous: number;
  most_active_day?: string;
  least_active_day?: string;
  debate_frequency_pattern: Record<string, number>;
  overlap_percentage: number;
  peaceful_days_count: number;
  current_streak: number;
  longest_streak: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    // Normalize baseUrl: remove trailing slash, ensure it's a clean URL
    this.baseUrl = baseUrl.trim().replace(/\/+$/, '');
  }

  private normalizeUrl(endpoint: string): string {
    // Remove leading slash from endpoint if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    // If baseUrl is empty or just '/', return the endpoint with leading slash
    if (!this.baseUrl || this.baseUrl === '/') {
      return `/${cleanEndpoint}`;
    }
    
    // If baseUrl is relative (starts with /), concatenate properly
    if (this.baseUrl.startsWith('/')) {
      return `${this.baseUrl}/${cleanEndpoint}`;
    }
    
    // If baseUrl is absolute, ensure proper concatenation
    return `${this.baseUrl}/${cleanEndpoint}`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.normalizeUrl(endpoint);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add Authorization header if session exists
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        (headers as any)['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch (authError) {
      // If auth check fails, continue without auth token
      // This allows the request to proceed and the backend will handle auth errors
      console.warn('Could not get auth session:', authError);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `API error: ${response.status} ${response.statusText}`;
        let errorDetail = '';
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorDetail = errorData.detail;
            errorMessage += ` - ${errorData.detail}`;
          } else if (errorData.message) {
            errorDetail = errorData.message;
            errorMessage += ` - ${errorData.message}`;
          }
          if (errorData.help) {
            errorMessage += `\n\nHelp: ${errorData.help}`;
          }
        } catch {
          // If response is not JSON, use status text
        }

        // Add helpful context for common errors
        if (response.status === 404) {
          errorMessage += `\n\nTroubleshooting:\n` +
            `1. Check if the backend is running\n` +
            `2. Verify API URL: ${this.baseUrl}\n` +
            `3. For Vercel: Ensure VITE_API_URL is not set (uses /api automatically)\n` +
            `4. For Railway: Set VITE_API_URL to your Railway URL (e.g., https://your-app.up.railway.app)`;
        } else if (response.status === 401) {
          errorMessage += `\n\nNote: Authentication is optional - the app will use demo mode if no token is provided.`;
        } else if (response.status === 500) {
          errorMessage += `\n\nBackend error. Check:\n` +
            `1. Supabase credentials are set in backend environment variables\n` +
            `2. Database tables exist (run migration SQL in Supabase)\n` +
            `3. Check backend logs for detailed error information`;
        }

        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).url = url;
        (error as any).detail = errorDetail;
        throw error;
      }

      return response.json();
    } catch (error: any) {
      // Enhance error with more context
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const isRelativeUrl = url.startsWith('/');
        const helpText = isRelativeUrl
          ? `Using relative URL (${url}). This works with Vercel serverless functions.\n` +
            `If you're on Railway, set VITE_API_URL to your Railway URL.`
          : `Using absolute URL (${url}).\n` +
            `Current API_BASE_URL: ${this.baseUrl}\n` +
            `Make sure the backend is running and accessible at this URL.`;
        
        throw new Error(
          `Network error: Cannot connect to API at ${url}.\n\n` +
          `Troubleshooting:\n` +
          `1. Check if the backend is running\n` +
          `2. Verify network connectivity\n` +
          `3. Check CORS settings on the backend\n` +
          `4. ${helpText}\n` +
          `5. Check browser console for CORS or network errors`
        );
      }
      throw error;
    }
  }

  // Session endpoints
  async createSession(session: SessionCreate): Promise<SessionResponse> {
    return this.request<SessionResponse>('/sessions', {
      method: 'POST',
      body: JSON.stringify(session),
    });
  }

  async getSessions(params?: {
    partner?: 'husband' | 'wife';
    start_date?: string;
    end_date?: string;
  }): Promise<SessionResponse[]> {
    const queryParams = new URLSearchParams();
    if (params?.partner) queryParams.append('partner', params.partner);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const query = queryParams.toString();
    return this.request<SessionResponse[]>(
      `/sessions${query ? `?${query}` : ''}`
    );
  }

  async getSession(sessionId: number): Promise<SessionResponse> {
    return this.request<SessionResponse>(`/sessions/${sessionId}`);
  }

  async updateSession(
    sessionId: number,
    updates: { end_time?: string; duration?: number }
  ): Promise<SessionResponse> {
    return this.request<SessionResponse>(`/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteSession(sessionId: number): Promise<void> {
    await this.request<void>(`/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // Notification endpoints
  async createNotification(
    notification: NotificationCreate
  ): Promise<any> {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  }

  async getNotifications(params?: {
    partner?: 'husband' | 'wife';
    limit?: number;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.partner) queryParams.append('partner', params.partner);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request<any[]>(
      `/notifications${query ? `?${query}` : ''}`
    );
  }

  // Analytics endpoints
  async getWeeklyStats(weekStart?: string): Promise<WeeklyStats> {
    const query = weekStart ? `?week_start=${weekStart}` : '';
    return this.request<WeeklyStats>(`/analytics/weekly${query}`);
  }

  async getMonthlyStats(year: number, month: number): Promise<MonthlyStats> {
    return this.request<MonthlyStats>(
      `/analytics/monthly?year=${year}&month=${month}`
    );
  }

  async getAnalyticsStats(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<AnalyticsStats> {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const query = queryParams.toString();
    return this.request<AnalyticsStats>(
      `/analytics/stats${query ? `?${query}` : ''}`
    );
  }

  async getDailyStats(date: string): Promise<DailyBreakdown> {
    return this.request<DailyBreakdown>(`/analytics/daily/${date}`);
  }

  async getHeatmapData(startDate: string, endDate: string): Promise<HeatmapData[]> {
    return this.request<HeatmapData[]>(
      `/analytics/heatmap?start_date=${startDate}&end_date=${endDate}`
    );
  }
}

export const apiClient = new ApiClient();

// WebSocket client - DEPRECATED: Use Supabase Realtime instead
// Kept for backward compatibility, but will be replaced by Supabase Realtime
// See src/lib/supabaseClient.ts for the new implementation
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(baseUrl: string = API_BASE_URL) {
    // Handle relative URLs (for Vercel) vs absolute URLs (for local dev)
    if (baseUrl.startsWith('/')) {
      // Relative URL (Vercel) - use wss for production
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // baseUrl is already /api, so just add /ws
      this.url = `${protocol}//${window.location.host}${baseUrl}/ws`;
    } else {
      // Absolute URL (local dev) - convert http://localhost:8000 to ws://localhost:8000
      this.url = `${baseUrl.replace('http', 'ws')}/ws`;
    }
  }

  connect(): void {
    // WebSocket is not supported on Vercel serverless functions
    // This will fail silently - use Supabase Realtime instead
    console.warn('WebSocket is not supported on Vercel. Use Supabase Realtime instead.');
  }

  private reconnect(): void {
    // No-op: WebSocket not supported
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
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Export for backward compatibility - but use supabaseRealtimeClient instead
export const wsClient = new WebSocketClient();

