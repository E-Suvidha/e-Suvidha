'use client';

/**
 * Agent Dashboard Component
 * 
 * Displays the AI recommendation agent's:
 * - Current goal and optimization strategy
 * - Learned preferences and categories
 * - High-signal interaction tracking (view details, bids)
 * - Confidence in recommendations
 * - Adaptation metrics
 * 
 * This gives users transparency into how the agent works
 */

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { authenticatedApiCall } from '@/lib/api';

export default function AgentDashboard() {
  const { data: session } = useSession();
  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAgentData = useCallback(async () => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true);
      const memoryResponse = await authenticatedApiCall(
        'agent-memory',
        { method: 'GET' },
        session.accessToken
      );

      if (memoryResponse) {
        setAgentData(memoryResponse);
      }
    } catch (error) {
      console.error('Error loading agent data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    loadAgentData();
  }, [session?.accessToken, loadAgentData]);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-100 rounded w-2/3"></div>
      </div>
    );
  }

  if (!agentData?.memory?.initialized) {
    return (
      <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🤖</div>
          <div>
            <h3 className="font-semibold text-blue-900">AI Agent Initializing</h3>
            <p className="text-sm text-blue-700 mt-1">
              The recommendation agent is building your profile. Interact with more tenders to improve recommendations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const memory = agentData.memory;
  const stability = parseFloat(memory.preferenceStability || 0);
  const diversification = parseFloat(memory.diversificationRatio || 0);

  return (
    <div className="space-y-4">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <h2 className="text-xl font-bold">AI Agent Profile</h2>
        </div>
        <button
          onClick={loadAgentData}
          disabled={refreshing}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
        >
          {refreshing ? 'Updating...' : 'Refresh'}
        </button>
      </div>

      {/* Agent Goal */}
      {memory.agentGoal && (
        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h3 className="font-semibold text-purple-900">Current Goal</h3>
              <p className="text-sm text-purple-700 mt-1">{memory.agentGoal}</p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Interactions */}
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 uppercase font-semibold">Total Interactions</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{memory.totalInteractions || 0}</div>
          <div className="mt-1 text-xs text-gray-500">Memory data points</div>
        </div>

        {/* Details Views */}
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 uppercase font-semibold">Details Views</div>
          <div className="mt-2 text-3xl font-bold text-orange-600">{memory.detailsViewsTracked || 0}</div>
          <div className="mt-1 text-xs text-gray-500">High-engagement clicks</div>
        </div>

        {/* Bids Placed */}
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 uppercase font-semibold">Bids Placed</div>
          <div className="mt-2 text-3xl font-bold text-green-600">{memory.bidsPlaced || 0}</div>
          <div className="mt-1 text-xs text-gray-500">{memory.bidsWon || 0} won</div>
        </div>

        {/* Confidence */}
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 uppercase font-semibold">Confidence</div>
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                  style={{ width: `${Math.min(100, (memory.totalInteractions / 20) * 100)}%` }}
                ></div>
              </div>
              <span className="text-sm font-bold text-gray-700">{Math.round((memory.totalInteractions / 20) * 100)}%</span>
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-500">Based on interactions</div>
        </div>
      </div>

      {/* Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Categories */}
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">🏭 Top Categories</h3>
          {memory.topCategories && memory.topCategories.length > 0 ? (
            <div className="space-y-2">
              {memory.topCategories.map((cat, idx) => (
                <div key={idx} className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900 capitalize">{cat.category}</div>
                    <div className="text-xs text-gray-500">
                      {cat.interactions} interactions {cat.detailsViews > 0 && `• ${cat.detailsViews} detailed views`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-1 w-16 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${parseFloat(cat.weight) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{parseFloat(cat.weight).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No category history yet</div>
          )}
        </div>

        {/* Top Skills */}
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">💡 Top Skills</h3>
          {memory.topSkills && memory.topSkills.length > 0 ? (
            <div className="space-y-2">
              {memory.topSkills.map((skill, idx) => (
                <div key={idx} className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900 capitalize">{skill.skill}</div>
                    <div className="text-xs text-gray-500">
                      {skill.interactions} interactions {skill.detailsViews > 0 && `• ${skill.detailsViews} detailed views`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-1 w-16 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${parseFloat(skill.weight) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{parseFloat(skill.weight).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No skill history yet</div>
          )}
        </div>
      </div>

      {/* Adaptation Metrics */}
      <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">📊 Adaptation Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Preference Stability */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Preference Stability</span>
              <span className="text-sm font-bold text-gray-900">{(stability * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: `${stability * 100}%` }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stability > 0.7 ? '🎯 Focused on specific categories' : stability > 0.4 ? '⚖️ Balanced preferences' : '🔍 Exploring diverse categories'}
            </p>
          </div>

          {/* Diversification */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Diversification</span>
              <span className="text-sm font-bold text-gray-900">{(diversification * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500" style={{ width: `${diversification * 100}%` }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {diversification > 0.6 ? '🌍 Exploring many categories' : diversification > 0.3 ? '📝 Moderate diversity' : '🎯 Narrow focus'}
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
        <h3 className="font-semibold text-indigo-900 mb-2">💭 How the Agent Works</h3>
        <ul className="text-sm text-indigo-800 space-y-1">
          <li>✅ <strong>Observes:</strong> Tracks your tender views, details clicks, and bid submissions</li>
          <li>🧠 <strong>Thinks:</strong> Analyzes your preferences and sets adaptive goals</li>
          <li>🎯 <strong>Acts:</strong> Ranks tenders based on learned preferences and current goal</li>
          <li>📈 <strong>Adapts:</strong> Continuously learns from your interactions</li>
        </ul>
      </div>
    </div>
  );
}
