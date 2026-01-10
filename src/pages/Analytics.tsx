import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Crown, Trophy, TrendingUp, TrendingDown, Clock, Calendar as CalendarIcon, Activity, Flame, Heart, Zap, ArrowUpRight, ArrowDownRight, Minus, Sparkles, Target, Award } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { apiClient, WeeklyStats, MonthlyStats, AnalyticsStats, DailyBreakdown, CalendarHeatmapData } from '@/lib/api';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, eachDayOfInterval, subMonths } from 'date-fns';
import { 
  loadSessionsFromStorage, 
  calculateWeeklyStatsFromSessions, 
  calculateMonthlyStatsFromSessions,
  calculateGeneralStatsFromSessions,
  calculateDailyBreakdownFromSessions
} from '@/lib/analyticsUtils';
import { getPartnerName } from '@/lib/partnerSettings';
import { generateFakeLastMonthStats, generateFakeMonthlyStats, generateFakeLastWeekStats, generateFakeGeneralStats, generateFakeLastMonthSessions, calculateMonthComparison, MonthComparison } from '@/lib/fakeDataGenerator';
import { useDemoMode } from '@/hooks/useDemoMode';

// Custom colors for the charts
const COLORS = {
  husband: '#6366f1', // Indigo
  wife: '#ec4899', // Pink
  overlap: '#f59e0b', // Amber
  positive: '#10b981', // Emerald
  negative: '#ef4444', // Red
  neutral: '#6b7280', // Gray
};

const Analytics = () => {
  const { isDemoMode } = useDemoMode();
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [lastMonthStats, setLastMonthStats] = useState<MonthlyStats | null>(null);
  const [generalStats, setGeneralStats] = useState<AnalyticsStats | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dailyBreakdown, setDailyBreakdown] = useState<DailyBreakdown | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [monthComparison, setMonthComparison] = useState<MonthComparison | null>(null);

  // Load fake data for last month on mount (for comparison)
  useEffect(() => {
    const fakeLastMonth = generateFakeLastMonthStats();
    setLastMonthStats(fakeLastMonth);
  }, []);

  // Load weekly stats
  useEffect(() => {
    const loadWeeklyStats = async () => {
      try {
        if (isDemoMode) {
          // Use fake data for demo mode
          const fakeStats = generateFakeLastWeekStats();
          setWeeklyStats(fakeStats);
          return;
        }

        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
        
        // REAL USER MODE: Always use Supabase backend
        try {
          const stats = await apiClient.getWeeklyStats(weekStart.toISOString());
          setWeeklyStats(stats);
          return;
        } catch (error) {
          console.error('Failed to load weekly stats from Supabase API:', error);
          console.error('Make sure the backend is running with main_supabase.py');
          // Fallback to localStorage as last resort
          const sessions = loadSessionsFromStorage();
          const stats = calculateWeeklyStatsFromSessions(sessions, weekStart, weekEnd);
          setWeeklyStats(stats);
        }
      } catch (error) {
        console.error('Failed to load weekly stats:', error);
      }
    };
    loadWeeklyStats();
  }, [isDemoMode]);

  // Load monthly stats
  useEffect(() => {
    const loadMonthlyStats = async () => {
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        
        // Check if viewing last month - use fake data for comparison
        const lastMonth = subMonths(new Date(), 1);
        const isLastMonth = year === lastMonth.getFullYear() && month === lastMonth.getMonth() + 1;
        
        if (isDemoMode) {
          // Use fake data for demo mode
          if (isLastMonth && lastMonthStats) {
            setMonthlyStats(lastMonthStats);
          } else {
            // Generate fake data for current month or other months
            const targetDate = new Date(year, month - 1, 1);
            const fakeStats = generateFakeMonthlyStats(targetDate);
            setMonthlyStats(fakeStats);
          }
          return;
        }
        
        if (isLastMonth && lastMonthStats) {
          setMonthlyStats(lastMonthStats);
          return;
        }
        
        // REAL USER MODE: Always use Supabase backend
        try {
          const stats = await apiClient.getMonthlyStats(year, month);
          setMonthlyStats(stats);
          return;
        } catch (error) {
          console.error('Failed to load monthly stats from Supabase API:', error);
          console.error('Make sure the backend is running with main_supabase.py');
          // Fallback to localStorage as last resort
          const sessions = loadSessionsFromStorage();
          const stats = calculateMonthlyStatsFromSessions(sessions, year, month);
          setMonthlyStats(stats);
        }
      } catch (error) {
        console.error('Failed to load monthly stats:', error);
      }
    };
    loadMonthlyStats();
  }, [currentMonth, lastMonthStats, isDemoMode]);

  // Calculate month comparison when both months are loaded
  useEffect(() => {
    if (monthlyStats && lastMonthStats) {
      const thisMonth = new Date();
      const isCurrentMonth = currentMonth.getFullYear() === thisMonth.getFullYear() && 
                            currentMonth.getMonth() === thisMonth.getMonth();
      
      if (isCurrentMonth) {
        const comparison = calculateMonthComparison(monthlyStats, lastMonthStats);
        setMonthComparison(comparison);
      } else {
        setMonthComparison(null);
      }
    }
  }, [monthlyStats, lastMonthStats, currentMonth]);

  // Load general stats
  useEffect(() => {
    const loadGeneralStats = async () => {
      try {
        if (isDemoMode) {
          // Use fake data for demo mode
          const fakeStats = generateFakeGeneralStats();
          setGeneralStats(fakeStats);
          setLoading(false);
          return;
        }

        // REAL USER MODE: Always use Supabase backend
        try {
          const stats = await apiClient.getAnalyticsStats();
          setGeneralStats(stats);
          setLoading(false);
          return;
        } catch (error) {
          console.error('Failed to load general stats from Supabase API:', error);
          console.error('Make sure the backend is running with main_supabase.py');
          // Fallback to localStorage as last resort
          const sessions = loadSessionsFromStorage();
          const stats = calculateGeneralStatsFromSessions(sessions);
          setGeneralStats(stats);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load general stats:', error);
        setLoading(false);
      }
    };
    loadGeneralStats();
  }, [isDemoMode]);

  // Load daily breakdown when date is selected
  useEffect(() => {
    if (selectedDate) {
      const loadDailyBreakdown = async () => {
        try {
          if (isDemoMode) {
            // Generate fake daily breakdown for demo mode
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const fakeSessions = generateFakeLastMonthSessions();
            const daySessions = fakeSessions.filter(
              s => format(new Date(s.startTime), 'yyyy-MM-dd') === dateStr
            );
            const breakdown = calculateDailyBreakdownFromSessions(
              daySessions.map(s => ({
                id: parseInt(s.id) || 0,
                partner: s.partner,
                start_time: s.startTime.toISOString(),
                end_time: s.endTime?.toISOString(),
                duration: s.duration,
                created_at: s.startTime.toISOString(),
                updated_at: s.endTime?.toISOString() || s.startTime.toISOString(),
              })),
              selectedDate
            );
            setDailyBreakdown(breakdown);
            return;
          }

          const dateStr = format(selectedDate, 'yyyy-MM-dd');
          
          // REAL USER MODE: Always use Supabase backend
          try {
            const breakdown = await apiClient.getDailyStats(dateStr);
            setDailyBreakdown(breakdown);
            return;
          } catch (error) {
            console.error('Failed to load daily breakdown from Supabase API:', error);
            console.error('Make sure the backend is running with main_supabase.py');
            // Fallback to localStorage as last resort
            const sessions = loadSessionsFromStorage();
            const breakdown = calculateDailyBreakdownFromSessions(sessions, selectedDate);
            setDailyBreakdown(breakdown);
          }
        } catch (error) {
          console.error('Failed to load daily breakdown:', error);
        }
      };
      loadDailyBreakdown();
    }
  }, [selectedDate, isDemoMode]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  // Prepare weekly bar chart data
  const weeklyBarData = weeklyStats ? [
    {
      name: getPartnerName('husband'),
      Sessions: weeklyStats.husband.total_sessions,
      'Total Time (hours)': parseFloat((weeklyStats.husband.total_time / 3600).toFixed(1)),
      'Avg Duration (min)': parseFloat((weeklyStats.husband.average_duration / 60).toFixed(1)),
    },
    {
      name: getPartnerName('wife'),
      Sessions: weeklyStats.wife.total_sessions,
      'Total Time (hours)': parseFloat((weeklyStats.wife.total_time / 3600).toFixed(1)),
      'Avg Duration (min)': parseFloat((weeklyStats.wife.average_duration / 60).toFixed(1)),
    },
  ] : [];

  // Prepare heatmap data for 7-day view
  const heatmapData = weeklyStats?.heatmap_data || [];

  // Prepare monthly trend data
  const monthlyTrendData = monthlyStats?.trend_data.map(d => ({
    date: format(parseISO(d.date), 'MMM dd'),
    [getPartnerName('husband')]: parseFloat((d.husband_time / 3600).toFixed(2)),
    [getPartnerName('wife')]: parseFloat((d.wife_time / 3600).toFixed(2)),
    Overlap: parseFloat((d.overlap_time / 3600).toFixed(2)),
  })) || [];

  // Pie chart data for session distribution
  const pieChartData = monthlyStats ? [
    { name: getPartnerName('husband'), value: monthlyStats.husband.total_sessions, color: COLORS.husband },
    { name: getPartnerName('wife'), value: monthlyStats.wife.total_sessions, color: COLORS.wife },
  ] : [];

  // Comparison data for this month vs last month
  const comparisonBarData = useMemo(() => {
    if (!monthlyStats || !lastMonthStats) return [];
    return [
      {
        category: 'Sessions',
        'This Month': monthlyStats.husband.total_sessions + monthlyStats.wife.total_sessions,
        'Last Month': lastMonthStats.husband.total_sessions + lastMonthStats.wife.total_sessions,
      },
      {
        category: 'Time (hrs)',
        'This Month': parseFloat(((monthlyStats.husband.total_time + monthlyStats.wife.total_time) / 3600).toFixed(1)),
        'Last Month': parseFloat(((lastMonthStats.husband.total_time + lastMonthStats.wife.total_time) / 3600).toFixed(1)),
      },
      {
        category: 'Overlap (min)',
        'This Month': parseFloat((monthlyStats.overlap.total_overlap_time / 60).toFixed(1)),
        'Last Month': parseFloat((lastMonthStats.overlap.total_overlap_time / 60).toFixed(1)),
      },
    ];
  }, [monthlyStats, lastMonthStats]);

  // Calendar heatmap data
  const getCalendarHeatmap = () => {
    if (!monthlyStats) return [];
    
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const dayData = monthlyStats.calendar_heatmap.find(
        d => parseISO(d.date).getDate() === day.getDate()
      );
      return {
        date: day,
        intensity: dayData?.intensity || 0,
        husbandSessions: dayData?.husband_sessions || 0,
        wifeSessions: dayData?.wife_sessions || 0,
      };
    });
  };

  const calendarData = getCalendarHeatmap();

  // Get day color based on activity
  const getDayColor = (dayData: { intensity: number; husbandSessions: number; wifeSessions: number; date: Date }): string => {
    const totalSessions = dayData.husbandSessions + dayData.wifeSessions;
    const totalTime = dayData.intensity * 3600;
    
    const dayKey = format(dayData.date, 'yyyy-MM-dd');
    const dayStats = monthlyStats?.trend_data.find(d => d.date === dayKey);
    const hasOverlap = (dayStats?.overlap_time || 0) > 0;
    
    if (hasOverlap) {
      return 'bg-purple-500';
    }
    
    if (totalSessions === 0) {
      return 'bg-emerald-200';
    }
    
    if (totalSessions >= 6 || totalTime > 3600) {
      return 'bg-red-500';
    }
    
    if (totalSessions >= 3 && totalSessions <= 5) {
      return 'bg-orange-400';
    }
    
    if (totalSessions >= 1 && totalSessions <= 2) {
      return 'bg-yellow-300';
    }
    
    return 'bg-gray-200';
  };

  const ChangeIndicator = ({ value, inverse = false }: { value: number; inverse?: boolean }) => {
    const isPositive = inverse ? value < 0 : value > 0;
    const isNegative = inverse ? value > 0 : value < 0;
    
    return (
      <div className={cn(
        "flex items-center gap-1 text-sm font-medium",
        isPositive && "text-emerald-600",
        isNegative && "text-red-600",
        !isPositive && !isNegative && "text-gray-500"
      )}>
        {isPositive ? <ArrowDownRight className="w-4 h-4" /> : 
         isNegative ? <ArrowUpRight className="w-4 h-4" /> : 
         <Minus className="w-4 h-4" />}
        <span>{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-indigo-600 mx-auto"></div>
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-indigo-600 animate-pulse" />
          </div>
          <p className="mt-6 text-gray-700 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <BackButton to="/" />
          <div className="text-center space-y-2 flex-1">
            <div className="flex items-center justify-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 to-pink-600 shadow-lg shadow-indigo-500/25">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">
                Analytics Dashboard
              </h1>
            </div>
            <p className="text-gray-600 text-lg">Comprehensive debate insights and statistics</p>
          </div>
          <div className="w-9" /> {/* Spacer for alignment */}
        </div>

        {/* Month Comparison Banner */}
        {monthComparison && (
          <Card className="bg-gradient-to-r from-indigo-50 to-pink-50 border-indigo-200 overflow-hidden shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    monthComparison.trend === 'improving' && "bg-emerald-100",
                    monthComparison.trend === 'worsening' && "bg-red-100",
                    monthComparison.trend === 'stable' && "bg-indigo-100"
                  )}>
                    {monthComparison.trend === 'improving' ? (
                      <TrendingDown className="w-5 h-5 text-emerald-600" />
                    ) : monthComparison.trend === 'worsening' ? (
                      <TrendingUp className="w-5 h-5 text-red-600" />
                    ) : (
                      <Minus className="w-5 h-5 text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-gray-900 text-xl">Month-over-Month Comparison</CardTitle>
                    <CardDescription className="text-gray-600">
                      {monthComparison.trend === 'improving' 
                        ? "Great progress! Fewer debates this month 🎉" 
                        : monthComparison.trend === 'worsening'
                        ? "More debates this month - time to talk! 💬"
                        : "Holding steady compared to last month"}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={cn(
                  "text-sm px-3 py-1",
                  monthComparison.trend === 'improving' && "bg-emerald-100 text-emerald-700 border-emerald-300",
                  monthComparison.trend === 'worsening' && "bg-red-100 text-red-700 border-red-300",
                  monthComparison.trend === 'stable' && "bg-indigo-100 text-indigo-700 border-indigo-300"
                )}>
                  {monthComparison.trend === 'improving' ? 'Improving' : 
                   monthComparison.trend === 'worsening' ? 'Needs Attention' : 'Stable'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="text-gray-600 text-sm mb-1">Total Sessions</div>
                  <ChangeIndicator value={monthComparison.sessionsChange} inverse />
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="text-gray-600 text-sm mb-1">Total Time</div>
                  <ChangeIndicator value={monthComparison.timeChange} inverse />
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="text-gray-600 text-sm mb-1">Overlap Time</div>
                  <ChangeIndicator value={monthComparison.overlapChange} inverse />
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="text-gray-600 text-sm mb-1">{getPartnerName('husband')}</div>
                  <ChangeIndicator value={monthComparison.husbandSessionsChange} inverse />
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="text-gray-600 text-sm mb-1">{getPartnerName('wife')}</div>
                  <ChangeIndicator value={monthComparison.wifeSessionsChange} inverse />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-100 border border-gray-200 p-1 rounded-xl">
            <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg transition-all text-gray-700">
              Overview
            </TabsTrigger>
            <TabsTrigger value="weekly" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg transition-all text-gray-700">
              Weekly
            </TabsTrigger>
            <TabsTrigger value="monthly" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg transition-all text-gray-700">
              Monthly
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg transition-all text-gray-700">
              Calendar
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg transition-all text-gray-700">
              Stats
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - NEW */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-700 text-sm font-medium">{getPartnerName('husband')}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {monthlyStats?.husband.total_sessions || 0}
                      </p>
                      <p className="text-indigo-600 text-xs mt-1">
                        {formatDuration(monthlyStats?.husband.total_time || 0)} total
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-200">
                      <Zap className="w-6 h-6 text-indigo-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-pink-700 text-sm font-medium">{getPartnerName('wife')}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {monthlyStats?.wife.total_sessions || 0}
                      </p>
                      <p className="text-pink-600 text-xs mt-1">
                        {formatDuration(monthlyStats?.wife.total_time || 0)} total
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-pink-200">
                      <Heart className="w-6 h-6 text-pink-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-700 text-sm font-medium">Overlap Time</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {formatDuration(monthlyStats?.overlap.total_overlap_time || 0)}
                      </p>
                      <p className="text-amber-600 text-xs mt-1">
                        {monthlyStats?.overlap.overlap_sessions || 0} simultaneous
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-200">
                      <Flame className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-700 text-sm font-medium">Peaceful Days</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {generalStats?.peaceful_days_count || 0}
                      </p>
                      <p className="text-emerald-600 text-xs mt-1">
                        No debates recorded
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-200">
                      <Target className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Month Comparison Bar Chart */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    This Month vs Last Month
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Compare your progress over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={comparisonBarData} barGap={8}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="category" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          color: '#111827',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="This Month" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Last Month" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Session Distribution Pie */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    Session Distribution
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Who's been debating more?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          color: '#111827',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Trend Area Chart */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Daily Activity Trend
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Hours spent debating each day this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyTrendData}>
                    <defs>
                      <linearGradient id="colorHusband" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.husband} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={COLORS.husband} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorWife" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.wife} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={COLORS.wife} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        color: '#111827',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey={getPartnerName('husband')} 
                      stroke={COLORS.husband} 
                      fillOpacity={1} 
                      fill="url(#colorHusband)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey={getPartnerName('wife')} 
                      stroke={COLORS.wife} 
                      fillOpacity={1} 
                      fill="url(#colorWife)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Winner Cards */}
            {monthlyStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {monthlyStats.winner && (
                  <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200/30 rounded-full blur-3xl"></div>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-yellow-100">
                          <Crown className="w-8 h-8 text-yellow-600" />
                        </div>
                        <div>
                          <CardTitle className="text-gray-900 text-xl">Monthly Champion</CardTitle>
                          <CardDescription className="text-gray-600">
                            {getPartnerName(monthlyStats.winner)} wins this month!
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 text-sm">
                        {monthlyStats.winner_reason === 'least_total_time' 
                          ? 'Least total debate time' 
                          : 'Fewest sessions started'}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {monthlyStats.peacekeeping_winner && (
                  <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl"></div>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-blue-100">
                          <Trophy className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-gray-900 text-xl">Peacekeeping Award</CardTitle>
                          <CardDescription className="text-gray-600">
                            {getPartnerName(monthlyStats.peacekeeping_winner)} kept the peace!
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 text-sm">
                        Most time NOT debating when partner was active
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Weekly View */}
          <TabsContent value="weekly" className="space-y-6">
            {weeklyStats && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-indigo-50 border-indigo-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-indigo-700">{getPartnerName('husband')} Sessions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">{weeklyStats.husband.total_sessions}</div>
                      <p className="text-xs text-indigo-600 mt-1">{formatDuration(weeklyStats.husband.total_time)} total</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-pink-50 border-pink-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-pink-700">{getPartnerName('wife')} Sessions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">{weeklyStats.wife.total_sessions}</div>
                      <p className="text-xs text-pink-600 mt-1">{formatDuration(weeklyStats.wife.total_time)} total</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-50 border-amber-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-amber-700">Overlap Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">{formatDuration(weeklyStats.overlap.total_overlap_time)}</div>
                      <p className="text-xs text-amber-600 mt-1">{weeklyStats.overlap.overlap_sessions} simultaneous sessions</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-indigo-50 border-indigo-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-indigo-700">Peak Day</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">
                        {weeklyStats.peak_day ? format(parseISO(weeklyStats.peak_day), 'EEE') : 'N/A'}
                      </div>
                      <p className="text-xs text-indigo-600 mt-1">
                        {weeklyStats.peak_day ? format(parseISO(weeklyStats.peak_day), 'MMM dd') : ''}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Weekly Comparison</CardTitle>
                    <CardDescription className="text-gray-600">{getPartnerName('husband')} vs {getPartnerName('wife')} debate time comparison</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={weeklyBarData} barGap={12}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            color: '#111827',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="Sessions" fill={COLORS.husband} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Total Time (hours)" fill={COLORS.wife} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-900">7-Day Heat Map</CardTitle>
                    <CardDescription className="text-gray-600">Visual representation of debate intensity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-3">
                      {heatmapData.map((day, index) => {
                        const totalSessions = Math.round((day.husband_time + day.wife_time) / 300);
                        const totalTime = day.intensity * 3600;
                        const hasOverlap = day.overlap_time > 0;
                        
                        let color = 'bg-gray-200';
                        let textColor = 'text-gray-700';
                        if (hasOverlap) {
                          color = 'bg-purple-500';
                          textColor = 'text-white';
                        } else if (totalSessions === 0) {
                          color = 'bg-emerald-200';
                          textColor = 'text-emerald-800';
                        } else if (totalSessions >= 6 || totalTime > 3600) {
                          color = 'bg-red-500';
                          textColor = 'text-white';
                        } else if (totalSessions >= 3 && totalSessions <= 5) {
                          color = 'bg-orange-400';
                          textColor = 'text-white';
                        } else if (totalSessions >= 1 && totalSessions <= 2) {
                          color = 'bg-yellow-300';
                          textColor = 'text-yellow-900';
                        }
                        
                        return (
                          <div key={index} className="text-center">
                            <div className={`${color} rounded-xl p-4 mb-2 transition-transform hover:scale-105`}>
                              <div className={`text-lg font-bold ${textColor}`}>
                                {day.intensity.toFixed(1)}h
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 font-medium">
                              {format(parseISO(day.date), 'EEE')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mt-6 justify-center">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-emerald-200"></div>
                        <span className="text-xs text-gray-600">Peaceful</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-yellow-300"></div>
                        <span className="text-xs text-gray-600">Light (1-2)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-orange-400"></div>
                        <span className="text-xs text-gray-600">Moderate (3-5)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-500"></div>
                        <span className="text-xs text-gray-600">High (6+)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-purple-500"></div>
                        <span className="text-xs text-gray-600">Overlap</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-gray-900">Average Duration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">{getPartnerName('husband')}:</span>
                          <span className="font-bold text-gray-900 text-lg">{formatTime(Math.round(weeklyStats.husband.average_duration))}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">{getPartnerName('wife')}:</span>
                          <span className="font-bold text-gray-900 text-lg">{formatTime(Math.round(weeklyStats.wife.average_duration))}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-gray-900">Longest Sessions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">{getPartnerName('husband')}:</span>
                          <span className="font-bold text-gray-900 text-lg">{formatTime(weeklyStats.husband.longest_session)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">{getPartnerName('wife')}:</span>
                          <span className="font-bold text-gray-900 text-lg">{formatTime(weeklyStats.wife.longest_session)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Monthly View */}
          <TabsContent value="monthly" className="space-y-6">
            {monthlyStats && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {format(currentMonth, 'MMMM yyyy')}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentMonth(new Date())}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>

                {monthlyStats.winner && (
                  <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 shadow-sm">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Crown className="w-8 h-8 text-yellow-600" />
                        <div>
                          <CardTitle className="text-gray-900">Monthly Winner: {getPartnerName(monthlyStats.winner)}</CardTitle>
                          <CardDescription className="text-gray-600">
                            {monthlyStats.winner_reason === 'least_total_time' && 'Least total debate time'}
                            {monthlyStats.winner_reason === 'fewest_sessions' && 'Fewest sessions started'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-indigo-50 border-indigo-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-indigo-700">{getPartnerName('husband')} Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">{monthlyStats.husband.total_sessions}</div>
                      <p className="text-xs text-indigo-600">{formatDuration(monthlyStats.husband.total_time)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-pink-50 border-pink-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-pink-700">{getPartnerName('wife')} Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">{monthlyStats.wife.total_sessions}</div>
                      <p className="text-xs text-pink-600">{formatDuration(monthlyStats.wife.total_time)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-50 border-amber-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-amber-700">Simultaneous</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">{monthlyStats.overlap.overlap_sessions}</div>
                      <p className="text-xs text-amber-600">{formatDuration(monthlyStats.overlap.total_overlap_time)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-indigo-50 border-indigo-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-indigo-700">Avg Overlap</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">{formatTime(Math.round(monthlyStats.overlap.average_overlap_duration))}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Monthly Trend</CardTitle>
                    <CardDescription className="text-gray-600">Daily debate time over the month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            color: '#111827',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey={getPartnerName('husband')} stroke={COLORS.husband} strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey={getPartnerName('wife')} stroke={COLORS.wife} strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Overlap" stroke={COLORS.overlap} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Calendar Heat Map</CardTitle>
                    <CardDescription className="text-gray-600">Daily activity intensity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs font-semibold p-2 text-gray-600">{day}</div>
                      ))}
                      {/* Add empty cells for alignment */}
                      {Array.from({ length: calendarData[0]?.date.getDay() || 0 }).map((_, i) => (
                        <div key={`empty-${i}`} className="p-2"></div>
                      ))}
                      {calendarData.map((day, index) => {
                        const color = getDayColor(day);
                        const isDarkColor = color.includes('red') || color.includes('purple') || color.includes('orange-');
                        return (
                          <div
                            key={index}
                            className={`${color} rounded-lg p-2 text-center text-xs cursor-pointer hover:opacity-80 transition-all hover:scale-105`}
                            title={`${format(day.date, 'MMM dd')}: ${day.intensity.toFixed(1)}h, ${day.husbandSessions + day.wifeSessions} sessions`}
                          >
                            <div className={`font-bold ${isDarkColor ? 'text-white' : 'text-gray-900'}`}>
                              {day.date.getDate()}
                            </div>
                            <div className={`text-[10px] opacity-75 ${isDarkColor ? 'text-white' : 'text-gray-700'}`}>
                              {day.husbandSessions + day.wifeSessions}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Calendar Analytics */}
          <TabsContent value="calendar" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900">Select Date</CardTitle>
                  <CardDescription className="text-gray-600">Click any day for detailed breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border border-gray-200 bg-white"
                  />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900">Daily Breakdown</CardTitle>
                  <CardDescription className="text-gray-600">
                    {selectedDate ? format(selectedDate, 'MMMM dd, yyyy') : 'Select a date'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dailyBreakdown ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                          <div className="text-sm text-indigo-700">{getPartnerName('husband')} Sessions</div>
                          <div className="text-3xl font-bold text-gray-900">{dailyBreakdown.husband_sessions}</div>
                        </div>
                        <div className="bg-pink-50 rounded-xl p-4 border border-pink-200">
                          <div className="text-sm text-pink-700">{getPartnerName('wife')} Sessions</div>
                          <div className="text-3xl font-bold text-gray-900">{dailyBreakdown.wife_sessions}</div>
                        </div>
                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                          <div className="text-sm text-indigo-700">{getPartnerName('husband')} Time</div>
                          <div className="text-3xl font-bold text-gray-900">{formatDuration(dailyBreakdown.husband_time)}</div>
                        </div>
                        <div className="bg-pink-50 rounded-xl p-4 border border-pink-200">
                          <div className="text-sm text-pink-700">{getPartnerName('wife')} Time</div>
                          <div className="text-3xl font-bold text-gray-900">{formatDuration(dailyBreakdown.wife_time)}</div>
                        </div>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="text-sm text-amber-700 mb-1">Overlap Time</div>
                        <div className="text-2xl font-bold text-amber-600">{formatDuration(dailyBreakdown.overlap_time)}</div>
                      </div>

                      {dailyBreakdown.sessions.length > 0 && (
                        <div>
                          <div className="text-sm font-semibold mb-3 text-gray-700">Session Timeline</div>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {dailyBreakdown.sessions.map((session) => (
                              <div
                                key={session.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                              >
                                <div className="flex items-center gap-3">
                                  <Badge 
                                    className={cn(
                                      "text-white",
                                      session.partner === 'husband' 
                                        ? 'bg-indigo-600' 
                                        : 'bg-pink-600'
                                    )}
                                  >
                                    {session.partner === 'husband' ? 'H' : 'W'}
                                  </Badge>
                                  <span className="text-sm text-gray-700">
                                    {format(parseISO(session.start_time), 'HH:mm')}
                                    {session.end_time && ` - ${format(parseISO(session.end_time), 'HH:mm')}`}
                                  </span>
                                </div>
                                {session.duration && (
                                  <span className="text-sm font-semibold text-gray-900">
                                    {formatTime(session.duration)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-12">
                      <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select a date to view detailed breakdown</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Statistics Panel */}
          <TabsContent value="stats" className="space-y-6">
            {generalStats && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                        <Activity className="w-4 h-4" />
                        Total Debates
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-gray-900">{generalStats.total_debates}</div>
                      <p className="text-xs text-gray-600 mt-1">{generalStats.total_simultaneous} simultaneous</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                        <Clock className="w-4 h-4" />
                        Longest Debates
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{getPartnerName('husband')}:</span>
                          <span className="font-semibold text-gray-900">{formatTime(generalStats.longest_debate_husband)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{getPartnerName('wife')}:</span>
                          <span className="font-semibold text-gray-900">{formatTime(generalStats.longest_debate_wife)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Simultaneous:</span>
                          <span className="font-semibold text-gray-900">{formatTime(generalStats.longest_simultaneous)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                        <CalendarIcon className="w-4 h-4" />
                        Active Days
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Most Active:</span>
                          <span className="font-semibold text-gray-900">
                            {generalStats.most_active_day ? format(parseISO(generalStats.most_active_day), 'MMM dd') : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Least Active:</span>
                          <span className="font-semibold text-gray-900">
                            {generalStats.least_active_day ? format(parseISO(generalStats.least_active_day), 'MMM dd') : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Peaceful Days:</span>
                          <span className="font-semibold text-emerald-600">{generalStats.peaceful_days_count}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-700">Overlap Percentage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-amber-600">{generalStats.overlap_percentage.toFixed(1)}%</div>
                      <p className="text-xs text-gray-600 mt-1">Time both were active together</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                        <Flame className="w-4 h-4" />
                        Streaks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Current:</span>
                          <span className="font-semibold text-gray-900">{generalStats.current_streak} days</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Longest:</span>
                          <span className="font-semibold text-gray-900">{generalStats.longest_streak} days</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-700">Frequency Pattern</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        {Object.entries(generalStats.debate_frequency_pattern)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 4)
                          .map(([day, count]) => (
                            <div key={day} className="flex justify-between text-sm">
                              <span className="text-gray-600">{day.slice(0, 3)}:</span>
                              <span className="font-semibold text-gray-900">{count}</span>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Frequency Chart */}
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Weekly Pattern</CardTitle>
                    <CardDescription className="text-gray-600">Debate frequency by day of week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={Object.entries(generalStats.debate_frequency_pattern).map(([day, count]) => ({
                        day: day.slice(0, 3),
                        count,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="day" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            color: '#111827',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]}>
                          {Object.entries(generalStats.debate_frequency_pattern).map((_, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={index === 5 || index === 6 ? '#ec4899' : '#6366f1'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;
