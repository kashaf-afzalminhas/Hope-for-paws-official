import PropTypes from 'prop-types';
import VerifiedBadge from './VerifiedBadge';

/**
 * Role label for posts / ads / profiles.
 * - Veterinarian chip for vets
 * - NGO chip for NGO accounts (+ VerifiedBadge when admin-verified)
 */
const UserBadge = ({ userType, isVeterinarian, isNgo, ngoVerified, size = 'md' }) => {
  const isNgoAccount =
    isNgo === true ||
    userType === 'ngo' ||
    userType === 'NGO';

  const isVetAccount =
    isVeterinarian === true ||
    userType === 'vet' ||
    userType === 'Veterinarian' ||
    userType === 'veterinarian';

  if (isNgoAccount) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-emerald-50 text-emerald-800 border-emerald-200">
          NGO
        </span>
        {ngoVerified ? <VerifiedBadge isVerified size={size === 'lg' ? 'md' : 'sm'} /> : null}
      </span>
    );
  }

  if (isVetAccount) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200">
        Veterinarian
      </span>
    );
  }

  return null;
};

UserBadge.propTypes = {
  userType: PropTypes.oneOf([
    'regular',
    'vet',
    'ngo',
    'Veterinarian',
    'veterinarian',
    'Regular User',
    'NGO',
    'user',
    'seller',
  ]),
  isVeterinarian: PropTypes.bool,
  isNgo: PropTypes.bool,
  ngoVerified: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

export default UserBadge;
