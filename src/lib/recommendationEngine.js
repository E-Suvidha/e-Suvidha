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
    
    // Only match if BOTH company and tender have skill keywords
    if (companySkillMatches.length > 0 && tenderSkillMatches.length > 0) {
      const score = (companySkillMatches.length + tenderSkillMatches.length) / (skillKeywords.length * 2);
      totalScore += score;
      matchedSkills.push({
        category: skillCategory,
        companySkills: companySkillMatches,
        tenderSkills: tenderSkillMatches,
        score
      });
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
    stemWords: false // Disable stemming for now
  });

  console.log('Company keywords:', companyKeywords);

  // If no company keywords, return empty array (no recommendations)
  if (companyKeywords.length === 0) {
    console.log('No company keywords found, returning empty recommendations');
    return [];
  }

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
        stemWords: false // Disable stemming for now
      });

      // Calculate various scores
      const keywordOverlap = calculateOverlapScore(companyKeywords, tenderKeywords);
      const industryScore = calculateIndustryScore(companyKeywords, tenderKeywords);
      const skillScore = calculateSkillScore(companyKeywords, tenderKeywords);
      const sizeScore = calculateSizeScore(companyKeywords, tenderKeywords);
      const locationScore = calculateLocationScore(companyProfile.location, tender.location);

      // Calculate final score (weighted combination)
      let finalScore = (
        keywordOverlap * 0.4 +           // 40% - Direct keyword overlap
        industryScore.score * 0.3 +       // 30% - Industry relevance
        skillScore.score * 0.2 +          // 20% - Skill/technology match
        sizeScore.score * 0.05 +          // 5% - Company size match
        locationScore.score * 0.05        // 5% - Location match
      );

      // Only give base score if there's at least some keyword overlap
      if (finalScore === 0 && keywordOverlap > 0) {
        finalScore = 0.05; // Base score only for tenders with some keyword overlap
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
          matchedKeywords: [...new Set([...companyKeywords, ...tenderKeywords])].filter(
            keyword => companyKeywords.includes(keyword) && tenderKeywords.includes(keyword)
          )
        }
      };
    })
    .filter(tender => tender.recommendationScore > 0.05) // More strict threshold
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
 * HYBRID SCORING: Combines content score + agent preference boost
 */
export function applyAgentBoost(contentScore, agentBoost, agentReasoning) {
  // Hybrid scoring formula:
  // finalScore = contentScore + agentBoost
  // where agentBoost is computed from persistent memory (0-0.5 max)
  
  const finalScore = contentScore + agentBoost;
  
  return {
    contentScore,        // Original keyword-based score (0-1)
    agentBoost,         // Memory-based boost (0-0.5)
    finalScore: Math.min(1, finalScore), // Final hybrid score (capped at 1)
    agentReasoning      // Explanation from agent memory
  };
}

/**
 * Enhanced recommendation function with agent integration
 * 
 * This version accepts optional agent data from backend and applies hybrid scoring
 * while preserving the original content-based logic.
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

  // Apply agent boost to each tender
  const enhancedTenders = scoredTenders.map(tender => {
    const tenderId = String(tender._id);
    const agentData = agentDataMap[tenderId];

    if (agentData) {
      // THINK PHASE: Compute hybrid score
      const { contentScore, agentBoost, finalScore, agentReasoning } = 
        applyAgentBoost(tender.recommendationScore, agentData.agentBoost, agentData.agentReasoning);

      return {
        ...tender,
        recommendationScore: finalScore,  // Updated score
        
        // Extended details with agent metadata
        recommendationDetails: {
          ...tender.recommendationDetails,
          contentScore,
          agentBoost,
          agentReasoning,
          scoringMethod: 'hybrid (content + agent preference)'
        }
      };
    }

    return tender;
  });

  // Re-sort by final hybrid score
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

  // Add score breakdown for transparency
  if (details.contentScore !== undefined || details.agentBoost !== undefined) {
    const contentScore = (details.contentScore * 100).toFixed(0);
    const agentBoost = (details.agentBoost * 100).toFixed(0);
    explanations.push(`[Content: ${contentScore}% + Agent memory: ${agentBoost}%]`);
  }

  return explanations.length > 0 ? explanations.join(' • ') : null;
}