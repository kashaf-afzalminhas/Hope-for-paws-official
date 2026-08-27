import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '../config';
import AdoptionDetailsModal from '../Components/adoption/AdoptionDetailsModal';

const AdoptionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/adoptions/${id}`);
        setPost(response.data);
      } catch {
        setError('Adoption listing not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f5f3ed]"><div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6b493d] border-t-transparent" /></div>;
  }

  if (error || !post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f3ed] px-4 text-center">
        <div>
          <p className="mb-4 text-red-700">{error || 'Adoption listing not found.'}</p>
          <button type="button" onClick={() => navigate('/adoption')} className="inline-flex items-center gap-2 rounded-lg bg-[#6b493d] px-4 py-2 text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Adoption
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ed] py-6">
      <AdoptionDetailsModal
        post={post}
        onClose={() => navigate('/adoption')}
        imageFailed={false}
        onImageError={() => {}}
        canChat={false}
      />
    </div>
  );
};

export default AdoptionDetail;
