import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { getCurrentUserId } from '../../lib/utils';
import AdoptionCard from './AdoptionCard.jsx';
import { formatAdoptionDate, getRequestStatusBadge } from './adoptionTheme';

const AdoptionHistoryCard = ({ item }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [storedUser, setStoredUser] = useState(null);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
      setStoredUser(s);
    } catch {
      setStoredUser(null);
    }
  }, []);

  const effectiveUser = user || storedUser;
  const currentUserId = getCurrentUserId(effectiveUser);
  const posterId = item.posterUserId || null;
  const posterUsername = item.posterUsername || 'Listing owner';
  const avatarUrl =
    item.posterProfileImage && posterId
      ? `${API_BASE_URL.replace('/api', '')}${item.posterProfileImage}`
      : null;

  const requestBadge = getRequestStatusBadge(item.status);
  const post = {
    name: item.petName,
    petType: item.petType,
    imageUrl: item.petImage,
    description: item.message,
    location: item.petLocation,
  };

  const canChat =
    Boolean(effectiveUser && posterId && currentUserId && String(posterId) !== String(currentUserId));

  return (
    <AdoptionCard
      post={post}
      showHealth={false}
      showStatus={false}
      descriptionLines={3}
      poster={
        posterId
          ? {
              profileId: posterId,
              username: posterUsername,
              avatarUrl,
              onChat: canChat
                ? () =>
                    navigate(`/chat/${posterId}`, {
                      state: { fromAdoption: true, postCreatorUsername: posterUsername },
                    })
                : undefined,
            }
          : { show: false }
      }
      meta={
        <div className="mb-4 space-y-3 rounded-xl border border-[#e8dcc8] bg-[#faf6f0] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${requestBadge.className}`}>
              {requestBadge.label}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[#6F4C3E]/70">
              <Calendar className="h-3.5 w-3.5" />
              {formatAdoptionDate(item.requestDate)}
            </span>
          </div>
          {item.responseDate && (
            <p className="text-xs text-[#6F4C3E]/70">Response: {formatAdoptionDate(item.responseDate)}</p>
          )}
        </div>
      }
    />
  );
};

AdoptionHistoryCard.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.string,
    petName: PropTypes.string,
    petType: PropTypes.string,
    petImage: PropTypes.string,
    petLocation: PropTypes.string,
    message: PropTypes.string,
    status: PropTypes.string,
    requestDate: PropTypes.string,
    responseDate: PropTypes.string,
    posterUserId: PropTypes.string,
    posterUsername: PropTypes.string,
    posterProfileImage: PropTypes.string,
  }).isRequired,
};

export default AdoptionHistoryCard;
