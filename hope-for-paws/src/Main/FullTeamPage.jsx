import { Navigate, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { PersonCard } from "../Components/TeamSuppport";
export const FullTeamPage = () => {
    const location = useLocation();
    const allMembers = location.state?.allMembers || [];
  
    return (
      <section className="py-14 px-4 bg-[#f5f3ed]">
        <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-[#6b493d] mb-2">
          Our Ambassador & Collaborators
        </h2>
        <p className="text-center text-[#a07855] mb-10 max-w-2xl mx-auto">
          Working together to improve animal healthcare and welfare across communities
        </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {allMembers.map((member, index) => (
              <PersonCard
                key={index}
                {...member}
                className="md:col-span-1 bg-white border border-[#c9a280] hover:border-[#6b493d] transition-colors duration-300"
              />
            ))}
          </div>
        </div>
      </section>
    );
  };

  export default FullTeamPage;