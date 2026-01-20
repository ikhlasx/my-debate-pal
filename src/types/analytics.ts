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

export interface DailyBreakdown {
    date: string;
    husband_sessions: number;
    wife_sessions: number;
    husband_time: number;
    wife_time: number;
    overlap_time: number;
    sessions: any[]; // relaxed type for now
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
