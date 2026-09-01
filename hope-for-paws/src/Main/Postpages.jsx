import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PostUploadForm from './PostUploadForm';
import {
  Heart, MessageCircle, Pencil, Trash2, X, PawPrint, Plus
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import UserBadge from '../Components/UserBadge';
import { useRequireAuth } from '../Components/AuthGuard';
import PostViewToggle from '../Components/posts/PostViewToggle';

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
  const [viewMode, setViewMode] = useState('grid'); // "grid" | "slide"
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();

  const handleUserProfileClick = (userIdToVisit) => {
    if (!userIdToVisit) return;
    if (!requireAuth('view user profiles')) return;
    navigate(`/profile/public/${userIdToVisit}`);
  };

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
    if (!requireAuth('like posts')) return;
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
    if (!requireAuth('comment on posts')) return;
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
    if (!requireAuth('edit posts')) return;
    const animalToEdit = animals.find((animal) => animal._id === id);
    setEditAnimal(animalToEdit);
    setEditedName(animalToEdit.name);
    setEditedAge(animalToEdit.age);
    setEditedDescription(animalToEdit.description);
  };

  const handleDelete = async (id) => {
    if (!requireAuth('delete posts')) return;
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

  // Extracted so both grid view and slideshow view can render a card the same way
  const renderAnimalCard = (animal) => (
    <div
      key={animal._id}
      className="group relative bg-white rounded-2xl border border-sand shadow-warm-md hover:shadow-warm-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
    >
      <div className="relative overflow-hidden aspect-[4/3] bg-sand-light flex items-center justify-center">
        {animal.image ? (
          <img
            src={`${API_BASE_URL}${animal.image}`}
            alt={animal.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PawPrint className="h-10 w-10 text-clay" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent pointer-events-none" />

        <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 z-10">
          <button
            type="button"
            onClick={() => handleEdit(animal._id)}
            className="h-9 w-9 flex items-center justify-center rounded-full bg-white/85 backdrop-blur-md shadow-warm-sm text-ink hover:bg-white hover:text-clay hover:scale-105 transition-all"
            aria-label="Edit post"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(animal._id)}
            className="h-9 w-9 flex items-center justify-center rounded-full bg-white/85 backdrop-blur-md shadow-warm-sm text-like hover:bg-like hover:text-white hover:scale-105 transition-all"
            aria-label="Delete post"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-ink font-heading">
              {animal.name}
            </h2>
            {animal.user && <UserBadge userType={animal.user.userType} />}
          </div>

          <p
            className={`text-clay text-sm mt-1 font-body ${animal.user?._id ? 'cursor-pointer hover:underline' : ''}`}
            onClick={() => animal.user?._id && handleUserProfileClick(animal.user._id)}
          >
            Posted by {animal.user?.username || 'Anonymous'}
          </p>

          <div className="flex items-center gap-2 mt-3 text-xs font-body">
            <span className="bg-sand-light text-ink px-2.5 py-1 rounded-full font-medium">
              Age: {animal.age}
            </span>
            <span className="bg-sand-light text-ink px-2.5 py-1 rounded-full font-medium">
              {animal.color}
            </span>
          </div>

          <p className="text-ink text-sm mt-3 leading-relaxed break-words font-body">
            {animal.description}
          </p>
        </div>

        <div className="pt-3 border-t border-sand-light flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => toggleLike(animal._id)}
            className="inline-flex items-center gap-1.5 bg-sand-light hover:bg-sand/60 px-3.5 py-1.5 rounded-full text-xs font-body font-semibold text-ink transition-all active:scale-90"
          >
            <Heart className={`h-4 w-4 transition-transform duration-200 ${likedAnimals[animal._id] ? 'text-like fill-like scale-110' : 'text-like fill-transparent'}`} />
            {likedAnimals[animal._id] ? 'Liked' : 'Like'}
          </button>

          <button
            type="button"
            onClick={() => toggleComments(animal._id)}
            className="inline-flex items-center gap-1.5 bg-sand-light hover:bg-sand/60 px-3.5 py-1.5 rounded-full text-xs font-body font-semibold text-ink transition-all"
          >
            <MessageCircle className="h-4 w-4 text-ink-soft" />
            Comment
          </button>
        </div>

        {commentsVisible[animal._id] && (
          <div className="pt-3 border-t border-sand-light space-y-3">
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {animal.comments && animal.comments.length > 0 ? (
                animal.comments.map((comment, index) => (
                  <div key={index} className="bg-sand-light p-3 rounded-2xl flex items-start gap-2.5 text-xs font-body">
                    <div className="h-7 w-7 rounded-full bg-clay/20 text-clay flex items-center justify-center font-bold flex-shrink-0 text-xs">
                      {(comment.user?.username || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink">{comment.user?.username || 'Anonymous'}</span>
                        {comment.user && <UserBadge userType={comment.user.userType} />}
                      </div>
                      <p className="text-ink-soft mt-0.5 break-words">{comment.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center bg-sand-light/50 rounded-2xl border border-dashed border-sand">
                  <p className="text-xs font-body italic text-ink-soft">
                    No comments yet — be the first
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                className="flex-1 bg-sand-light border border-sand rounded-full px-4 py-2 text-xs font-body text-ink placeholder:text-ink-soft/50 focus:outline-none focus:border-clay focus:ring-1 focus:ring-clay"
                placeholder="Add a comment..."
                value={newComments[animal._id] || ''}
                onChange={(e) => handleCommentChange(animal._id, e.target.value)}
              />
              <button
                type="button"
                className="px-4 py-2 rounded-full bg-clay text-cream hover:bg-clay-deep transition-colors text-xs font-body font-medium shadow-warm-sm flex-shrink-0"
                onClick={() => addComment(animal._id)}
              >
                Post
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-cream py-10 md:py-14 px-3 sm:px-6 lg:px-8 overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,_rgba(160,120,85,0.16),_transparent_70%)]" />
      <div className="relative max-w-7xl mx-auto w-full">

        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-clay font-body">
            <PawPrint className="h-3.5 w-3.5" />
            Meet the Animals
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-ink mt-2 font-heading">
            Hope For Paws
          </h1>
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-sand" />
            <Heart className="h-3.5 w-3.5 text-like fill-current" />
            <span className="h-px w-10 bg-sand" />
          </div>
        </div>

        {/* Grid / Slideshow toggle */}
        {animals.length > 0 && (
          <div className="flex items-center justify-end mb-4">
            <PostViewToggle value={viewMode} onChange={setViewMode} />
          </div>
        )}

        {animals.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-sand max-w-xl mx-auto shadow-warm-md">
            <PawPrint className="h-8 w-8 text-clay mx-auto mb-3" />
            <p className="text-xl text-ink/80 italic font-heading">
              No animals posted yet. Be the first to share one!
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-start">
            {animals.map((animal) => renderAnimalCard(animal))}
          </div>
        ) : (
          <div className="mx-auto flex max-w-xl flex-col gap-5 pb-4">
            {animals.map((animal) => (
              <div key={animal._id}>{renderAnimalCard(animal)}</div>
            ))}
          </div>
        )}

        {editAnimal && (
          <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex justify-center items-center z-50 px-4">
            <div className="bg-white p-6 md:p-7 rounded-2xl shadow-warm-lg w-full max-w-md border border-sand">
              <div className="flex items-center justify-between border-b border-sand pb-3 mb-4">
                <h2 className="text-xl font-bold text-ink font-heading">
                  Edit Animal
                </h2>
                <button
                  onClick={() => setEditAnimal(null)}
                  className="p-1.5 hover:bg-sand-light rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-ink" />
                </button>
              </div>

              <div className="space-y-4 font-body">
                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">Animal Name</label>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Animal Name"
                    className="w-full p-2.5 border border-sand rounded-lg text-ink focus:border-clay focus:ring-2 focus:ring-clay/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">Age</label>
                  <input
                    type="number"
                    value={editedAge}
                    onChange={(e) => setEditedAge(e.target.value)}
                    placeholder="Age"
                    className="w-full p-2.5 border border-sand rounded-lg text-ink focus:border-clay focus:ring-2 focus:ring-clay/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">Description</label>
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    placeholder="Description"
                    rows={4}
                    className="w-full p-2.5 border border-sand rounded-lg text-ink focus:border-clay focus:ring-2 focus:ring-clay/20 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 font-body">
                <button
                  onClick={() => setEditAnimal(null)}
                  className="px-4 py-2 border border-sand text-ink rounded-lg hover:bg-sand-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-clay text-cream rounded-lg hover:bg-clay-deep transition-colors shadow-warm-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center mt-10">
          <button
            onClick={() => { if (requireAuth('create a post')) setIsFormVisible(true); }}
            className="inline-flex items-center gap-2 bg-clay text-cream px-6 py-2.5 rounded-lg hover:bg-clay-deep transition-colors shadow-warm-sm font-medium font-body"
          >
            <Plus className="h-4 w-4" />
            Add New Animal
          </button>
        </div>

        {isFormVisible && (
          <PostUploadForm
            onAddAnimal={(newAnimal) => addNewAnimal(newAnimal)}
            onCloseForm={() => setIsFormVisible(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Postpages;