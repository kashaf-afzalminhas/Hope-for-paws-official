import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

const AdminDashboardLayout = ({ admin, onSignOut, children }) => {
  return (
    <div className="min-h-screen bg-[#F8F4ED] flex flex-col">
      {/* Top Bar */}
      <header className="bg-[#6b493d] text-white px-8 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <span className="font-bold text-lg">Admin Dashboard</span>
          <span className="bg-[#a07855] text-white px-3 py-1 rounded-full text-sm font-semibold">
            {admin?.username || admin?.email}
          </span>
        </div>
        <button
          onClick={onSignOut}
          className="bg-[#a07855] hover:bg-[#4E3B31] text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Sign Out
        </button>
      </header>
      <div className="flex flex-1 w-full">
        {/* Sidebar */}
        <aside className="w-56 bg-[#f3e7d8] border-r border-[#e0cfc2] py-8 px-4 flex flex-col gap-4">
          <NavLink
            to="/admin-dashboard"
            end
            className={({ isActive }) =>
              `block px-4 py-2 rounded-lg font-semibold transition-colors ${isActive ? 'bg-[#6b493d] text-white' : 'text-[#6b493d] hover:bg-[#e0cfc2]'}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin-dashboard/manage-users"
            className={({ isActive }) =>
              `block px-4 py-2 rounded-lg font-semibold transition-colors ${isActive ? 'bg-[#a07855] text-white' : 'text-[#6b493d] hover:bg-[#e0cfc2]'}`
            }
          >
            Manage Users
          </NavLink>
          <NavLink
            to="/admin-dashboard/seller-requests"
            className={({ isActive }) =>
              `block px-4 py-2 rounded-lg font-semibold transition-colors ${isActive ? 'bg-[#a07855] text-white' : 'text-[#6b493d] hover:bg-[#e0cfc2]'}`
            }
          >
            Seller Requests
          </NavLink>
          <NavLink
            to="/admin-dashboard/adoptions"
            className={({ isActive }) =>
              `block px-4 py-2 rounded-lg font-semibold transition-colors ${isActive ? 'bg-[#8B5A2B] text-white' : 'text-[#6b493d] hover:bg-[#e0cfc2]'}`
            }
          >
            Show Adoptions
          </NavLink>
          <NavLink
            to="/admin-dashboard/adoption-requests"
            className={({ isActive }) =>
              `block px-4 py-2 rounded-lg font-semibold transition-colors ${isActive ? 'bg-[#8B5A2B] text-white' : 'text-[#6b493d] hover:bg-[#e0cfc2]'}`
            }
          >
            Show Adoption Requests
          </NavLink>
          <NavLink
            to="/admin-dashboard/posts"
            className={({ isActive }) =>
              `block px-4 py-2 rounded-lg font-semibold transition-colors ${isActive ? 'bg-[#8B5A2B] text-white' : 'text-[#6b493d] hover:bg-[#e0cfc2]'}`
            }
          >
            Show Posts
          </NavLink>
          <NavLink
            to="/admin-dashboard/comments"
            className={({ isActive }) =>
              `block px-4 py-2 rounded-lg font-semibold transition-colors ${isActive ? 'bg-[#8B5A2B] text-white' : 'text-[#6b493d] hover:bg-[#e0cfc2]'}`
            }
          >
            Show Post Comments
          </NavLink>
        </aside>
        {/* Main Content */}
        <main className="flex-1 w-full p-6">{children}</main>
      </div>
    </div>
  );
};

AdminDashboardLayout.propTypes = {
  admin: PropTypes.shape({
    username: PropTypes.string,
    email: PropTypes.string,
  }),
  onSignOut: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

export default AdminDashboardLayout; 