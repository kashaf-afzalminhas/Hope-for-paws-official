import PropTypes from 'prop-types';

const UserBadge = ({ userType, isVeterinarian }) => {
  // Map the userType to the expected format
  const mapUserType = (type, isVet) => {
    // If isVeterinarian is explicitly provided, use that
    if (isVet === true) return 'vet';
    if (isVet === false) return 'regular';
    
    // Otherwise, map the userType string
    if (type === 'Veterinarian' || type === 'vet') return 'vet';
    if (type === 'Regular User' || type === 'regular') return 'regular';
    return type;
  };

  const mappedUserType = mapUserType(userType, isVeterinarian);
  if (mappedUserType === 'regular') return null;

  const badgeStyles = {
    vet: 'bg-blue-100 text-blue-800 border-blue-200',
    ngo: 'bg-green-100 text-green-800 border-green-200',
  };

  const badgeLabels = {
    vet: 'Veterinarian',
    ngo: 'NGO',
  };

  return mappedUserType && badgeStyles[mappedUserType] ? (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badgeStyles[mappedUserType]}`}>
      {badgeLabels[mappedUserType]}
    </span>
  ) : null;
};

UserBadge.propTypes = {
  userType: PropTypes.oneOf(['regular', 'vet', 'ngo', 'Veterinarian', 'Regular User']),
  isVeterinarian: PropTypes.bool,
};

export default UserBadge; 