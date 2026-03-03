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
  const [winProfile, setWinProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [winExplanationOpen, setWinExplanationOpen] = useState(false);

  const loadAgentData = useCallback(async () => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true);

      const [memoryResponse, winResponse] = await Promise.all([
        authenticatedApiCall(
          'agent-memory',
          { method: 'GET' },
          session.accessToken
        ),
        authenticatedApiCall(
          'agent/win-profile',
          { method: 'GET' },
          session.accessToken
        )
      ]);

      if (memoryResponse) {
        setAgentData(memoryResponse);
      }

      if (winResponse) {
        setWinProfile(winResponse);
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

  const winAvg = winProfile?.userAverageWinProb || 0;
  const winGlobal = winProfile?.globalWinRate || 0;
  const winTenders = winProfile?.tenders || [];
  const winTotalPublished = winProfile?.totalPublishedCount ?? winProfile?.sampleCount ?? 0;
  const winProbSum = winTenders.reduce((s, t) => s + (t.winProbability || 0), 0) || 1;

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
                  style={{ width: `${Math.min(100, Math.round((memory.totalInteractions / 20) * 100))}%` }}
                ></div>
              </div>
              <span className="text-sm font-bold text-gray-700">{Math.min(100, Math.round((memory.totalInteractions / 20) * 100))}%</span>
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
      {/* Win Likelihood: donut chart by tender (name + color key + %) */}
      {winProfile && (
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">📈 Win Likelihood</h3>

          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Donut chart (perimeter ring, slices = tenders by win probability) */}
            <div className="relative w-44 h-44 shrink-0">
              <svg viewBox="0 0 120 120" className="w-full h-full">
                {winTenders.length > 0 && (() => {
                  const cx = 60;
                  const cy = 60;
                  const rOuter = 50;
                  const rInner = 28;
                  const colors = ['#4f46e5', '#22c55e', '#f97316', '#e11d48', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6', '#eab308', '#ef4444', '#3b82f6', '#84cc16'];
                  let cumulative = 0;

                  return winTenders.map((t, idx) => {
                    const portion = (t.winProbability || 0) / winProbSum;
                    if (portion <= 0) return null;
                    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
                    const endAngle = (cumulative + portion) * 2 * Math.PI - Math.PI / 2;
                    cumulative += portion;

                    const x1o = cx + rOuter * Math.cos(startAngle);
                    const y1o = cy + rOuter * Math.sin(startAngle);
                    const x2o = cx + rOuter * Math.cos(endAngle);
                    const y2o = cy + rOuter * Math.sin(endAngle);
                    const x1i = cx + rInner * Math.cos(startAngle);
                    const y1i = cy + rInner * Math.sin(startAngle);
                    const x2i = cx + rInner * Math.cos(endAngle);
                    const y2i = cy + rInner * Math.sin(endAngle);
                    const largeArc = portion > 0.5 ? 1 : 0;
                    const d = `M ${x1o} ${y1o} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2o} ${y2o} L ${x2i} ${y2i} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x1i} ${y1i} Z`;
                    return (
                      <path key={t.tenderId || idx} d={d} fill={colors[idx % colors.length]} />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-gray-500">Avg</span>
                <span className="text-lg font-bold text-gray-900">{(winAvg * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Legend: tender name + color key + win % */}
            <div className="flex-1 min-w-0 space-y-2">
              {winTenders.length > 0 ? (
                <>
                  {winTenders.map((t, idx) => {
                    const pct = (t.winProbability ?? 0) * 100;
                    const color = ['#4f46e5', '#22c55e', '#f97316', '#e11d48', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6', '#eab308', '#ef4444', '#3b82f6', '#84cc16'][idx % 12];
                    const title = (t.title || t.tenderId || 'Tender').slice(0, 40);
                    return (
                      <div key={t.tenderId || idx} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-[11px] text-gray-700 truncate" title={t.title || t.tenderId}>{title}</span>
                        </div>
                        <span className="text-[11px] text-gray-800 font-semibold shrink-0">
                          {Number.isFinite(pct) ? `${pct.toFixed(0)}%` : '—'}
                        </span>
                      </div>
                    );
                  })}
                  <div className="pt-1 text-[10px] text-gray-400">
                    {winTotalPublished} published tenders · Top {winTenders.length} shown
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  No published tenders yet. Win likelihood will appear here when tenders with status &quot;open&quot; are available.
                </p>
              )}
              <div className="text-[10px] text-gray-400">
                All users win rate: {(winGlobal * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Collapsible: why recommendations and win likelihood are shown this way */}
          <div className="mt-4 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setWinExplanationOpen((o) => !o)}
              className="flex items-center gap-2 w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded px-1 py-0.5"
              aria-expanded={winExplanationOpen}
            >
              <span className="text-gray-500" aria-hidden>
                {winExplanationOpen ? '▼' : '▶'}
              </span>
              Why are recommendations and win likelihood shown like this?
            </button>
            {winExplanationOpen && (
              <div className="mt-3 pl-5 text-sm text-gray-600 space-y-2">
                <p>
                  <strong>Win likelihood</strong> is estimated from historical bid outcomes, not from clicks or guesses.
                  When enough past bids exist, a small model is trained to predict the chance that a bid will be granted.
                  It uses: your overall win rate, how well you do in this tender&apos;s category, how similar this tender is to ones you&apos;ve won (using semantic embeddings), and platform-wide win rates.
                </p>
                <p>
                  <strong>Recommendations</strong> use the same signals—your preferences, categories, and past engagement—and rank tenders by both relevance and win likelihood so you see opportunities that fit you and have a realistic chance of success.
                </p>
                <p className="text-xs text-gray-500">
                  If no trained model exists yet (e.g. little historical data), a simple rule-based estimate is used until more data is available.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
