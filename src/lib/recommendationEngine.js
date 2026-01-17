/**
 * Advanced Tender Recommendation Engine
 * Matches tenders with company profiles using keyword analysis and scoring
 * 
 * ENHANCED: Supports agentic AI with agent preference boost from backend memory
 */

// Industry-specific keyword mappings
const INDUSTRY_KEYWORDS = {
  it: ['software', 'development', 'programming', 'coding', 'application', 'system', 'database', 'network', 'security', 'cloud', 'devops', 'api', 'web', 'mobile', 'digital', 'automation', 'integration', 'maintenance', 'support', 'infrastructure'],
  construction: ['construction', 'building', 'civil', 'engineering', 'architecture', 'contractor', 'materials', 'equipment', 'project', 'site', 'foundation', 'structure', 'renovation', 'repair', 'maintenance'],
  supply: ['supply', 'procurement', 'purchase', 'vendor', 'equipment', 'materials', 'goods', 'products', 'inventory', 'logistics', 'distribution', 'delivery'],
  consulting: ['consulting', 'advisory', 'strategy', 'planning', 'analysis', 'research', 'assessment', 'evaluation', 'recommendation', 'guidance', 'expertise'],
  healthcare: ['healthcare', 'medical', 'hospital', 'clinic', 'pharmaceutical', 'treatment', 'diagnosis', 'therapy', 'equipment', 'facility', 'patient', 'care'],
  education: ['education', 'school', 'university', 'training', 'learning', 'curriculum', 'teaching', 'student', 'academic', 'institution', 'facility'],
  finance: ['finance', 'banking', 'financial', 'accounting', 'audit', 'investment', 'insurance', 'payment', 'transaction', 'compliance', 'risk'],
  transportation: ['transportation', 'logistics', 'shipping', 'delivery', 'fleet', 'vehicle', 'freight', 'cargo', 'distribution', 'warehouse'],
  energy: ['energy', 'power', 'electricity', 'renewable', 'solar', 'wind', 'utility', 'grid', 'generation', 'distribution', 'efficiency'],
  government: ['government', 'public', 'administrative', 'policy', 'regulation', 'compliance', 'service', 'citizen', 'municipal', 'federal', 'state']
};

// Skill and technology keywords
const SKILL_KEYWORDS = {
  programming: ['javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'typescript', 'react', 'angular', 'vue', 'node', 'express'],
  databases: ['mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'sqlite', 'cassandra', 'elasticsearch', 'database', 'sql', 'nosql'],
  cloud: ['aws', 'azure', 'gcp', 'google cloud', 'amazon web services', 'microsoft azure', 'cloud', 'saas', 'paas', 'iaas', 'kubernetes', 'docker'],
  frameworks: ['react', 'angular', 'vue', 'django', 'flask', 'spring', 'laravel', 'express', 'rails', 'asp.net', 'framework', 'library'],
  tools: ['git', 'jenkins', 'docker', 'kubernetes', 'terraform', 'ansible', 'ci/cd', 'devops', 'agile', 'scrum', 'jira', 'confluence'],
  design: ['ui', 'ux', 'design', 'photoshop', 'illustrator', 'figma', 'sketch', 'wireframe', 'prototype', 'frontend', 'backend', 'fullstack']
};

// Company size indicators
const COMPANY_SIZE_KEYWORDS = {
  startup: ['startup', 'small', 'emerging', 'new', 'innovative', 'agile'],
  sme: ['sme', 'small', 'medium', 'enterprise', 'established', 'growing'],
  enterprise: ['enterprise', 'large', 'corporate', 'multinational', 'fortune', 'global']
};

/**
 * Normalize text for keyword extraction
 */
function normalizeText(text) {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Extract meaningful keywords from text
 */
function extractKeywords(text, options = {}) {
  const {
    minLength = 3,
    maxLength = 20,
    removeStopWords = true,
    stemWords = true
  } = options;

  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/).filter(word => word.length >= minLength && word.length <= maxLength);
  
  // Stop words to remove
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'of', 'to', 'in', 'on', 'a', 'an', 'we', 'our', 'your', 'their',
    'services', 'service', 'solution', 'solutions', 'pvt', 'ltd', 'private', 'limited', 'company',
    'client', 'clients', 'across', 'from', 'this', 'that', 'these', 'those', 'is', 'are', 'was',
    'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'can', 'must', 'shall'
  ]);

  let filteredWords = words;
  if (removeStopWords) {
    filteredWords = words.filter(word => !stopWords.has(word));
  }

  // Simple stemming (remove common suffixes) - less aggressive
  if (stemWords) {
    filteredWords = filteredWords.map(word => {
      // Only remove 's' suffix, keep other suffixes for better matching
      return word
        .replace(/s$/, '') // Only remove 's' suffix
        .slice(0, maxLength);
    });
  }

  return Array.from(new Set(filteredWords));
}

/**
 * Calculate keyword overlap score between two sets of keywords
 */
function calculateOverlapScore(keywords1, keywords2) {
  if (!keywords1.length || !keywords2.length) return 0;
  
  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  // Jaccard similarity coefficient
  return intersection.size / union.size;
}

/**
 * Calculate industry relevance score
 */
function calculateIndustryScore(companyKeywords, tenderKeywords) {
  let maxScore = 0;
  let matchedIndustry = null;

  for (const [industry, industryKeywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    const industrySet = new Set(industryKeywords);
    const companyIndustryMatches = companyKeywords.filter(k => industrySet.has(k));
    const tenderIndustryMatches = tenderKeywords.filter(k => industrySet.has(k));
    
    // Only match if BOTH company and tender have industry keywords
    if (companyIndustryMatches.length > 0 && tenderIndustryMatches.length > 0) {
      const score = (companyIndustryMatches.length + tenderIndustryMatches.length) / (industryKeywords.length * 2);
      if (score > maxScore) {
        maxScore = score;
        matchedIndustry = industry;
      }
    }
  }

  return { score: maxScore, industry: matchedIndustry };
}

/**
 * Calculate skill/technology relevance score
 */
function calculateSkillScore(companyKeywords, tenderKeywords) {
  let totalScore = 0;
  let matchedSkills = [];

  for (const [skillCategory, skillKeywords] of Object.entries(SKILL_KEYWORDS)) {
    const skillSet = new Set(skillKeywords);
    const companySkillMatches = companyKeywords.filter(k => skillSet.has(k));
    const tenderSkillMatches = tenderKeywords.filter(k => skillSet.has(k));
    
    // Match if EITHER company or tender has skill keywords (softer match than industry)
    if (companySkillMatches.length > 0 || tenderSkillMatches.length > 0) {
      // Boost score if both have matches
      const hasCompanySkills = companySkillMatches.length > 0 ? 1 : 0.5;
      const hasTenderSkills = tenderSkillMatches.length > 0 ? 1 : 0.5;
      const score = (companySkillMatches.length + tenderSkillMatches.length) / (skillKeywords.length * 2);
      
      totalScore += Math.min(0.15, score * hasCompanySkills * hasTenderSkills);
      
      if (score > 0) {
        matchedSkills.push({
          category: skillCategory,
          companySkills: companySkillMatches,
          tenderSkills: tenderSkillMatches,
          score
        });
      }
    }
  }

  return { score: totalScore, skills: matchedSkills };
}

/**
 * Calculate company size relevance
 */
function calculateSizeScore(companyKeywords, tenderKeywords) {
  for (const [size, sizeKeywords] of Object.entries(COMPANY_SIZE_KEYWORDS)) {
    const sizeSet = new Set(sizeKeywords);
    const companySizeMatches = companyKeywords.filter(k => sizeSet.has(k)).length;
    const tenderSizeMatches = tenderKeywords.filter(k => sizeSet.has(k)).length;
    
    if (companySizeMatches > 0 && tenderSizeMatches > 0) {
      return { score: 0.3, size }; // Bonus for size match
    }
  }
  return { score: 0, size: null };
}

/**
 * Calculate location relevance (if location data is available)
 */
function calculateLocationScore(companyLocation, tenderLocation) {
  if (!companyLocation || !tenderLocation) return { score: 0, location: null };
  
  const companyLoc = normalizeText(companyLocation);
  const tenderLoc = normalizeText(tenderLocation);
  
  // Simple location matching
  if (companyLoc.includes(tenderLoc) || tenderLoc.includes(companyLoc)) {
    return { score: 0.2, location: companyLocation };
  }
  
  return { score: 0, location: null };
}

/**
 * Main recommendation function
 */
export function recommendTenders(tenders, companyProfile) {
  if (!tenders || !companyProfile) return [];

  console.log('Recommendation engine - Company profile:', companyProfile);

  // Extract company keywords from profile
  const companyText = [
    companyProfile.name || '',
    companyProfile.company || '',
    companyProfile.description || '',
    companyProfile.location || ''
  ].join(' ');

  const companyKeywords = extractKeywords(companyText, {
    minLength: 3,
    maxLength: 20,
    removeStopWords: true,
    stemWords: false
  });

  console.log('Company keywords:', companyKeywords);

  // Score each tender
  const scoredTenders = tenders
    .filter(tender => tender.status !== 'awarded') // Only show open tenders
    .map(tender => {
      // Extract tender keywords
      const tenderText = [
        tender.title || '',
        tender.description || '',
        tender.category || '',
        tender.location || ''
      ].join(' ');

      const tenderKeywords = extractKeywords(tenderText, {
        minLength: 3,
        maxLength: 20,
        removeStopWords: true,
        stemWords: false
      });

      // Calculate various scores
      const keywordOverlap = calculateOverlapScore(companyKeywords, tenderKeywords);
      const industryScore = calculateIndustryScore(companyKeywords, tenderKeywords);
      const skillScore = calculateSkillScore(companyKeywords, tenderKeywords);
      const sizeScore = calculateSizeScore(companyKeywords, tenderKeywords);
      const locationScore = calculateLocationScore(companyProfile.location, tender.location);

      // Calculate final score (weighted combination)
      let finalScore = (
        keywordOverlap * 0.35 +           // 35% - Direct keyword overlap
        industryScore.score * 0.25 +      // 25% - Industry relevance
        skillScore.score * 0.25 +         // 25% - Skill/technology match
        locationScore.score * 0.08 +      // 8% - Location match
        sizeScore.score * 0.07            // 7% - Company size match
      );

      // Tiebreaker: If two tenders have same main score, use title length as differentiator
      const titleBonus = (tender.title.split(' ').length / 100) * 0.02;

      // FALLBACK SCORING: If profile has very few keywords (likely no description),
      // give recommendations based on tender category diversity
      // This ensures users still see recommendations even with minimal profile data
      // HOWEVER: Always enforce industry matching - never show irrelevant industries
      if (companyKeywords.length < 8) {
        // Profile is minimal - use category-based fallback scoring
        // BUT only if there's industry or skill relevance
        if (industryScore.score > 0 || skillScore.score > 0) {
          // Tender is relevant to company's industry - show it with base score
          if (finalScore === 0) {
            finalScore = 0.15; // Higher base score for relevant tenders
          } else {
            finalScore += 0.05; // Small boost if there's ANY match
          }
        }
        // If no industry match, leave score at 0 (don't show irrelevant tenders)
      } else {
        // Profile has good data - use stricter scoring
        if (finalScore === 0) {
          // Only score if there's ANY relevance signal
          if (industryScore.score > 0 || skillScore.score > 0) {
            finalScore = 0.08;
          }
        } else {
          finalScore += titleBonus;
        }
      }

      console.log(`Tender: ${tender.title}`);
      console.log(`Tender keywords:`, tenderKeywords);
      console.log(`Keyword overlap:`, keywordOverlap);
      console.log(`Industry score:`, industryScore);
      console.log(`Skill score:`, skillScore);
      console.log(`Final score:`, finalScore);
      console.log('---');

      return {
        ...tender,
        recommendationScore: finalScore,
        recommendationDetails: {
          keywordOverlap,
          industry: industryScore.industry,
          industryScore: industryScore.score,
          skills: skillScore.skills,
          skillScore: skillScore.score,
          size: sizeScore.size,
          location: locationScore.location,
          matchedKeywords: companyKeywords.length > 0
            ? [...new Set([...companyKeywords, ...tenderKeywords])].filter(
                keyword => companyKeywords.includes(keyword) && tenderKeywords.includes(keyword)
              )
            : [], // Empty if no company keywords
          profileStrength: companyKeywords.length // Track how complete the profile is
        }
      };
    })
    .filter(tender => tender.recommendationScore > 0) // Include all scored tenders
    .sort((a, b) => b.recommendationScore - a.recommendationScore); // Sort by score

  console.log('Scored tenders:', scoredTenders.map(t => ({
    title: t.title,
    score: t.recommendationScore,
    industry: t.recommendationDetails.industry,
    matchedKeywords: t.recommendationDetails.matchedKeywords
  })));

  return scoredTenders;
}

/**
 * Get recommendation explanation for a tender
 */
export function getRecommendationExplanation(tender, companyProfile) {
  if (!tender.recommendationDetails) return 'No explanation available';

  const details = tender.recommendationDetails;
  const explanations = [];

  // Only show explanations if there are actual matches
  if (details.keywordOverlap > 0.1) {
    explanations.push(`Matches ${details.matchedKeywords.length} keywords: ${details.matchedKeywords.slice(0, 3).join(', ')}`);
  }

  if (details.industry && details.industryScore > 0) {
    explanations.push(`Industry match: ${details.industry}`);
  }

  if (details.skills && details.skills.length > 0) {
    const topSkills = details.skills.slice(0, 2).map(s => s.category).join(', ');
    explanations.push(`Skills match: ${topSkills}`);
  }

  if (details.location) {
    explanations.push(`Location match: ${details.location}`);
  }

  // If no specific matches, don't show explanation
  if (explanations.length === 0) {
    return null;
  }

  return explanations.join(' • ');
}
/**
 * Apply agent preference boost to existing content score
 * 
 * THINKING PHASE: Uses memory-based preference boost from backend agent
 * HYBRID SCORING: Combines content score + agent preference boost with normalization
 * 
 * NORMALIZED BOOST: The agent boost is scaled relative to the content score
 * to avoid inflating all recommendations equally
 * - High content score + high agent boost = strong candidate
 * - Low content score + high agent boost = modest boost
 * - This prevents agent memory from overwhelming content-based matching
 */
export function applyAgentBoost(contentScore, agentBoost, agentReasoning) {
  // Normalized hybrid scoring formula:
  // For each tender, scale the agent boost relative to its content score
  // This ensures agent memory enhances differentiation rather than flattening it
  
  // Scale agent boost by content score to normalize its impact
  // - If content score is 0.5, boost effect is 50% of full boost
  // - If content score is 0.1, boost effect is 10% of full boost
  // This prevents low-matching tenders from getting unfair boosts
  const normalizedBoost = agentBoost * contentScore;
  
  const finalScore = contentScore + normalizedBoost;
  
  return {
    contentScore,              // Original keyword-based score (0-1)
    agentBoost,                // Raw agent memory boost (0-0.5)
    normalizedBoost,           // Scaled boost applied (contentScore * agentBoost)
    finalScore: Math.min(1, finalScore), // Final hybrid score (capped at 1)
    agentReasoning             // Explanation from agent memory
  };
}

/**
 * Enhanced recommendation function with agent integration
 * 
 * This version accepts optional agent data from backend and applies hybrid scoring
 * while preserving the original content-based logic.
 * 
 * NORMALIZATION: Agent boost is scaled by content score to prevent
 * equal inflation of all recommendations
 */
export function recommendTendersWithAgent(scoredTenders, agentRecommendations) {
  if (!scoredTenders || scoredTenders.length === 0) return [];
  
  // If no agent data available, return original scored tenders
  if (!agentRecommendations || agentRecommendations.length === 0) {
    return scoredTenders;
  }

  // Create a map of tender ID -> agent data for quick lookup
  const agentDataMap = {};
  for (const rec of agentRecommendations) {
    agentDataMap[String(rec.tender._id)] = {
      agentBoost: rec.agentBoost,
      agentReasoning: rec.agentReasoning
    };
  }

  // Apply agent boost to each tender with normalization
  const enhancedTenders = scoredTenders.map(tender => {
    const tenderId = String(tender._id);
    const agentData = agentDataMap[tenderId];

    if (agentData) {
      // THINK PHASE: Compute hybrid score with NORMALIZED boost
      const { contentScore, agentBoost, normalizedBoost, finalScore, agentReasoning } = 
        applyAgentBoost(tender.recommendationScore, agentData.agentBoost, agentData.agentReasoning);

      return {
        ...tender,
        recommendationScore: finalScore,  // Updated score with normalized boost
        
        // Extended details with agent metadata (including normalized boost)
        recommendationDetails: {
          ...tender.recommendationDetails,
          contentScore,
          agentBoost,
          normalizedBoost,  // Store normalized boost for transparency
          agentReasoning,
          scoringMethod: 'hybrid (content + normalized agent preference)'
        }
      };
    }

    return tender;
  });

  // Re-sort by final hybrid score (which now respects content matching)
  return enhancedTenders.sort((a, b) => b.recommendationScore - a.recommendationScore);
}

/**
 * Enhanced explanation that includes agent reasoning
 */
export function getEnhancedRecommendationExplanation(tender, companyProfile) {
  const baseExplanation = getRecommendationExplanation(tender, companyProfile);
  
  if (!tender.recommendationDetails) {
    return baseExplanation;
  }

  const details = tender.recommendationDetails;
  const explanations = baseExplanation ? [baseExplanation] : [];

  // Add agent preference reasoning
  if (details.agentReasoning) {
    explanations.push(`Recommended based on past interaction with similar tenders: ${details.agentReasoning}`);
  }

  // Add score breakdown for transparency (normalized)
  if (details.contentScore !== undefined && details.normalizedBoost !== undefined) {
    const contentScore = (details.contentScore * 100).toFixed(0);
    const normalizedBoost = (details.normalizedBoost * 100).toFixed(0);
    explanations.push(`[Content: ${contentScore}% + Memory boost: ${normalizedBoost}%]`);
  }

  return explanations.length > 0 ? explanations.join(' • ') : null;
}