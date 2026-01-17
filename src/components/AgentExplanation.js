'use client';

/**
 * Agent Explanation Component
 * Shows users how the recommendation agent works
 * and what actions help improve recommendations
 */

import { useState } from 'react';

export default function AgentExplanation() {
  const [expandedSection, setExpandedSection] = useState('overview');
  const [isMainExpanded, setIsMainExpanded] = useState(true);

  const Section = ({ id, title, icon, children }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3 font-semibold text-gray-900">
          <span className="text-xl">{icon}</span>
          {title}
        </div>
        <span className={`text-gray-400 transition-transform ${expandedSection === id ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {expandedSection === id && (
        <div className="px-4 py-3 bg-white text-sm text-gray-700 space-y-2">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsMainExpanded(!isMainExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between bg-blue-100 hover:bg-blue-150 transition-colors border-b border-blue-200"
      >
        <div className="flex items-start gap-3">
          <span className="text-3xl">🤖</span>
          <div>
            <h3 className="text-lg font-bold text-blue-900">How the AI Agent Works</h3>
            <p className="text-sm text-blue-700 mt-1">
              Your personal recommendation agent learns from your interactions and gets smarter over time
            </p>
          </div>
        </div>
        <span className={`text-blue-400 transition-transform flex-shrink-0 ml-4 ${isMainExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isMainExpanded && (
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            {/* Overview */}
            <Section 
              id="overview" 
              icon="🎯" 
              title="Three-Phase Learning System"
            >
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-2xl">👁️</span>
                  <div>
                    <strong>1. OBSERVE</strong>
                    <p>Agent tracks every action: tender views, details clicks, bids, bid outcomes</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-2xl">🧠</span>
                  <div>
                    <strong>2. THINK</strong>
                    <p>Agent analyzes patterns to understand your preferences and sets strategic goals</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-2xl">🎲</span>
                  <div>
                    <strong>3. ACT</strong>
                    <p>Agent ranks tenders using learned preferences + keyword matching</p>
                  </div>
                </div>
              </div>
            </Section>

            {/* Interaction Signals */}
            <Section 
              id="signals" 
              icon="📊" 
              title="Interaction Signal Strength"
            >
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">Different actions send different signals:</p>
                <div className="space-y-2 mt-2">
                  <div className="p-2 bg-gray-100 rounded">
                    <div className="flex justify-between"><strong>Tender in List</strong><span className="text-xs text-gray-600">Low Signal</span></div>
                    <p className="text-xs text-gray-600">Agent notes: You saw this tender</p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded">
                    <div className="flex justify-between"><strong>Clicked &quot;View Details&quot; ⭐</strong><span className="text-xs text-orange-700">High Signal</span></div>
                    <p className="text-xs text-gray-600">Agent notes: You&apos;re seriously interested in this tender</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded">
                    <div className="flex justify-between"><strong>Submitted Bid ⭐⭐</strong><span className="text-xs text-green-700">Very High Signal</span></div>
                    <p className="text-xs text-gray-600">Agent notes: You wanted this tender badly</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded">
                    <div className="flex justify-between"><strong>Bid Won ⭐⭐⭐</strong><span className="text-xs text-blue-700">Strongest Signal</span></div>
                    <p className="text-xs text-gray-600">Agent notes: This tender type matches your strengths</p>
                  </div>
                </div>
              </div>
            </Section>

            {/* Learning Examples */}
            <Section 
              id="examples" 
              icon="📚" 
              title="Learning Examples"
            >
              <div className="space-y-3 text-sm">
                <div>
                  <strong className="text-gray-900">Example 1: Category Learning</strong>
                  <p className="mt-1">You click &quot;View Details&quot; on 5 IT tenders → Agent learns you&apos;re interested in IT → Ranks IT tenders higher</p>
                </div>
                <div>
                  <strong className="text-gray-900">Example 2: Skill Pattern</strong>
                  <p className="mt-1">You bid and win on tenders requiring &quot;React&quot; → Agent finds tenders needing React → Shows them first</p>
                </div>
                <div>
                  <strong className="text-gray-900">Example 3: Recency Boost</strong>
                  <p className="mt-1">You recently viewed construction tenders → Agent ranks construction tenders higher temporarily</p>
                </div>
                <div>
                  <strong className="text-gray-900">Example 4: Diversification</strong>
                  <p className="mt-1">Only viewing IT tenders? → Agent suggests supply chain tenders to help you diversify</p>
                </div>
              </div>
            </Section>

            {/* Adaptive Goals */}
            <Section 
              id="goals" 
              icon="🎲" 
              title="Adaptive Agent Goals"
            >
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-gray-900">The agent&apos;s strategy changes as you engage:</p>
                <div className="mt-2 space-y-1">
                  <p><strong>New User (0-5 interactions):</strong> &quot;Explore - Building your profile&quot;</p>
                  <p><strong>No Bids Yet:</strong> &quot;Engagement - Encouraging bid submission&quot;</p>
                  <p><strong>Some Wins:</strong> &quot;Maximize wins - Prioritizing similar tenders&quot;</p>
                  <p><strong>Established User:</strong> &quot;Improve bid success rate&quot;</p>
                </div>
                <p className="mt-2 text-gray-600 italic">Check your dashboard to see your agent&apos;s current goal!</p>
              </div>
            </Section>

            {/* Confidence Score */}
            <Section 
              id="confidence" 
              icon="💪" 
              title="Confidence Score (0-100%)"
            >
              <div className="space-y-2 text-sm">
                <p>Higher confidence = better recommendations (more data = better learning)</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between p-2 bg-gray-100 rounded text-xs">
                    <span>0-25% Confidence</span>
                    <span>Need more interactions</span>
                  </div>
                  <div className="flex justify-between p-2 bg-yellow-100 rounded text-xs">
                    <span>25-50% Confidence</span>
                    <span>Learning your patterns</span>
                  </div>
                  <div className="flex justify-between p-2 bg-orange-100 rounded text-xs">
                    <span>50-75% Confidence</span>
                    <span>Good understanding</span>
                  </div>
                  <div className="flex justify-between p-2 bg-green-100 rounded text-xs">
                    <span>75-100% Confidence</span>
                    <span>Excellent predictions</span>
                  </div>
                </div>
              </div>
            </Section>

            {/* Recommendation Formula */}
            <Section 
              id="formula" 
              icon="📐" 
              title="How Tenders Are Ranked (The Formula)"
            >
              <div className="space-y-3 text-sm">
                <p className="font-semibold text-gray-900">Final Tender Score = Content Match + Agent Memory Boost</p>
                
                <div className="bg-blue-50 p-2 rounded border border-blue-200">
                  <p className="font-mono text-xs leading-relaxed">
                    <strong>Content Score</strong> (0-50%)<br/>
                    = Keyword matching between your skills/industry and tender requirements<br/>
                    <br/>
                    <strong>+</strong><br/>
                    <br/>
                    <strong>Agent Memory Boost</strong> (0-70%)<br/>
                    = (Your category interactions ÷ Max category interactions) × 50%<br/>
                    + (Your category detail-views ÷ Max category detail-views) × 20%
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">Example Calculation:</p>
                  <div className="p-2 bg-green-50 rounded text-xs space-y-1">
                    <p><strong>Construction Tender:</strong></p>
                    <p>• Content match: 7% (skills partially match)</p>
                    <p>• You have 80 construction interactions (highest: 80) = 50% boost</p>
                    <p>• You have 10 construction detail-views (highest: 10) = 20% boost</p>
                    <p><strong>Final Score: 7% + 70% = 77%</strong> (ranked very high!)</p>
                  </div>
                </div>

                <div className="p-2 bg-yellow-50 rounded text-xs space-y-1">
                  <p className="font-semibold">📌 Key Insight:</p>
                  <p>When a category reaches 70% agent boost, it means:</p>
                  <p>✓ You have the most interactions in that category</p>
                  <p>✓ You have the most detail-views in that category</p>
                  <p>✓ The agent has maximum confidence in your preference for it</p>
                  <p>⚠️ The boost wont increase further (capped at 70% to keep content match important)</p>
                </div>
              </div>
            </Section>

            {/* How to Get Better Recommendations */}
            <Section 
              id="improve" 
              icon="📈" 
              title="How to Get Better Recommendations"
            >
              <div className="space-y-2 text-sm">
                <div>✅ <strong>Click &quot;View Details&quot;</strong> on tenders that interest you</div>
                <div>✅ <strong>Submit bids</strong> on tenders you want to win</div>
                <div>✅ <strong>Explore new categories</strong> to help agent diversify</div>
                <div>✅ <strong>Return to dashboard</strong> regularly to see what agent has learned</div>
                <div>✅ <strong>Keep track of wins</strong> - agent learns from your successes</div>
              </div>
            </Section>

            {/* Metrics Explained */}
            <Section 
              id="metrics" 
              icon="📊" 
              title="Dashboard Metrics Explained"
            >
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Total Interactions:</strong> All your clicks, views, and bids combined
                </div>
                <div>
                  <strong>Details Views:</strong> How many times you clicked &quot;View Details&quot; (high engagement signal)
                </div>
                <div>
                  <strong>Bids Placed / Won:</strong> Your bidding activity and success rate
                </div>
                <div>
                  <strong>Top Categories:</strong> Industries the agent thinks you specialize in
                </div>
                <div>
                  <strong>Top Skills:</strong> Technologies/skills agent has seen you use
                </div>
                <div>
                  <strong>Preference Stability:</strong> How focused (vs diverse) your interests are
                </div>
                <div>
                  <strong>Diversification:</strong> How many different tender types you&apos;ve explored
                </div>
              </div>
            </Section>

            {/* Privacy & Data */}
            <Section 
              id="privacy" 
              icon="🔒" 
              title="Privacy & Data"
            >
              <div className="space-y-2 text-sm">
                <p>✓ Your interaction data stays private and is only used for YOUR recommendations</p>
                <p>✓ Agent runs locally - no external ML services access your data</p>
                <p>✓ You can view your complete agent profile anytime in the dashboard</p>
                <p>✓ Recommendations adapt to changes in your interests over time</p>
              </div>
            </Section>
          </div>

          <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-900">
            💡 <strong>Tip:</strong> Check your Agent Profile on the dashboard to see what the agent has learned about you!
          </div>
        </div>
      )}
    </div>
  );
}
