// import React, { useState } from 'react';
// import SearchBar from '../Main/SearchBar';
// import Nkh from '../assets/nkh.png';
// import Todd from '../assets/todd.jpeg';
// import Jfk from '../assets/jfk.png';

// function NGO() {
//   const ngoList = [
//     { name: 'NKH', description: 'Animal welfare NGO in Lahore.', contact: '03004000093', image: Nkh },
//     { name: "Todd's Welfare Society", description: 'Animal rescue in Pakistan.', contact: '03214674957', image: Todd },
//     { name: 'JFK', description: 'Animal shelter in Lahore.', contact: '03010119620', image: Jfk },
//     { name: 'Save the Paws', description: 'NGO focused on saving street animals.', contact: '03123456789', image: Nkh },
//     { name: 'Furry Friends', description: 'Provides care and shelter to stray animals.', contact: '03012345678', image: Todd },
//     { name: 'Animal Haven', description: 'Rescues and rehabilitates animals.', contact: '03211223344', image: Jfk },
//   ];

//   // State for filtered results
//   const [filteredNgos, setFilteredNgos] = useState([]);
//   const [query, setQuery] = useState("");

//   // Search function (filtering logic)
//   const handleSearch = (searchQuery) => {
//     setQuery(searchQuery); // Update query state
//     if (!searchQuery) {
//       setFilteredNgos([]); // Clear results when the query is empty
//     } else {
//       const filtered = ngoList.filter((ngo) =>
//         ngo.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
//         ngo.description.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//       setFilteredNgos(filtered);
//     }
//   };

//   // Decide which list to display
//   const ngosToDisplay = query ? filteredNgos : ngoList;

//   return (
//     <div className="flex flex-col items-center">

//       <SearchBar
//         onSearch={handleSearch}
//         placeholder="Search NGOs..."
//       />

// <div className="text-center mb-4 mt-4">
//           <h2 className="text-3xl font-bold text-[#6b493d] flex items-center justify-center">
//              NGO's Information
//           </h2>
//         </div>

//       {/* Display heading when there are search results */}
//       {query && filteredNgos.length > 0 && (
//         <h2 className="text-2xl font-semibold mt-6 mb-4 text-[#6b493d]">Search Results for "{query}"</h2>
//       )}

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 w-full px-4 md:px-12">
//         {ngosToDisplay.map((ngo, index) => (
//           <div key={index} className="max-w-sm w-full rounded overflow-hidden shadow-lg bg-white border border-slate-300">
//             <img src={ngo.image} className="w-full h-64 object-cover" alt={ngo.name} />
//             <div className="px-6 py-4">
//               <div className="font-bold text-xl mb-2 text-[#6b493d]">{ngo.name}</div>
//               <p className="text-gray-700 text-base">{ngo.description}</p>
//             </div>
//             <div className="px-6 py-4">
//               <h3 className="text-base font-bold text-[#6b493d]">Contact Us:</h3>
//               <p className="text-gray-700 text-base">{ngo.contact}</p>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default NGO;
import React, { useState } from 'react';
import SearchBar from './SearchBar';
import Nkh from '../assets/nkh.png';
import Todd from '../assets/todd.jpeg';
import Jfk from '../assets/jfk.png';
import ACF from '../assets/ACF.jpeg';
import PAWS from '../assets/PAWS.jpeg';
import GUL from '../assets/GUL.jpeg';
import SAVERS from '../assets/SAVERS.jpeg';
import VCS from '../assets/VCS.jpeg';
import VCO from '../assets/VCO.jpeg';
import SPCA from '../assets/SPCA.jpeg';
import Huraira from '../assets/Huraira.jpeg';
import TWAF from '../assets/TAWF.jpeg';
import UR from '../assets/UR.jpeg';
import LAPS from '../assets/LAPS.jpeg';

function NGO() {
  const [selectedNgo, setSelectedNgo] = useState(null);
  const ngoList = [
    { 
      name: 'ACF Rescue', 
      description: 'Animal Rescue NGO in Karachi.', 
      contact: {
          "phone": "0333 4242458",
          "email": "info@petsandvetsclinic.com"
        },
      image: ACF,
      mission: 'A non-profit organisation rescuing and rehabilitating one of the most neglected in our country; abused and injured homeless, street animals and working animals alongside highlighting and aiding in the plight of other marginalised communities and imperative societal issues that are usually ignored.',
      services: [
        'Animal Rescue & Rehabilitation',
        'Medical Treatment & Vaccination',
        'Awareness & Advocacy',
        'Environmental Initiatives',
        'Sanctuary & Shelter Services'
      ]
    },
    { 
      name: "Pakistan Animal Welfare Society (PAWS)", 
      description: 'Animal rescue in Karachi.', 
      contact: {
        "phone": "-",
          "email": "-"
      }, 
      image: PAWS,
      mission: 'PAWS coordinates help for animals in need by putting people in touch with each other through social media.',
      services: [
        'Animal Adoption Assistance',
        'Advocacy & Awareness',
        'Public Engagement'
      ]
    },
    { 
      name: 'Give Us Life',  
      description: 'Animal Welfare Society in Lahore.', 
      contact: {
        "phone": "0322 4144219",
          "email": "-"
      },  
      image: GUL,
      mission: 'Creating a safe haven for animals in need of care and protection.',
      services: [
        'Treatment for injured/stray animals',
        'Provide food',
        'Provide loving homes',
      ]
    },
    { 
      name: 'Special Animals & Veterinary Emergency Relief Society (SAVERS)', 
      description: 'Society/Club in UVAS Lahore.', 
      contact: {
        "phone": "0300 2973064",
        "email": "uvassavers@gmail.com"
      },  
      image: SAVERS,
      mission: 'To provide relief to animals, to train undergraduates so that they could excel in the field, and to work for the welfare of animals as long as need be.',
      services: [
        'Veterinary Student Development',
        'Public Awareness & Education',
        'Animal Health Services',
        'Advocacy & Networking'
      ]
    },
    { 
      name: 'Vet Crescent Society (VCS) ', 
      description: 'Society/Club in UVAS Lahore.',
      contact: {
        "phone": "-",
        "email": "-"
      },   
      image: VCS,
      mission: 'The Vet Crescent Society (VCS) is a registered society of University of Veterinary and Animal Sciences and is working for the welfare of animals as well as professional grooming of vets.',
      services: [
        'Deworming Camps',
        'Vaccination Camps',
        'Free Treatment Camps',
        'Free Eid Treatment Camps',
        'Seminars & Workshops',
        'Advocacy & Awareness',
        'Professional & Member Support'
      ]
    },
    { 
      name: 'Vets Care Organization, Pakistan (VCO)', 
      description: 'NGO in Burewala, Lahore.', 
      contact: {
        "phone": "-",
        "email": "-"
      }, 
      image: VCO,
      mission: 'An NGO working for the welfare of animals and uplift of veterinary of profession in Pakistan.',
      services: [
        'Veterinary medical care & treatment for animals',
        'Animal welfare advocacy & cruelty prevention',
        'Free annual pet vaccination drives (on World Veterinary Day)'
      ]
    },
    { 
      name: 'Society for Prevention of Cruelty to Animals (SPCA) Pakistan', 
      description: 'Society in UVAS Lahore.', 
      contact: {
        "phone": "(042) 99211477",
        "email": "spcagovtpunjab@yahoo.com"
      }, 
      image: SPCA,
      mission: 'The mission of Society for the Prevention of Cruelty to Animals is described in the following: To encourage the humane treatment of all animals and to prevent cruelty inflicted upon them To advance the safety and wellbeing of animals To take concrete steps so that animals can live a life free of cruelty and suffering To embrace with kindness, respect, compassion, awareness and integrity in all aspects of our mission and vision for a cruelty-free world To stop the abuse and suffering of animals with innovative programs that serve both animals and their human caretakers. To promote the humane treatment of animals through education and outreach programs.',
      services: [
        'Keep animals protected from Thirst and hunger',
        'Keep animals protected from Discomfort',
        'Keep animals protected from Fear and distress'
      ]
    },
    { 
      name: 'Huraira Animal Shelter ', 
      description: 'Animal Shelter in Karachi and Lahore.', 
      contact: {
        "phone": "0333 9090569",
        "email": "ceo@hurairaanimallovers.com"
      }, 
      image: Huraira,
      mission: 'Huraira Animals Lovers® is an organization whose mission is to improve the health and well-being of Homeless injured Animals. Build a community where lives of homeless Animals would matter.',
      services: [
        'Rescue',
        'Huraira’s Shelter',
        'Treatment',
        'Meals',
      ]
    },
    { 
      name: 'Tahira Animal Welfare Foundation (TAWF)', 
      description: 'Animal Welfare in Faislabad.', 
      contact: {
        "phone": "0308 8181122",
        "email": "info@tawf.org.pk"
      }, 
      image: TWAF,
      mission: 'At TAWF, we are dedicated to rescuing injured, abused, and neglected animals, including cats, dogs, equines, birds, and wild animals. Our primary efforts focus on rehabilitating strays through sterilization and vaccination programs. Stray animals face harsh conditions due to overpopulation. TAWF is committed to tackling this issue by diligently working to control the homeless animal population and eradicate rabies in the region.',
      services: [
        'Animal rescue',
        'TNVR (Trap-Neuter-Vaccinate-Return)',
        'Awareness',
      ]
    },
    { 
      name: 'United Rescue', 
      description: 'Giving strays a second chance at life in Islamabad.', 
      contact: {
        "phone": "-",
        "email": "-"
      }, 
      image: UR,
      mission: 'United Rescue Volunteers aims to help those who cannot speak for themselves, one of the most abused citizens of Pakistan, our street animals. Cruelty to animals, especially dogs and donkeys are widespread in the country. We do our most to rescue, rehabilitate and advocate for these abused and neglected beings. But beyond that, our goal is to change the public mindset towards these animals, to encourage compassion and empathy to replace the deeply embedded violence and hatred. We especially encourage children and teens to participate with United Rescue, so the next generation will be more sympathetic and kind. Violence against animals has long been known as a marker of deep psychological disturbance or further develops into violence against humans. To reduce this is not only important to protect strays but for the betterment of society as a whole.',
      services: [
        'Rescue Operations',
        'Rehabilitation',
        'Sterilization Programs',
        'Adoption & Fostering',
        'Shelter Collaboration',
        'Public Advocacy', 
      ]
    },
    { 
      name: 'Lucky Animal Protection Shelter (LAPS)', 
      description: 'The first strays dog sanctuary in Peshawar.', 
      contact: {
        "phone": "0326 026 6354",
        "email": "info@lapskpk.com"
      }, 
      image: LAPS,
      mission: 'To eradicate rabies in Peshawar and KPK province through the mass vaccination of stray and owned dogs, and reducing animal overpopulation through spay/neuter and adoption programs, while providing medical aid, love and temporary shelter to stray, injured and abandoned animals',
      services: [
        'Anti-Cruelty and Animal Rescue',
        'Education and Advocacy', 
      ]
    },
    { 
      name: 'NKH Animal Welfare', 
      description: 'Animal Rescue & Shelter in Lahore.', 
      contact: {
        "phone": "0300 4000093",
        "email": "nkhanimalseelfare@gmail.com"
      }, 
      image: Nkh,
      mission: 'Helping the voiceless',
      services: [
        'Animal rescue',
        'Shelter', 
        'Treatment',
        'Food',
      ]
    },
    { 
      name: 'Todds Welfare Society',
      description: 'Welfare Society in Lahore.', 
      contact: {
        "phone": "+92 321 4674957",
        "email": "info@toddswelfaresociety.pk"
      }, 
      image: Todd,
      mission: 'To protect street, working, and companion animals through community outreach, medicine, and long or forever shelter. To reduce Pakistans free-roaming population by implementing the humane method of spay and neuter projects.To encourage animal adoptions through awareness and to end animal suffering by building a community where animals are respected as beings and treated with kindness through education, advocacy, and rescue services. To instil compassion in the hearts of community members by first-hand interaction and saving lives together as a result.',
      services: [
        'Animal Rescue and Clinic',
        'Education', 
        'TNVR Programs',
      ]
    },
    { 
      name: 'JFK Animal Rescue And Shelte',
      description: 'Rescue & Shelter in Lahore.', 
      contact: {
        "phone": "0301 0119620",
        "email": "info@jfkanimalrescueandshelter.com"
      }, 
      image: Jfk,
      mission: 'Our mission is to fulfill the basic needs of animals and protect them. Giving them the life they are worthy of. We will rescue and save injured, sick, under threat and abused stray animals by moving them to our safe sanctuaries where they will be provided medical treatments, food, care, love and nourishment. Once they are ready for forever homes they will be up for adoption under certain terms and conditions. We are strictly against the idea of buying and selling animals and will promote adopt don’t shop. We will have a dog trainer for their therapies as most of them come from abused past and have behavioral issues. We want to make sure they are ready for adoptions.Disabled, deaf, blind, abused and injured animals can live a safe and comfortable life with us. We want to help the stray animals by our spay/neuter and Tnr programs to save them from the streets. Life on the streets is very difficult but at JFK all animals will be safe. We want to finish dog culling from our country and provide other options by making sanctuaries for the strays and vaccinating them against rabies. We want to give a safe and happy life to all animals and put an end to animal cruelty.',
      services: [
        'Animal Rescue',
        'Shelter', 
        'Animal training',
        'Adoption',
        'TNVR',
        'Education', 
      ]
    },
  ];

  // State for filtered results
  const [filteredNgos, setFilteredNgos] = useState([]);
  const [query, setQuery] = useState("");

  // Search function (filtering logic)
  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
    if (!searchQuery) {
      setFilteredNgos([]);
    } else {
      const filtered = ngoList.filter((ngo) =>
        ngo.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        ngo.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredNgos(filtered);
    }
  };

  // Decide which list to display
  const ngosToDisplay = query ? filteredNgos : ngoList;

  // Expanded NGO Modal
  const ExpandedNgoCard = ({ ngo, onClose }) => (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 overflow-y-auto p-4">
      <div className="bg-white text-amber-950 rounded-xl shadow-lg mx-auto max-w-4xl w-full relative p-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-amber-100 rounded-full text-2xl z-50"
        >
          ×
        </button>
        
        {/* NGO Card Header */}
        <div className="bg-brown-50 p-5 border-b border-brown-200">
          <div className="flex items-center space-x-4">
            <img 
              src={ngo.image} 
              alt={ngo.name} 
              className="w-20 h-20 object-cover rounded-full border-4 border-white shadow-md"
            />
            <div>
              <h2 className="text-2xl font-bold text-[#6b493d]">{ngo.name}</h2>
              <p className="text-sm text-[#a07855]">{ngo.description}</p>
            </div>
          </div>
        </div>

        {/* NGO Details Content */}
        <div className="mt-6 space-y-6 p-5">
          {/* Mission Section */}
          <div>
            <h3 className="text-xl font-semibold text-brown-800 mb-4 border-b pb-2">
              Our Mission
            </h3>
            <p className="text-amber-950 italic">{ngo.mission}</p>
          </div>

          {/* Services Section */}
          <div>
            <h3 className="text-xl font-semibold text-brown-800 mb-4 border-b pb-2">
              Services Offered
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ngo.services.map((service, i) => (
                <div 
                  key={i} 
                  className="bg-brown-50 text-brown-800 px-3 py-2 rounded-md text-sm text-center hover:bg-brown-100 transition"
                >
                  {service}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-xl font-semibold text-brown-800 mb-4 border-b pb-2">
              Contact Information
            </h3>
            <div className="bg-brown-50 p-4 rounded-lg">
            <p className="mb-2">
                <strong className="text-brown-700">Phone:</strong>{' '}
                <a href={`tel:${ngo.contact.phone}`} className="text-amber-900 hover:underline">
                  {ngo.contact.phone}
                </a>
              </p>
              {ngo.contact.email && (
                <p>
                  <strong className="text-brown-700">Email:</strong>{' '}
                  <a href={`mailto:${ngo.contact.email}`} className="text-amber-900 hover:underline">
                    {ngo.contact.email}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl bg-white">
      {/* Page Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-[#6b493d] mb-4">
          Animal Welfare NGO's
        </h1>
        <p className="text-xl text-[#a07855] max-w-2xl mx-auto">
          Discover compassionate organizations dedicated to animal rescue, care, and protection.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8 px-4 sm:px-6 lg:px-8">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search NGOs by name or description..."
        />
      </div>

      {/* Search Results Heading */}
      {query && filteredNgos.length > 0 && (
        <h2 className="text-2xl font-semibold text-center text-[#6b493d] mb-6">
          Search Results for "{query}"
        </h2>
      )}

      {/* No Results Handling */}
      {ngosToDisplay.length === 0 && (
        <div className="text-center py-10 bg-brown-100 rounded-lg">
          <p className="text-xl text-brown-700">
            No NGOs found. Please try a different search.
          </p>
        </div>
      )}

      {/* NGOs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {ngosToDisplay.map((ngo, index) => (
          <div
            key={index}
            className="bg-white text-amber-950 shadow-md rounded-lg overflow-hidden transition-all duration-300 ease-in-out"
          >
            {/* NGO Card Header */}
            <div className="relative">
              <img 
                src={ngo.image} 
                alt={ngo.name} 
                className="w-full h-64 object-cover"
              />
            </div>

            {/* NGO Card Body */}
            <div className="bg-brown-50 p-5 border-b border-brown-200">
              <div>
                <h2 className="text-2xl font-bold text-[#6b493d] mb-2">{ngo.name}</h2>
                <p className="text-sm text-[#a07855] mb-4">{ngo.description}</p>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setSelectedNgo(ngo)}
                  className="px-6 py-2 bg-amber-900 text-white rounded-full hover:bg-amber-950 transition duration-300"
                >
                  View NGO Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Expanded NGO Modal */}
      {selectedNgo && (
        <ExpandedNgoCard 
          ngo={selectedNgo} 
          onClose={() => setSelectedNgo(null)}
        />
      )}
    </div>
  );
}

export default NGO;