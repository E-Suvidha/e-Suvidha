'use client';

/**
 * Example Component: Tender Recommendations with Agent Boost
 * 
 * Demonstrates how to integrate agent-enhanced recommendations
 * Shows:
 * - Fetching agent recommendations
 * - Applying hybrid scoring
 * - Displaying agent reasoning
 * - Showing memory profile
 */

import { useSession } from 'next-auth/react';
import { useEffect, useState, useMemo } from 'react';
import {
  getAgentRecommendations,
  getAgentMemory,
  rateRecommendation,
  authenticatedApiCall
} from '@/lib/api';
import {
  recommendTenders,
  recommendTendersWithAgent,
  getEnhancedRecommendationExplanation
} from '@/lib/recommendationEngine';

export default function AgentRecommendationsExample() {
  const { data: session } = useSession();
  const [recommendations, setRecommendations] = useState([]);
  const [agentMemory, setAgentMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTender, setSelectedTender] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Fetch user profile data once and store it
  useEffect(() => {
    if (!session?.accessToken) return;

    const fetchUserProfile = async () => {
      try {
        const profile = await authenticatedApiCall('auth/profile', { method: 'GET' }, session.accessToken);
        
        // Ensure profile has meaningful data for keyword matching
        // If description is empty, add more context from company name and role
        const enrichedProfile = {
          ...profile,
          description: profile.description || `${profile.company || ''} ${profile.role || 'company'} looking for professional services and tender opportunities`
        };
        
        console.log('Enriched profile for recommendations:', enrichedProfile);
        setUserProfile(enrichedProfile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Fallback to session data with enriched description
        const fallbackProfile = {
          name: session?.user?.name || 'User',
          company: session?.user?.company || '',
          description: `${session?.user?.company || 'Company'} professional services company`,
          location: session?.user?.location || '',
          role: session?.user?.role || 'company'
        };
        console.log('Using fallback profile:', fallbackProfile);
        setUserProfile(fallbackProfile);
      }
    };

    fetchUserProfile();
  }, [session?.accessToken, session?.user]);

  // Load recommendations when userProfile and session are ready
  useEffect(() => {
    if (!session?.accessToken || !userProfile) {
      setLoading(false);
      return;
    }

    const loadRecommendations = async () => {
      try {
        // STEP 1: Fetch all tenders first for content-based scoring
        const allTenders = await authenticatedApiCall('tenders', { method: 'GET' }, session.accessToken);

        console.log('Fetched tenders:', allTenders.length);
        console.log('User profile for scoring:', userProfile);

        // STEP 2: Apply content-based scoring using the recommendation engine
        const scoredTenders = recommendTenders(allTenders, userProfile);

        console.log('Scored tenders:', scoredTenders.map(t => ({
          title: t.title,
          score: t.recommendationScore,
          details: t.recommendationDetails
        })));

        // STEP 3: ALWAYS fetch agent recommendations, even if content scoring returns 0 tenders
        // This ensures users with interaction history get recommendations based on their preferences
        const agentResponse = await getAgentRecommendations(session.accessToken);

        if (!agentResponse || !agentResponse.recommendations || agentResponse.recommendations.length === 0) {
          // No agent recommendations available - fallback to content-based scores only
          console.log('No agent recommendations available, using content-based scores');
          setRecommendations(scoredTenders || []);
        } else if (!scoredTenders || scoredTenders.length === 0) {
          // FALLBACK: No content match, but user has interaction history
          // Rank recommendations purely by agent memory boost (category preference)
          console.log('No content match but agent has history - using agent memory boost to rank');
          
          const interactionBasedRecommendations = agentResponse.recommendations
            .map(rec => ({
              ...rec.tender,
              recommendationScore: rec.agentBoost, // Rank purely by agent boost
              recommendationDetails: {
                contentScore: 0,
                agentBoost: rec.agentBoost,
                normalizedBoost: rec.agentBoost,
                agentReasoning: rec.agentReasoning,
                scoringMethod: 'agent memory boost only (no content match available)',
                explanation: `Based on your ${rec.tender.category || 'previous'} category interactions`
              }
            }))
            .sort((a, b) => b.recommendationScore - a.recommendationScore);
          
          setRecommendations(interactionBasedRecommendations);
        } else {
          // STEP 4: Apply agent boost to content-scored tenders to get hybrid scores
          const enhancedTenders = recommendTendersWithAgent(
            scoredTenders,
            agentResponse.recommendations
          );

          setRecommendations(enhancedTenders);
        }

        // STEP 5: Load agent memory profile
        const memoryResponse = await getAgentMemory(session.accessToken);
        setAgentMemory(memoryResponse?.memory);
      } catch (error) {
        console.error('Error loading recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    // Load recommendations immediately
    loadRecommendations();

    // Auto-refresh recommendations every 5 seconds to reflect memory updates from view-details clicks
    console.log('[RECOMMENDATIONS] Setting up 5-second auto-refresh to reflect agent memory changes');
    const pollInterval = setInterval(() => {
      console.log('[RECOMMENDATIONS] Auto-refreshing recommendations due to potential memory updates');
      loadRecommendations();
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      console.log('[RECOMMENDATIONS] Cleaning up auto-refresh interval');
    };
  }, [session?.accessToken, userProfile]);

  const handleRateRecommendation = async (tenderId, rating) => {
    if (!session?.accessToken) return;

    try {
      await rateRecommendation(
        tenderId,
        rating,
        `User rated this recommendation ${rating}/5 stars`,
        session.accessToken
      );
      console.log(`Rated tender ${tenderId}: ${rating}/5`);
    } catch (error) {
      console.error('Error rating recommendation:', error);
    }
  };

  if (loading) return <div>Loading recommendations...</div>;

  return (
    <div className="space-y-8">
      {/* SECTION 1: Agent Memory Profile */}
      <section className="bg-blue-50 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Your Learning Profile</h2>
        
        {agentMemory?.initialized ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Top Industries of Interest</h3>
              <div className="mt-2 space-y-2">
                {agentMemory.topCategories?.slice(0, 3).map(cat => (
                  <div key={cat.category} className="flex justify-between items-center">
                    <span className="capitalize">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden"
                        title={`Weight: ${cat.weight}`}
                      >
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${parseFloat(cat.weight) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        ({cat.interactions} interactions)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg">Key Skills</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {agentMemory.topSkills?.slice(0, 5).map(skill => (
                  <span
                    key={skill.skill}
                    className="px-3 py-1 bg-blue-200 text-blue-900 rounded-full text-sm"
                  >
                    {skill.skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">Total Views</div>
                <div className="text-2xl font-bold">{agentMemory.viewCount}</div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">Total Bids</div>
                <div className="text-2xl font-bold">{agentMemory.bidCount}</div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="text-sm text-gray-600">Preference Focus</div>
                <div className="text-2xl font-bold">
                  {(parseFloat(agentMemory.preferenceStability) * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600 italic">
              The agent learns from your interactions and adapts recommendations over time.
              More interactions = better personalization.
            </p>
          </div>
        ) : (
          <p className="text-gray-600">
            No learning profile yet. View and bid on tenders to help the agent learn your preferences.
          </p>
        )}
      </section>

      {/* SECTION 2: Recommended Tenders with Hybrid Scores */}
      <section>
        <h2 className="text-2xl font-bold mb-4">
          Recommended Tenders
          <span className="text-sm font-normal text-gray-600 ml-2">
            (Ranked by Content + Agent Memory Boost)
          </span>
        </h2>

        {recommendations.length === 0 ? (
          <p className="text-gray-600">No recommendations available yet.</p>
        ) : (
          <div className="space-y-4">
            {recommendations.map(tender => (
              <div
                key={tender._id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedTender(tender)}
              >
                {/* Tender Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">{tender.title}</h3>
                    <p className="text-sm text-gray-600">
                      Category: {tender.category} | Location: {tender.location}
                    </p>
                  </div>
                  
                  {/* Score Display - Shows Hybrid Scoring Breakdown */}
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">
                      {(tender.recommendationScore * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {tender.recommendationDetails?.contentScore && (
                        <>
                          Content: {(tender.recommendationDetails.contentScore * 100).toFixed(0)}%
                          <br />
                        </>
                      )}
                      {tender.recommendationDetails?.agentBoost && (
                        <>
                          Agent: +{(tender.recommendationDetails.agentBoost * 100).toFixed(0)}%
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recommendation Explanation */}
                <div className="bg-gray-50 p-3 rounded mb-3">
                  <p className="text-sm text-gray-700">
                    <strong>Why recommended:</strong>{' '}
                    {getEnhancedRecommendationExplanation(tender, userProfile) ||
                      'No specific reason available'}
                  </p>
                  
                  {/* Agent Reasoning - Shows the formula */}
                  {tender.recommendationDetails?.agentReasoning && (
                    <div className="text-xs text-blue-700 mt-2 italic bg-blue-50 p-2 rounded">
                      🤖 <strong>Agent Memory Boost:</strong> {tender.recommendationDetails.agentReasoning}
                      <br/>
                      <span className="text-gray-600">[Content: {(tender.recommendationDetails.contentScore * 100 || 0).toFixed(0)}% + Memory boost: {(tender.recommendationDetails.agentBoost * 100).toFixed(0)}% = <strong>{(((tender.recommendationDetails.contentScore || 0) + tender.recommendationDetails.agentBoost) * 100).toFixed(0)}%</strong>]</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRateRecommendation(tender._id, 5)}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    👍 Good Recommendation
                  </button>
                  <button
                    onClick={() => handleRateRecommendation(tender._id, 2)}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    👎 Not Relevant
                  </button>
                  <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                    → View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 3: Architecture Documentation (for transparency) */}
      <section className="bg-gray-50 p-4 rounded text-sm text-gray-600 space-y-2">
        <h3 className="font-semibold text-gray-800">How This Works</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Observe:</strong> Backend tracks your tender views, bids, and bid outcomes
          </li>
          <li>
            <strong>Memory:</strong> Your interests (categories, skills) are stored and weighted
          </li>
          <li>
            <strong>Think:</strong> Agent computes a preference boost based on your history
          </li>
          <li>
            <strong>Act:</strong> Recommendations ranked by hybrid score (content + agent boost)
          </li>
          <li>
            <strong>Explain:</strong> You see why each tender is recommended
          </li>
        </ul>
      </section>

      {/* SECTION 4: Detailed View (Optional) */}
      {selectedTender && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{selectedTender.title}</h2>
            
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-700">{selectedTender.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-semibold">Category</h3>
                <p>{selectedTender.category}</p>
              </div>
              <div>
                <h3 className="font-semibold">Location</h3>
                <p>{selectedTender.location}</p>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="bg-blue-50 p-4 rounded mb-4">
              <h3 className="font-semibold mb-2">Recommendation Score Breakdown</h3>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Content-Based Score (Keyword Matching)</span>
                    <span className="font-semibold">
                      {(selectedTender.recommendationDetails?.contentScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-purple-500"
                      style={{
                        width: `${
                          (selectedTender.recommendationDetails?.contentScore || 0) * 100
                        }%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm">
                    <span>Agent Memory Boost</span>
                    <span className="font-semibold">
                      +{(selectedTender.recommendationDetails?.agentBoost * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${
                          (selectedTender.recommendationDetails?.agentBoost || 0) * 100
                        }%`
                      }}
                    />
                  </div>
                </div>

                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Final Score</span>
                    <span>
                      {(selectedTender.recommendationScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedTender(null)}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
