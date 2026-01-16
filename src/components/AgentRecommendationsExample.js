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
import { useEffect, useState } from 'react';
import {
  getAgentRecommendations,
  getAgentMemory,
  rateRecommendation
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

  // Example user profile (from your authentication/profile)
  const userProfile = {
    name: session?.user?.name || 'User',
    company: session?.user?.company || '',
    description: session?.user?.description || '',
    location: session?.user?.location || ''
  };

  useEffect(() => {
    const loadRecommendations = async () => {
      if (!session?.accessToken) {
        setLoading(false);
        return;
      }

      try {
        // STEP 1: Fetch agent recommendations (with preference boost from backend)
        const agentResponse = await getAgentRecommendations(session.accessToken);

        if (!agentResponse) {
          console.warn('No agent recommendations available');
          setLoading(false);
          return;
        }

        // STEP 2: Apply original content-based scoring to tenders
        // (In real app, you'd fetch actual tenders first)
        const scoredTenders = agentResponse.recommendations.map(rec => ({
          ...rec.tender,
          recommendationScore: 0.7, // Placeholder - use your actual content scoring
          recommendationDetails: {
            keywordOverlap: 0.5,
            industry: rec.tender.category,
            industryScore: 0.3,
            skills: [],
            skillScore: 0,
            matchedKeywords: []
          }
        }));

        // STEP 3: Apply agent boost to get hybrid scores
        const enhancedTenders = recommendTendersWithAgent(
          scoredTenders,
          agentResponse.recommendations
        );

        setRecommendations(enhancedTenders);

        // STEP 4: Load agent memory profile
        const memoryResponse = await getAgentMemory(session.accessToken);
        setAgentMemory(memoryResponse?.memory);
      } catch (error) {
        console.error('Error loading recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [session?.accessToken]);

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
                  
                  {/* Agent Reasoning */}
                  {tender.recommendationDetails?.agentReasoning && (
                    <p className="text-xs text-blue-700 mt-2 italic">
                      🤖 Agent: {tender.recommendationDetails.agentReasoning}
                    </p>
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
