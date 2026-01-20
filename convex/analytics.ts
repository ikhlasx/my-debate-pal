import { query } from "./_generated/server";
import { v } from "convex/values";

// --- Helper Functions (Ported from Python) ---

function parseDate(dateStr: string): Date {
    return new Date(dateStr);
}

function getStartOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getEndOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

interface PartnerStats {
    total_sessions: number;
    total_time: number;
    average_duration: number;
    longest_session: number;
    shortest_session: number;
}

function calculatePartnerStats(sessions: any[]): PartnerStats {
    const validSessions = sessions.filter((s) => s.duration !== undefined && s.duration !== null);
    if (validSessions.length === 0) {
        return {
            total_sessions: 0,
            total_time: 0,
            average_duration: 0,
            longest_session: 0,
            shortest_session: 0,
        };
    }

    const durations = validSessions.map((s) => s.duration!);
    const total_time = durations.reduce((a, b) => a + b, 0);

    return {
        total_sessions: validSessions.length,
        total_time,
        average_duration: total_time / validSessions.length,
        longest_session: Math.max(...durations),
        shortest_session: Math.min(...durations),
    };
}

interface OverlapStats {
    total_overlap_time: number;
    overlap_sessions: number;
    average_overlap_duration: number;
    longest_overlap: number;
}

function calculateOverlap(sessions: any[]): OverlapStats {
    const husbandSessions = sessions.filter((s) => s.partner === "husband" && s.endTime);
    const wifeSessions = sessions.filter((s) => s.partner === "wife" && s.endTime);

    const overlaps: number[] = [];
    let totalOverlap = 0;

    for (const h of husbandSessions) {
        const hStart = parseDate(h.startTime).getTime();
        const hEnd = parseDate(h.endTime!).getTime();

        for (const w of wifeSessions) {
            const wStart = parseDate(w.startTime).getTime();
            const wEnd = parseDate(w.endTime!).getTime();

            const overlapStart = Math.max(hStart, wStart);
            const overlapEnd = Math.min(hEnd, wEnd);

            if (overlapStart < overlapEnd) {
                const durationSeconds = (overlapEnd - overlapStart) / 1000;
                overlaps.push(durationSeconds);
                totalOverlap += durationSeconds;
            }
        }
    }

    return {
        total_overlap_time: totalOverlap,
        overlap_sessions: overlaps.length,
        average_overlap_duration: overlaps.length ? totalOverlap / overlaps.length : 0,
        longest_overlap: overlaps.length ? Math.max(...overlaps) : 0,
    };
}


// --- API Endpoints ---

export const getWeeklyStats = query({
    args: {
        partnerId: v.string(),
        weekStart: v.string(), // YYYY-MM-DD
    },
    handler: async (ctx, args) => {
        const start = parseDate(args.weekStart);
        const end = addDays(start, 6);

        // Fetch all sessions for logic (could optimize date range in DB query)
        const sessions = await ctx.db
            .query("debate_sessions")
            .withIndex("by_partner_id", (q) => q.eq("partnerId", args.partnerId))
            .collect();

        // Filter by date range
        const weekSessions = sessions.filter((s) => {
            const d = parseDate(s.startTime);
            return d >= getStartOfDay(start) && d <= getEndOfDay(end);
        });

        const husbandSessions = weekSessions.filter((s) => s.partner === "husband");
        const wifeSessions = weekSessions.filter((s) => s.partner === "wife");

        const husbandStats = calculatePartnerStats(husbandSessions);
        const wifeStats = calculatePartnerStats(wifeSessions);
        const overlapStats = calculateOverlap(weekSessions);

        // Heatmap Data
        const heatmap_data = [];
        let maxIntensity = 0;
        let peak_day = undefined;

        for (let i = 0; i < 7; i++) {
            const d = addDays(start, i);
            const dayStr = d.toISOString().split('T')[0];

            const daySessions = weekSessions.filter(s => s.startTime.startsWith(dayStr));
            const dayHusband = daySessions.filter(s => s.partner === 'husband');
            const dayWife = daySessions.filter(s => s.partner === 'wife');

            const husbandTime = dayHusband.reduce((sum, s) => sum + (s.duration || 0), 0);
            const wifeTime = dayWife.reduce((sum, s) => sum + (s.duration || 0), 0);

            // Overlap for day
            const overlap = calculateOverlap(daySessions).total_overlap_time;

            const intensity = (husbandTime + wifeTime) / 3600;

            if (intensity > maxIntensity) {
                maxIntensity = intensity;
                peak_day = d.toISOString(); // Full ISO string as used in API
            }

            heatmap_data.push({
                date: d.toISOString(), // Use ISO string to match API format
                intensity,
                husband_time: husbandTime,
                wife_time: wifeTime,
                overlap_time: overlap
            });
        }

        return {
            week_start: args.weekStart,
            week_end: end.toISOString().split('T')[0],
            husband: husbandStats,
            wife: wifeStats,
            overlap: overlapStats,
            peak_day,
            peak_time: null,
            heatmap_data
        };
    },
});

export const getMonthlyStats = query({
    args: {
        partnerId: v.string(),
        year: v.number(),
        month: v.number(), // 1-12
    },
    handler: async (ctx, args) => {
        const start = new Date(args.year, args.month - 1, 1);
        const end = new Date(args.year, args.month, 0); // Last day of month

        const sessions = await ctx.db
            .query("debate_sessions")
            .withIndex("by_partner_id", (q) => q.eq("partnerId", args.partnerId))
            .collect();

        const monthSessions = sessions.filter((s) => {
            const d = parseDate(s.startTime);
            return d >= getStartOfDay(start) && d <= getEndOfDay(end);
        });

        const husbandStats = calculatePartnerStats(monthSessions.filter(s => s.partner === "husband"));
        const wifeStats = calculatePartnerStats(monthSessions.filter(s => s.partner === "wife"));
        const overlapStats = calculateOverlap(monthSessions);

        let winner: "husband" | "wife" | undefined = undefined;
        let winner_reason: string | undefined = undefined;

        if (husbandStats.total_time < wifeStats.total_time) {
            winner = 'husband';
            winner_reason = 'least_total_time';
        } else if (wifeStats.total_time < husbandStats.total_time) {
            winner = 'wife';
            winner_reason = 'least_total_time';
        } else if (husbandStats.total_sessions < wifeStats.total_sessions) {
            winner = 'husband';
            winner_reason = 'fewest_sessions';
        } else if (wifeStats.total_sessions < husbandStats.total_sessions) {
            winner = 'wife';
            winner_reason = 'fewest_sessions';
        }

        // Generate trend and calendar data
        const trend_data = [];
        const calendar_heatmap = [];

        const daysInMonth = end.getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(args.year, args.month - 1, i);
            const dayStr = d.toISOString().split('T')[0];

            const daySessions = monthSessions.filter(s => s.startTime.startsWith(dayStr));
            const dayHusband = daySessions.filter(s => s.partner === 'husband');
            const dayWife = daySessions.filter(s => s.partner === 'wife');

            const husbandTime = dayHusband.reduce((sum, s) => sum + (s.duration || 0), 0);
            const wifeTime = dayWife.reduce((sum, s) => sum + (s.duration || 0), 0);
            const overlap = calculateOverlap(daySessions).total_overlap_time;

            trend_data.push({
                date: d.toISOString(),
                husband_time: husbandTime,
                wife_time: wifeTime,
                overlap_time: overlap
            });

            calendar_heatmap.push({
                date: d.toISOString(),
                day: i,
                intensity: (husbandTime + wifeTime) / 3600,
                husband_sessions: dayHusband.length,
                wife_sessions: dayWife.length
            });
        }

        return {
            year: args.year,
            month: args.month,
            husband: husbandStats,
            wife: wifeStats,
            overlap: overlapStats,
            trend_data,
            winner,
            winner_reason,
            peacekeeping_winner: undefined, // Complex logic, skipping for MVP or add later if critical
            calendar_heatmap
        };
    }
});

export const getGeneralStats = query({
    args: {
        partnerId: v.string(),
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const sessions = await ctx.db
            .query("debate_sessions")
            .withIndex("by_partner_id", (q) => q.eq("partnerId", args.partnerId))
            .collect();

        let filtered = sessions;
        if (args.startDate) {
            filtered = filtered.filter(s => s.startTime >= args.startDate!);
        }
        if (args.endDate) {
            filtered = filtered.filter(s => s.startTime <= args.endDate!);
        }

        const husbandSessions = filtered.filter(s => s.partner === 'husband');
        const wifeSessions = filtered.filter(s => s.partner === 'wife');

        const longest_husband = Math.max(0, ...husbandSessions.map(s => s.duration || 0));
        const longest_wife = Math.max(0, ...wifeSessions.map(s => s.duration || 0));

        const overlap = calculateOverlap(filtered);

        // Frequency pattern
        const frequency_pattern: Record<string, number> = {};
        for (const s of filtered) {
            const d = parseDate(s.startTime);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
            frequency_pattern[dayName] = (frequency_pattern[dayName] || 0) + 1;
        }

        return {
            total_debates: filtered.length,
            total_simultaneous: overlap.overlap_sessions, // Approx
            longest_debate_husband: longest_husband,
            longest_debate_wife: longest_wife,
            longest_simultaneous: overlap.longest_overlap,
            most_active_day: undefined, // simplified
            least_active_day: undefined, // simplified
            debate_frequency_pattern: frequency_pattern,
            overlap_percentage: 0, // todo
            peaceful_days_count: 0, // todo
            current_streak: 0, // todo
            longest_streak: 0 // todo
        };
    }
});

export const getDailyStats = query({
    args: {
        partnerId: v.string(),
        date: v.string(), // YYYY-MM-DD
    },
    handler: async (ctx, args) => {
        const sessions = await ctx.db
            .query("debate_sessions")
            .withIndex("by_partner_id", (q) => q.eq("partnerId", args.partnerId))
            .collect();

        const targetDate = args.date;
        const daySessions = sessions.filter(s => s.startTime.startsWith(targetDate)).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        const husbandSessions = daySessions.filter(s => s.partner === 'husband');
        const wifeSessions = daySessions.filter(s => s.partner === 'wife');

        const husbandTime = husbandSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        const wifeTime = wifeSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        const overlapTime = calculateOverlap(daySessions).total_overlap_time;

        return {
            date: targetDate,
            husband_sessions: husbandSessions.length,
            wife_sessions: wifeSessions.length,
            husband_time: husbandTime,
            wife_time: wifeTime,
            overlap_time: overlapTime,
            sessions: daySessions.map(s => ({
                id: s._id,
                partner: s.partner,
                start_time: s.startTime,
                end_time: s.endTime,
                duration: s.duration,
                created_at: s.startTime, // approx
                updated_at: s.endTime || s.startTime // approx
            }))
        };
    }
});

export const getHeatmapData = query({
    args: {
        partnerId: v.string(),
        startDate: v.string(),
        endDate: v.string(),
    },
    handler: async (ctx, args) => {
        const sessions = await ctx.db
            .query("debate_sessions")
            .withIndex("by_partner_id", (q) => q.eq("partnerId", args.partnerId))
            .collect();

        const start = parseDate(args.startDate);
        const end = parseDate(args.endDate);
        const heatmap = [];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const daySessions = sessions.filter(s => s.startTime.startsWith(dateStr));

            const daily = calculatePartnerStats(daySessions); // Rough reuse

            const husbandTime = daySessions.filter(s => s.partner === 'husband').reduce((sum, s) => sum + (s.duration || 0), 0);
            const wifeTime = daySessions.filter(s => s.partner === 'wife').reduce((sum, s) => sum + (s.duration || 0), 0);
            const overlapTime = calculateOverlap(daySessions).total_overlap_time;

            heatmap.push({
                date: d.toISOString(),
                intensity: (husbandTime + wifeTime) / 3600,
                husband_time: husbandTime,
                wife_time: wifeTime,
                overlap_time: overlapTime,
                total_sessions: daySessions.length
            });
        }

        return heatmap;
    }
});
