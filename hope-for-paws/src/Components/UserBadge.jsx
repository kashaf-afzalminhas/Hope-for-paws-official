import React from 'react';

const UserBadge = ({ userType }) => {
  if (userType === 'regular') return null;

  const badgeStyles = {
    vet: 'bg-blue-100 text-blue-800 border-blue-200',
    ngo: 'bg-green-100 text-green-800 border-green-200',
  };

  const badgeLabels = {
    vet: 'Veterinarian',
    ngo: 'NGO',
  };

  return userType && badgeStyles[userType] ? (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badgeStyles[userType]}`}>
      {badgeLabels[userType]}
    </span>
  ) : null;
};

export default UserBadge; 