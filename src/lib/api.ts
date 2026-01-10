// Use relative URL for same-origin requests (Vercel), or full URL for dev
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:8000');

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
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Session endpoints
  async createSession(session: SessionCreate): Promise<SessionResponse> {
    return this.request<SessionResponse>('/api/sessions', {
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
      `/api/sessions${query ? `?${query}` : ''}`
    );
  }

  async getSession(sessionId: number): Promise<SessionResponse> {
    return this.request<SessionResponse>(`/api/sessions/${sessionId}`);
  }

  async updateSession(
    sessionId: number,
    updates: { end_time?: string; duration?: number }
  ): Promise<SessionResponse> {
    return this.request<SessionResponse>(`/api/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteSession(sessionId: number): Promise<void> {
    await this.request<void>(`/api/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // Notification endpoints
  async createNotification(
    notification: NotificationCreate
  ): Promise<any> {
    return this.request('/api/notifications', {
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
      `/api/notifications${query ? `?${query}` : ''}`
    );
  }

  // Analytics endpoints
  async getWeeklyStats(weekStart?: string): Promise<WeeklyStats> {
    const query = weekStart ? `?week_start=${weekStart}` : '';
    return this.request<WeeklyStats>(`/api/analytics/weekly${query}`);
  }

  async getMonthlyStats(year: number, month: number): Promise<MonthlyStats> {
    return this.request<MonthlyStats>(
      `/api/analytics/monthly?year=${year}&month=${month}`
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
      `/api/analytics/stats${query ? `?${query}` : ''}`
    );
  }

  async getDailyStats(date: string): Promise<DailyBreakdown> {
    return this.request<DailyBreakdown>(`/api/analytics/daily/${date}`);
  }

  async getHeatmapData(startDate: string, endDate: string): Promise<HeatmapData[]> {
    return this.request<HeatmapData[]>(
      `/api/analytics/heatmap?start_date=${startDate}&end_date=${endDate}`
    );
  }
}

export const apiClient = new ApiClient();

// WebSocket client
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
      this.url = `${protocol}//${window.location.host}${baseUrl}/ws`;
    } else {
      // Absolute URL (local dev)
      this.url = `${baseUrl.replace('http', 'ws')}/ws`;
    }
  }

  connect(): void {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.emit(message.type, message.data);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.reconnect();
      };
    } catch (e) {
      console.error('Failed to connect WebSocket:', e);
      this.reconnect();
    }
  }

  private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      setTimeout(() => this.connect(), delay);
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
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsClient = new WebSocketClient();

