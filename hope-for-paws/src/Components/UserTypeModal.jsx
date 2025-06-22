import PropTypes from 'prop-types';

const UserTypeModal = ({ open, onClose, onSelect, username }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4 text-center">Welcome, {username || 'User'}!</h2>
        <p className="mb-6 text-center">How would you like to register?</p>
        <div className="flex flex-col gap-4">
          <button
            className="w-full py-2 px-4 rounded bg-[#6b493d] text-white font-semibold hover:bg-[#4E3B31] transition"
            onClick={() => onSelect(false)}
          >
            Regular User
          </button>
          <button
            className="w-full py-2 px-4 rounded bg-[#a07855] text-white font-semibold hover:bg-[#6b493d] transition"
            onClick={() => onSelect(true)}
          >
            Veterinarian
          </button>
        </div>
      </div>
    </div>
  );
};

UserTypeModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  username: PropTypes.string,
};

export default UserTypeModal; 