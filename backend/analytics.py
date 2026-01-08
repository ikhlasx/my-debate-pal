from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from models import DebateSession
from schemas import (
    PartnerStats, OverlapStats, WeeklyStats, MonthlyStats,
    DailyBreakdown, AnalyticsStats
)
import calendar

# Helper to filter by partner IDs
def filter_by_partner_ids(query, partner_ids: List[str]):
    """Filter query by partner IDs (if provided)"""
    if partner_ids:
        return query.filter(DebateSession.partner_id.in_(partner_ids))
    return query  # No filtering if empty list

class calculate_analytics:
    
    @staticmethod
    def get_partner_stats(db: Session, partner: str, partner_ids: List[str] = None, start_date: Optional[date] = None, end_date: Optional[date] = None) -> PartnerStats:
        query = db.query(DebateSession).filter(DebateSession.partner == partner)
        
        # Apply partner_id filtering if provided
        if partner_ids is not None:
            query = filter_by_partner_ids(query, partner_ids)
        
        if start_date:
            query = query.filter(DebateSession.start_time >= datetime.combine(start_date, datetime.min.time()))
        if end_date:
            query = query.filter(DebateSession.start_time <= datetime.combine(end_date, datetime.max.time()))
        
        sessions = query.filter(DebateSession.duration.isnot(None)).all()
        
        if not sessions:
            return PartnerStats(
                total_sessions=0,
                total_time=0,
                average_duration=0,
                longest_session=0,
                shortest_session=0
            )
        
        durations = [s.duration for s in sessions if s.duration]
        total_time = sum(durations)
        
        return PartnerStats(
            total_sessions=len(sessions),
            total_time=total_time,
            average_duration=total_time / len(sessions) if sessions else 0,
            longest_session=max(durations) if durations else 0,
            shortest_session=min(durations) if durations else 0
        )
    
    @staticmethod
    def calculate_overlap(db: Session, partner_ids: List[str], start_date: Optional[date] = None, end_date: Optional[date] = None) -> OverlapStats:
        query = db.query(DebateSession)
        
        # Apply partner_id filtering if provided
        if partner_ids:
            query = query.filter(DebateSession.partner_id.in_(partner_ids))
        
        if start_date:
            query = query.filter(DebateSession.start_time >= datetime.combine(start_date, datetime.min.time()))
        if end_date:
            query = query.filter(DebateSession.start_time <= datetime.combine(end_date, datetime.max.time()))
        
        all_sessions = query.filter(DebateSession.end_time.isnot(None)).all()
        
        husband_sessions = [s for s in all_sessions if s.partner == 'husband']
        wife_sessions = [s for s in all_sessions if s.partner == 'wife']
        
        overlaps = []
        total_overlap = 0
        
        for h_session in husband_sessions:
            if not h_session.end_time:
                continue
            for w_session in wife_sessions:
                if not w_session.end_time:
                    continue
                
                h_start = h_session.start_time
                h_end = h_session.end_time
                w_start = w_session.start_time
                w_end = w_session.end_time
                
                overlap_start = max(h_start, w_start)
                overlap_end = min(h_end, w_end)
                
                if overlap_start < overlap_end:
                    overlap_duration = int((overlap_end - overlap_start).total_seconds())
                    overlaps.append(overlap_duration)
                    total_overlap += overlap_duration
        
        return OverlapStats(
            total_overlap_time=total_overlap,
            overlap_sessions=len(overlaps),
            average_overlap_duration=total_overlap / len(overlaps) if overlaps else 0,
            longest_overlap=max(overlaps) if overlaps else 0
        )
    
    @staticmethod
    def get_weekly_stats(db: Session, week_start: date, week_end: date, partner_ids: List[str]) -> WeeklyStats:
        husband_stats = calculate_analytics.get_partner_stats(db, 'husband', partner_ids, week_start, week_end)
        wife_stats = calculate_analytics.get_partner_stats(db, 'wife', partner_ids, week_start, week_end)
        overlap_stats = calculate_analytics.calculate_overlap(db, partner_ids, week_start, week_end)
        
        # Get daily data for heatmap
        heatmap_data = []
        current_date = week_start
        while current_date <= week_end:
            daily = calculate_analytics.get_daily_stats(db, current_date)
            heatmap_data.append({
                "date": current_date.isoformat(),
                "intensity": (daily.husband_time + daily.wife_time) / 3600,  # hours
                "husband_time": daily.husband_time,
                "wife_time": daily.wife_time,
                "overlap_time": daily.overlap_time
            })
            current_date += timedelta(days=1)
        
        # Find peak day and time
        peak_day = None
        peak_time = None
        max_intensity = 0
        
        for day_data in heatmap_data:
            if day_data["intensity"] > max_intensity:
                max_intensity = day_data["intensity"]
                peak_day = day_data["date"]
        
        return WeeklyStats(
            week_start=week_start,
            week_end=week_end,
            husband=husband_stats,
            wife=wife_stats,
            overlap=overlap_stats,
            peak_day=peak_day,
            peak_time=peak_time,
            heatmap_data=heatmap_data
        )
    
    @staticmethod
    def get_monthly_stats(db: Session, year: int, month: int, partner_ids: List[str]) -> MonthlyStats:
        start_date = date(year, month, 1)
        last_day = calendar.monthrange(year, month)[1]
        end_date = date(year, month, last_day)
        
        husband_stats = calculate_analytics.get_partner_stats(db, 'husband', partner_ids, start_date, end_date)
        wife_stats = calculate_analytics.get_partner_stats(db, 'wife', partner_ids, start_date, end_date)
        overlap_stats = calculate_analytics.calculate_overlap(db, partner_ids, start_date, end_date)
        
        # Trend data (daily breakdown)
        trend_data = []
        current_date = start_date
        while current_date <= end_date:
            daily = calculate_analytics.get_daily_stats(db, current_date, partner_ids)
            trend_data.append({
                "date": current_date.isoformat(),
                "husband_time": daily.husband_time,
                "wife_time": daily.wife_time,
                "overlap_time": daily.overlap_time
            })
            current_date += timedelta(days=1)
        
        # Calendar heatmap
        calendar_heatmap = []
        current_date = start_date
        while current_date <= end_date:
            daily = calculate_analytics.get_daily_stats(db, current_date, partner_ids)
            calendar_heatmap.append({
                "date": current_date.isoformat(),
                "day": current_date.day,
                "intensity": (daily.husband_time + daily.wife_time) / 3600,
                "husband_sessions": daily.husband_sessions,
                "wife_sessions": daily.wife_sessions
            })
            current_date += timedelta(days=1)
        
        # Determine winner
        winner = None
        winner_reason = None
        
        # Least total debate time
        if husband_stats.total_time < wife_stats.total_time:
            winner = 'husband'
            winner_reason = 'least_total_time'
        elif wife_stats.total_time < husband_stats.total_time:
            winner = 'wife'
            winner_reason = 'least_total_time'
        
        # Fewest sessions (tiebreaker)
        if not winner:
            if husband_stats.total_sessions < wife_stats.total_sessions:
                winner = 'husband'
                winner_reason = 'fewest_sessions'
            elif wife_stats.total_sessions < husband_stats.total_sessions:
                winner = 'wife'
                winner_reason = 'fewest_sessions'
        
        # Peacekeeping winner (most time NOT debating when partner was)
        peacekeeping_winner = calculate_analytics.calculate_peacekeeping_winner(
            db, start_date, end_date, partner_ids
        )
        
        return MonthlyStats(
            year=year,
            month=month,
            husband=husband_stats,
            wife=wife_stats,
            overlap=overlap_stats,
            trend_data=trend_data,
            winner=winner,
            winner_reason=winner_reason,
            peacekeeping_winner=peacekeeping_winner,
            calendar_heatmap=calendar_heatmap
        )
    
    @staticmethod
    def get_daily_stats(db: Session, target_date: date, partner_ids: List[str] = None) -> DailyBreakdown:
        start_datetime = datetime.combine(target_date, datetime.min.time())
        end_datetime = datetime.combine(target_date, datetime.max.time())
        
        query = db.query(DebateSession).filter(
            and_(
                DebateSession.start_time >= start_datetime,
                DebateSession.start_time <= end_datetime
            )
        )
        
        # Apply partner_id filtering if provided
        if partner_ids:
            query = query.filter(DebateSession.partner_id.in_(partner_ids))
        
        sessions = query.order_by(DebateSession.start_time).all()
        
        husband_sessions = [s for s in sessions if s.partner == 'husband']
        wife_sessions = [s for s in sessions if s.partner == 'wife']
        
        husband_time = sum(s.duration or 0 for s in husband_sessions)
        wife_time = sum(s.duration or 0 for s in wife_sessions)
        
        # Calculate overlap
        overlap_time = 0
        for h_session in husband_sessions:
            if not h_session.end_time:
                continue
            for w_session in wife_sessions:
                if not w_session.end_time:
                    continue
                
                h_start = h_session.start_time
                h_end = h_session.end_time
                w_start = w_session.start_time
                w_end = w_session.end_time
                
                overlap_start = max(h_start, w_start)
                overlap_end = min(h_end, w_end)
                
                if overlap_start < overlap_end:
                    overlap_time += int((overlap_end - overlap_start).total_seconds())
        
        return DailyBreakdown(
            date=target_date,
            husband_sessions=len(husband_sessions),
            wife_sessions=len(wife_sessions),
            husband_time=husband_time,
            wife_time=wife_time,
            overlap_time=overlap_time,
            sessions=sessions
        )
    
    @staticmethod
    def get_general_stats(db: Session, partner_ids: List[str] = None, start_date: Optional[date] = None, end_date: Optional[date] = None) -> AnalyticsStats:
        query = db.query(DebateSession)
        
        # Apply partner_id filtering if provided
        if partner_ids:
            query = query.filter(DebateSession.partner_id.in_(partner_ids))
        
        if start_date:
            query = query.filter(DebateSession.start_time >= datetime.combine(start_date, datetime.min.time()))
        if end_date:
            query = query.filter(DebateSession.start_time <= datetime.combine(end_date, datetime.max.time()))
        
        all_sessions = query.filter(DebateSession.duration.isnot(None)).all()
        
        husband_sessions = [s for s in all_sessions if s.partner == 'husband']
        wife_sessions = [s for s in all_sessions if s.partner == 'wife']
        
        # Longest debates
        longest_husband = max([s.duration for s in husband_sessions if s.duration], default=0)
        longest_wife = max([s.duration for s in wife_sessions if s.duration], default=0)
        
        # Simultaneous debates
        simultaneous_count = 0
        longest_simultaneous = 0
        
        for h_session in husband_sessions:
            if not h_session.end_time:
                continue
            for w_session in wife_sessions:
                if not w_session.end_time:
                    continue
                
                h_start = h_session.start_time
                h_end = h_session.end_time
                w_start = w_session.start_time
                w_end = w_session.end_time
                
                if max(h_start, w_start) < min(h_end, w_end):
                    simultaneous_count += 1
                    overlap_duration = int((min(h_end, w_end) - max(h_start, w_start)).total_seconds())
                    longest_simultaneous = max(longest_simultaneous, overlap_duration)
        
        # Most/least active days
        daily_stats = {}
        for session in all_sessions:
            day_key = session.start_time.date().isoformat()
            if day_key not in daily_stats:
                daily_stats[day_key] = 0
            daily_stats[day_key] += session.duration or 0
        
        most_active_day = None
        least_active_day = None
        max_activity = 0
        min_activity = float('inf')
        
        for day_key, activity in daily_stats.items():
            if activity > max_activity:
                max_activity = activity
                most_active_day = datetime.fromisoformat(day_key).date()
            if activity < min_activity:
                min_activity = activity
                least_active_day = datetime.fromisoformat(day_key).date()
        
        # Overlap percentage
        total_time = sum(s.duration or 0 for s in all_sessions)
        overlap_time = calculate_analytics.calculate_overlap(db, partner_ids, start_date, end_date).total_overlap_time
        overlap_percentage = (overlap_time / total_time * 100) if total_time > 0 else 0
        
        # Peaceful days and streaks
        all_dates = set(s.start_time.date() for s in all_sessions)
        if start_date and end_date:
            all_possible_dates = set()
            current = start_date
            while current <= end_date:
                all_possible_dates.add(current)
                current += timedelta(days=1)
            peaceful_days = len(all_possible_dates - all_dates)
        else:
            peaceful_days = 0
        
        # Streak calculation
        sorted_dates = sorted(all_dates)
        current_streak = 0
        longest_streak = 0
        temp_streak = 0
        
        if sorted_dates:
            today = date.today()
            if today in sorted_dates:
                current_streak = 1
                for i in range(len(sorted_dates) - 1, 0, -1):
                    if (sorted_dates[i] - sorted_dates[i-1]).days == 1:
                        current_streak += 1
                    else:
                        break
            
            for i in range(1, len(sorted_dates)):
                if (sorted_dates[i] - sorted_dates[i-1]).days == 1:
                    temp_streak += 1
                else:
                    longest_streak = max(longest_streak, temp_streak)
                    temp_streak = 0
            longest_streak = max(longest_streak, temp_streak)
        
        # Frequency pattern (by day of week)
        frequency_pattern = {}
        for session in all_sessions:
            day_name = session.start_time.strftime('%A')
            frequency_pattern[day_name] = frequency_pattern.get(day_name, 0) + 1
        
        return AnalyticsStats(
            total_debates=len(all_sessions),
            total_simultaneous=simultaneous_count,
            longest_debate_husband=longest_husband,
            longest_debate_wife=longest_wife,
            longest_simultaneous=longest_simultaneous,
            most_active_day=most_active_day,
            least_active_day=least_active_day,
            debate_frequency_pattern=frequency_pattern,
            overlap_percentage=overlap_percentage,
            peaceful_days_count=peaceful_days,
            current_streak=current_streak,
            longest_streak=longest_streak
        )
    
    @staticmethod
    def get_heatmap_data(db: Session, start_date: date, end_date: date, partner_ids: List[str] = None) -> List[Dict[str, Any]]:
        heatmap = []
        current_date = start_date
        while current_date <= end_date:
            daily = calculate_analytics.get_daily_stats(db, current_date, partner_ids)
            heatmap.append({
                "date": current_date.isoformat(),
                "intensity": (daily.husband_time + daily.wife_time) / 3600,
                "husband_time": daily.husband_time,
                "wife_time": daily.wife_time,
                "overlap_time": daily.overlap_time,
                "total_sessions": daily.husband_sessions + daily.wife_sessions
            })
            current_date += timedelta(days=1)
        return heatmap
    
    @staticmethod
    def calculate_peacekeeping_winner(db: Session, start_date: date, end_date: date, partner_ids: List[str] = None) -> Optional[str]:
        """Calculate who spent more time NOT debating when their partner was debating"""
        query = db.query(DebateSession).filter(
            and_(
                DebateSession.start_time >= datetime.combine(start_date, datetime.min.time()),
                DebateSession.start_time <= datetime.combine(end_date, datetime.max.time()),
                DebateSession.end_time.isnot(None)
            )
        )
        
        # Apply partner_id filtering if provided
        if partner_ids:
            query = query.filter(DebateSession.partner_id.in_(partner_ids))
        
        all_sessions = query.all()
        husband_sessions = [s for s in all_sessions if s.partner == 'husband']
        wife_sessions = [s for s in all_sessions if s.partner == 'wife']
        
        husband_peacekeeping = 0
        wife_peacekeeping = 0
        
        # For each husband session, check if wife was NOT debating
        for h_session in husband_sessions:
            h_start = h_session.start_time
            h_end = h_session.end_time
            h_duration = (h_end - h_start).total_seconds()
            
            # Check if wife was debating during this time
            wife_debating = False
            for w_session in wife_sessions:
                w_start = w_session.start_time
                w_end = w_session.end_time
                if max(h_start, w_start) < min(h_end, w_end):
                    wife_debating = True
                    break
            
            if not wife_debating:
                wife_peacekeeping += h_duration
        
        # For each wife session, check if husband was NOT debating
        for w_session in wife_sessions:
            w_start = w_session.start_time
            w_end = w_session.end_time
            w_duration = (w_end - w_start).total_seconds()
            
            # Check if husband was debating during this time
            husband_debating = False
            for h_session in husband_sessions:
                h_start = h_session.start_time
                h_end = h_session.end_time
                if max(h_start, w_start) < min(h_end, w_end):
                    husband_debating = True
                    break
            
            if not husband_debating:
                husband_peacekeeping += w_duration
        
        if husband_peacekeeping > wife_peacekeeping:
            return 'husband'
        elif wife_peacekeeping > husband_peacekeeping:
            return 'wife'
        return None

