import { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import axios from 'axios';

const GifPicker = ({ onSelect, onClose, isOpen }) => {
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  
  // Using a public Tenor API key for demo purposes
  // In production, you should use environment variables
  const TENOR_API_KEY = 'AIzaSyBgGSmlVD_UvTMJ8D7CRrCKE8_Zcw1KQCw';
  
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchTrendingGifs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=20`
        );
        setGifs(response.data.results);
      } catch (err) {
        console.error('Error fetching trending GIFs:', err);
        setError('Failed to load GIFs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrendingGifs();
  }, [isOpen]);
  
  const searchGifs = async () => {
    if (!search.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(search)}&key=${TENOR_API_KEY}&limit=20`
      );
      setGifs(response.data.results);
    } catch (err) {
      console.error('Error searching GIFs:', err);
      setError('Failed to search GIFs');
    } finally {
      setLoading(false);
    }
  };
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="absolute bottom-16 right-0 w-64 bg-base-100 rounded-lg shadow-xl z-50 border border-base-300"
      ref={containerRef}
    >
      <div className="flex justify-between items-center p-3 border-b border-base-300">
        <h3 className="font-medium">GIFs</h3>
        <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
          <X size={18} />
        </button>
      </div>
      
      <div className="p-3 border-b border-base-300">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search GIFs..."
              className="input input-sm input-bordered w-full"
              onKeyDown={(e) => e.key === 'Enter' && searchGifs()}
            />
            <button 
              className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/70"
              onClick={searchGifs}
            >
              <Search size={16} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-y-auto p-3" style={{ maxHeight: '300px' }}>
        {error && (
          <div className="text-error text-center py-4">{error}</div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-4">
            <span className="loading loading-spinner"></span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((gif) => (
              <div 
                key={gif.id} 
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onSelect(gif.media_formats.gif.url)}
              >
                <img 
                  src={gif.media_formats.tinygif.url} 
                  alt={gif.content_description}
                  className="w-full h-auto rounded-md"
                  loading="lazy"
                />
              </div>
            ))}
            
            {gifs.length === 0 && !loading && !error && (
              <div className="col-span-2 text-center py-4 text-base-content/70">
                No GIFs found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GifPicker; 