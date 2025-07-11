import React, { useState, useEffect } from 'react';
import PostUploadForm from './PostUploadForm';
import { FaHeart, FaComment, FaEdit, FaTrash } from 'react-icons/fa';
import { API_BASE_URL } from '../config';
import UserBadge from '../Components/UserBadge';

const Postpages = () => {
  const [animals, setAnimals] = useState([]);
  const [likedAnimals, setLikedAnimals] = useState({});
  const [commentsVisible, setCommentsVisible] = useState({});
  const [newComments, setNewComments] = useState({});
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editAnimal, setEditAnimal] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editedAge, setEditedAge] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/animal`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setAnimals(data);
      } catch (error) {
        console.error('Error fetching animals:', error);
      }
    };

    fetchAnimals();
  }, []);

  const toggleLike = (id) => {
    setLikedAnimals((prevLikes) => ({
      ...prevLikes,
      [id]: !prevLikes[id],
    }));
  };

  const toggleComments = (id) => {
    setCommentsVisible((prevVisibility) => ({
      ...prevVisibility,
      [id]: !prevVisibility[id],
    }));
  };

  const addNewAnimal = (newAnimal) => {
    setAnimals((prevAnimals) => [...prevAnimals, newAnimal]);
  };

  const handleCommentChange = (id, comment) => {
    setNewComments((prevComments) => ({
      ...prevComments,
      [id]: comment,
    }));
  };

  const addComment = (id) => {
    const commentText = newComments[id];
    if (commentText) {
      setAnimals((prevAnimals) =>
        prevAnimals.map((animal) =>
          animal._id === id
            ? { ...animal, comments: [...(animal.comments || []), commentText] }
            : animal
        )
      );
      setNewComments((prevComments) => ({
        ...prevComments,
        [id]: '',
      }));
    }
  };

  const handleEdit = (id) => {
    const animalToEdit = animals.find((animal) => animal._id === id);
    setEditAnimal(animalToEdit);
    setEditedName(animalToEdit.name);
    setEditedAge(animalToEdit.age);
    setEditedDescription(animalToEdit.description);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this post?');
    if (confirmDelete) {
      setAnimals(animals.filter((animal) => animal._id !== id));
    }
  };

  const handleSaveEdit = () => {
    const updatedAnimal = {
      ...editAnimal,
      name: editedName,
      age: editedAge,
      description: editedDescription,
    };
    setAnimals((prevAnimals) =>
      prevAnimals.map((animal) =>
        animal._id === updatedAnimal._id ? updatedAnimal : animal
      )
    );
    setEditAnimal(null);
  };

  return (
    <div className="bg-[#F8F4ED] min-h-screen p-8">
      <h1 className="text-center text-[#6b493d] text-4xl font-bold mb-8">Hope For Paws</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {animals.map((animal) => (
          <div
            key={animal._id}
            className="relative border border-brown-700 rounded-lg p-4 m-4 shadow-md bg-beige-100 w-64 h-auto min-h-[320px]"
          >
            {animal.image && (
              <img
                src={`${API_BASE_URL}${animal.image}`}
                alt={animal.name}
                className="mt-2 w-full h-40 object-cover rounded-lg shadow-sm"
              />
            )}
            <div className="absolute top-2 right-2 flex space-x-2">
              <button
                onClick={() => handleEdit(animal._id)}
                className="text-brown-600 hover:text-brown-800"
              >
                <FaEdit />
              </button>
              <button
                onClick={() => handleDelete(animal._id)}
                className="text-red-600 hover:text-red-800"
              >
                <FaTrash />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <h2 className="text-md font-bold text-brown-800">{animal.name}</h2>
              {animal.user && <UserBadge userType={animal.user.userType} />}
            </div>
            <p className="text-brown-600 text-sm">Posted by: {animal.user?.username || 'Anonymous'}</p>
            <p className="text-brown-600 text-sm">Age: {animal.age}</p>
            <p className="text-brown-600 text-sm">Color: {animal.color}</p>
            <p className="text-brown-600 text-sm">{animal.description}</p>

            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => toggleLike(animal._id)}
                className="flex items-center text-[#6b493d] hover:text-red-500"
              >
                <FaHeart className={`mr-1 ${likedAnimals[animal._id] ? 'text-red-500' : 'text-gray-400'}`} />
                {likedAnimals[animal._id] ? 'Liked' : 'Like'}
              </button>

              <button
                onClick={() => toggleComments(animal._id)}
                className="flex items-center text-[#6b493d] hover:text-[#a07855]"
              >
                <FaComment className="mr-1" />
                Comment
              </button>
            </div>

            {commentsVisible[animal._id] && (
              <div className="bg-[#F8F4ED] rounded-md p-2 mt-2">
                {animal.comments && animal.comments.map((comment, index) => (
                  <div key={index} className="mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#6b493d]">{comment.user?.username || 'Anonymous'}</span>
                      {comment.user && <UserBadge userType={comment.user.userType} />}
                    </div>
                    <p className="text-[#a07855] text-sm">{comment.text}</p>
                  </div>
                ))}
                <input
                  type="text"
                  className="w-full bg-gray-200 border border-gray-300 rounded py-1 px-2 mt-1 mb-1 text-[#6b493d]"
                  placeholder="Add a comment..."
                  value={newComments[animal._id] || ''}
                  onChange={(e) => handleCommentChange(animal._id, e.target.value)}
                />
                <button
                  className="bg-[#6b493d] text-white px-2 py-1 rounded hover:bg-[#a07855] transition"
                  onClick={() => addComment(animal._id)}
                >
                  Post Comment
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {editAnimal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Edit Animal</h2>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder="Animal Name"
              className="w-full mb-4 p-2 border rounded"
            />
            <input
              type="number"
              value={editedAge}
              onChange={(e) => setEditedAge(e.target.value)}
              placeholder="Age"
              className="w-full mb-4 p-2 border rounded"
            />
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              placeholder="Description"
              className="w-full mb-4 p-2 border rounded"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditAnimal(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-[#6b493d] text-white rounded hover:bg-[#a07855]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsFormVisible(true)}
        className="mt-8 block mx-auto bg-[#6b493d] text-white px-6 py-2 rounded hover:bg-[#a07855] transition"
      >
        Add New Animal
      </button>

      {isFormVisible && (
        <PostUploadForm
          onAddAnimal={(newAnimal) => addNewAnimal(newAnimal)}
          onCloseForm={() => setIsFormVisible(false)}
        />
      )}
    </div>
  );
};

export default Postpages;
