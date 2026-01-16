"use client";

import Link from 'next/link';
import BidModal from '../../components/bids/BidModal';
import { useEffect, useState } from 'react';
import { getRecommendationExplanation } from '../../lib/recommendationEngine';
import { useSession } from 'next-auth/react';
import { authenticatedApiCall } from '../../lib/api';

/**
 * Track view-details interaction with backend agent
 * OBSERVE PHASE: Notifies agent that user clicked "View Details"
 */
async function trackViewDetailsClick(tenderId, session) {
  if (!session?.accessToken || !tenderId) return;
  
  try {
    await authenticatedApiCall(
      `tenders/${tenderId}/track-interaction`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactionType: 'view-details' })
      },
      session.accessToken
    ).catch(err => {
      console.debug('Background tracking:', err?.message || 'Track interaction');
    });
  } catch (error) {
    console.debug('Tracking not available');
  }
}

export default function TenderCard({ tender, statusBadge, DateDisplay, showRecommendation = false, userRole = 'company', allowApply = true, showDetails = true, showStatusBadge = true, variant = 'default' }) {
  // fallback for DateDisplay if not provided
  const DateFmt = DateDisplay || (({ value }) => <>{value ? String(value) : '—'}</>);
  const [formattedValue, setFormattedValue] = useState(
    typeof tender.value === 'number' ? tender.value.toString() : tender.value || ''
  );
  const { data: session } = useSession();

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof tender.value === 'number') {
      setFormattedValue(tender.value.toLocaleString());
    }
  }, [tender.value]);

  // Get recommendation explanation if available
  const recommendationExplanation = showRecommendation && tender.recommendationDetails 
    ? getRecommendationExplanation(tender, {}) 
    : null;

  const royalClasses = variant === 'royal' ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl border-0' : 'bg-white';

  // determine if user is allowed to apply for this tender (defaults to prop allowApply and tender.applyAllowed)
  const isApplyAllowed = allowApply && (typeof tender.applyAllowed === 'undefined' ? true : tender.applyAllowed);

  // compute cooldown remaining if any
  let cooldownText = null;
  if (!isApplyAllowed && tender.userCooledUntil) {
    const until = new Date(tender.userCooledUntil);
    const diffMs = until - Date.now();
    if (diffMs > 0) {
      const hours = Math.ceil(diffMs / (1000 * 60 * 60));
      cooldownText = `You can re-apply in ~${hours} hour(s)`;
    }
  }

  // Handle view details click with tracking
  const handleViewDetails = () => {
    trackViewDetailsClick(tender._id, session);
  };

  return (
    <article className={`p-6 rounded-lg ${royalClasses}`}>
      <div className="flex items-start justify-between">
        <h3 className={`${variant === 'royal' ? 'text-xl font-extrabold' : 'font-semibold'}`}>{tender.title}</h3>
        <div className="flex items-center gap-2">
          {showStatusBadge && typeof statusBadge !== 'undefined' && (
            <span className={`text-xs font-medium px-2 py-1 rounded ${statusBadge === 'granted' ? 'bg-green-100 text-green-800' : statusBadge === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {statusBadge}
            </span>
          )}
        </div>
      </div>
      <p className={`${variant === 'royal' ? 'text-sm text-white/90' : 'text-sm text-gray-600'}`}>{tender.issuingAuthority ?? tender.location} • {tender.category}</p>
      <p className={`mt-2 ${variant === 'royal' ? 'text-lg font-semibold text-white' : ''}`}>Value: ₹{formattedValue}</p>
      <p className={`${variant === 'royal' ? 'text-sm text-white/80' : 'text-sm text-gray-500'}`}>Deadline: <DateFmt value={tender.submissionDeadline} /></p>
      
      {showRecommendation && recommendationExplanation && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
          <strong>Why recommended:</strong> {recommendationExplanation}
        </div>
      )}
      
      <div className="mt-4 flex items-center gap-4">
        {showDetails && (
          <Link 
            href={`/tenders/${tender._id}`}
            onClick={handleViewDetails}
            className={`${variant === 'royal' ? 'bg-white/20 text-white px-3 py-2 rounded' : 'text-blue-600 underline'}`}
          >
            View details
          </Link>
        )}
        {/* Only show bid button when allowed, for non-admin users and non-awarded tenders */}
        {isApplyAllowed && userRole !== 'admin' && tender.status !== 'awarded' && <BidModal tenderId={tender._id} />}
        {!isApplyAllowed && cooldownText && (
          <div className="text-sm text-red-600">{cooldownText}</div>
        )}
        {/* status badge handled above when showStatusBadge=true */}
      </div>
    </article>
  );
}
