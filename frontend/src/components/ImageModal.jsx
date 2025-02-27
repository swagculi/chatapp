import { X } from "lucide-react";
import { useEffect } from "react";

const ImageModal = ({ imageUrl, onClose }) => {
  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    
    // Prevent scrolling of the body when modal is open
    document.body.style.overflow = "hidden";
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl max-h-[90vh] w-full">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
        >
          <X size={24} />
        </button>
        
        <img
          src={imageUrl}
          alt="Full size"
          className="max-h-[90vh] max-w-full object-contain mx-auto"
        />
      </div>
    </div>
  );
};

export default ImageModal; 