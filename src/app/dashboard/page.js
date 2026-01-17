"use client";
import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import StatCard from '../../components/dashboard/StatCard';
import TenderCard from '../../components/tenders/TenderCard';
import ProfileCard from '../../components/dashboard/ProfileCard';
import RecentActivity from '../../components/dashboard/RecentActivity';
import DateDisplay from '../../components/common/DateDisplay';
import DashboardStats from '../../components/dashboard/DashboardStats';
import AgentRecommendationsExample from '../../components/AgentRecommendationsExample';
import AgentDashboard from '../../components/dashboard/AgentDashboard';
import AgentExplanation from '../../components/AgentExplanation';
import { authenticatedApiCall } from '../../lib/api';
import { recommendTenders, getRecommendationExplanation } from '../../lib/recommendationEngine';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [tenders, setTenders] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = session?.user || { name: 'User', company: 'Company', location: 'Location' };

  useEffect(() => {
    if (!session?.accessToken) return;

    const fetchData = async () => {
      try {
        const [tendersData, bidsData, profileData] = await Promise.all([
          authenticatedApiCall('tenders', { method: 'GET' }, session.accessToken),
          authenticatedApiCall('bids/my-bids', { method: 'GET' }, session.accessToken),
          authenticatedApiCall('auth/profile', { method: 'GET' }, session.accessToken)
        ]);
        setTenders(tendersData);
        setMyBids(bidsData);
        setUserProfile(profileData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session?.accessToken]);

  // Use advanced recommendation engine with full profile data
  const recommendedList = useMemo(() => {
    if (!tenders.length) return [];
    
    // Ensure we have profile data with all required fields
    const companyProfile = userProfile && (userProfile.company || userProfile.name) ? userProfile : {
      name: user.name,
      company: user.company,
      description: user.description,
      location: user.location,
      role: user.role
    };
    
    // Enrich profile with defaults to ensure recommendation engine works properly
    const enrichedProfile = {
      name: companyProfile.name || user.name || 'Company',
      company: companyProfile.company || user.company || '',
      description: companyProfile.description || '',
      location: companyProfile.location || user.location || '',
      role: companyProfile.role || user.role || 'company'
    };
    
    return recommendTenders(tenders, enrichedProfile);
  }, [tenders, userProfile, user]);

  // Generate user-specific activities based on their bids and profile
  const activities = useMemo(() => {
    const userActivities = [];
    
    // Add activities based on user's bids
    if (myBids && myBids.length > 0) {
      const recentBids = myBids
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 2);
      
      recentBids.forEach(bid => {
        if (bid.tender) {
          userActivities.push({
            text: `Submitted bid for ${bid.tender.title}`,
            time: new Date(bid.createdAt).toLocaleDateString()
          });
        }
      });
    }
    
    // Add default activities if no bids
    if (userActivities.length === 0) {
      userActivities.push(
        { text: `Welcome to E-Suvidha, ${user.name}!`, time: 'Today' },
        { text: `Start browsing tenders in your category`, time: 'Now' }
      );
    }
    
    return userActivities;
  }, [myBids, user.name]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Welcome, {user.name}!</h1>
      </header>

      <DashboardStats user={user} initialTenders={tenders} initialMyBids={myBids} userProfile={userProfile} />

      <section className="grid grid-cols-1 gap-6">
        

        {/* AI Agent Dashboard - shows recommendation agent's reasoning and memory */}
        <div>
          <AgentDashboard />
        </div>

        {/* Recommendations showcase */}
        <div>
          <AgentRecommendationsExample />
        </div>
        {/* How the Agent Works */}
        <div>
          <AgentExplanation />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <aside className="lg:col-span-1 space-y-4">
            <ProfileCard user={user} />
            <RecentActivity activities={activities} />
          </aside>
        </div>
      </section>
    </>
  );
}
