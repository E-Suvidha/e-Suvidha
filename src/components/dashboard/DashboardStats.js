"use client";
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import StatCard from './StatCard';
import { authenticatedApiCall } from '../../lib/api';
import { recommendTenders } from '../../lib/recommendationEngine';

export default function DashboardStats({ user, initialTenders = [], initialMyBids = [], userProfile = null }) {
  const { data: session } = useSession();
  const [tenders, setTenders] = useState(initialTenders);
  const [myBids, setMyBids] = useState(initialMyBids);

  // Periodically refresh to keep stats timely. Polling is enabled by
  // setting NEXT_PUBLIC_POLL_INTERVAL (ms). If not set, default to 5000ms
  // in development, but disable by default in production to avoid
  // unnecessary load after deployment.
  useEffect(() => {
    if (!session?.accessToken) return;

    const envInterval = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_POLL_INTERVAL;
    const intervalMs = envInterval ? parseInt(envInterval, 10) : (process.env.NODE_ENV === 'development' ? 5000 : 0);

    let alive = true;
    const refresh = async () => {
      try {
        const [tendersData, bidsData] = await Promise.all([
          authenticatedApiCall('tenders', { method: 'GET' }, session.accessToken),
          authenticatedApiCall('bids/my-bids', { method: 'GET' }, session.accessToken)
        ]);
        if (!alive) return;
        setTenders(tendersData);
        setMyBids(bidsData);
      } catch (error) {
        console.error('Failed to refresh dashboard stats:', error);
      }
    };

    // Always do an initial refresh when the component mounts and session is available
    refresh();

    let id = null;
    const onVis = () => { if (!document.hidden) refresh(); };

    if (intervalMs > 0) {
      id = setInterval(refresh, intervalMs);
      if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVis);
    } else {
      // Polling disabled (likely production). We still refresh on visibility changes
      if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVis);
    }

    return () => {
      alive = false;
      if (id) clearInterval(id);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVis);
    };
  }, [session?.accessToken]);

  const { recommended, upcomingDeadlines, activeBids, tendersWon } = useMemo(() => {
    if (!user || !tenders.length) {
      return { recommended: 0, activeBids: 0, upcomingDeadlines: 0, tendersWon: 0 };
    }

    // Use advanced recommendation engine with full profile data
    // Prioritize userProfile if available, as it has complete data from backend
    const companyProfile = userProfile && (userProfile.company || userProfile.name) ? userProfile : {
      name: user.name,
      company: user.company,
      description: user.description,
      location: user.location,
      role: user.role
    };
    
    // Ensure companyProfile has all required fields for recommendation engine
    const enrichedProfile = {
      name: companyProfile.name || user.name || 'Company',
      company: companyProfile.company || user.company || '',
      description: companyProfile.description || '',
      location: companyProfile.location || user.location || '',
      role: companyProfile.role || user.role || 'company'
    };
    
    const recommendedList = recommendTenders(tenders, enrichedProfile);
    const active = (myBids || []).filter(b => !['rejected','granted'].includes((b.status || '').toLowerCase())).length;
    const deadlines = (tenders || []).filter(t => new Date(t.submissionDeadline) > new Date()).length;
    // Count tenders won by this specific user
    const won = (myBids || []).filter(b => (b.status || '').toLowerCase() === 'granted').length;
    
    return { 
      recommended: recommendedList.length, 
      activeBids: active, 
      upcomingDeadlines: deadlines, 
      tendersWon: won 
    };
  }, [tenders, myBids, user, userProfile]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
      <StatCard title="Recommended Tenders" value={recommended} />
      <StatCard title="Active Bids" value={activeBids} />
      <StatCard title="Upcoming Deadlines" value={upcomingDeadlines} />
      <StatCard title="Tenders Won" value={tendersWon} />
    </div>
  );
}


