import { useState, useRef, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, X, Send, Smile } from "lucide-react";
import imageCompression from 'browser-image-compression';
import GifPicker from "./GifPicker";
import EmojiPicker from "./EmojiPicker";
import toast from "react-hot-toast";
import ConfettiButton from "./ConfettiButton";
import { useAuthStore } from "../store/userAuthStore";

// Custom GIF icon component
const GifIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M3 9h6m-6 0v6m0-6V5a2 2 0 0 1 2-2h2" />
    <path d="M13 5h-2m2 0v8m0-8h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6m0-10v10" />
  </svg>
);

const compressImage = async (file) => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1024,
    useWebWorker: true
  };
  
  try {
    const compressedFile = await imageCompression(file, options);
    return await convertToBase64(compressedFile);
  } catch (error) {
    console.error("Error compressing image:", error);
    throw error;
  }
};

const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef(null);
  const { sendMessage, selectedUser } = useChatStore();
  const { socket } = useAuthStore();
  const typingTimeoutRef = useRef(null);

  // Handle typing indicator
  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handleTyping = (typing) => {
      if (typing !== isTyping) {
        setIsTyping(typing);
        socket.emit("typing", {
          receiverId: selectedUser._id,
          isTyping: typing
        });
      }
    };

    const handleTextChange = () => {
      if (!isTyping) {
        handleTyping(true);
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator after 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        handleTyping(false);
      }, 2000);
    };

    // Add event listener for text changes
    if (text) {
      handleTextChange();
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Make sure typing indicator is turned off when component unmounts
      if (isTyping) {
        socket.emit("typing", {
          receiverId: selectedUser._id,
          isTyping: false
        });
      }
    };
  }, [text, socket, selectedUser, isTyping]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    try {
      const base64 = await compressImage(file);
      setImagePreview(base64);
    } catch (error) {
      toast.error("Failed to process image");
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim() && !imagePreview) return;
    
    try {
      await sendMessage({ text, image: imagePreview });
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleGifSelect = (gifUrl) => {
    setImagePreview(gifUrl);
    setShowGifPicker(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-2 border-t border-base-300">
      {/* Image preview */}
      {imagePreview && (
        <div className="relative w-32 h-32 mb-2">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-full object-cover rounded-md"
          />
          <button
            type="button"
            onClick={() => setImagePreview(null)}
            className="absolute top-1 right-1 bg-base-300 rounded-full p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1 bg-base-200 rounded-full px-4 py-2 flex items-center relative">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none outline-none"
          />

          {/* Emoji picker */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowGifPicker(false);
              }}
              className="btn btn-ghost btn-circle btn-sm"
            >
              <Smile className="w-5 h-5" />
            </button>
            <EmojiPicker
              isOpen={showEmojiPicker}
              onSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />

            {/* GIF picker */}
            <button
              type="button"
              onClick={() => {
                setShowGifPicker(!showGifPicker);
                setShowEmojiPicker(false);
              }}
              className="btn btn-ghost btn-circle btn-sm"
            >
              <GifIcon />
            </button>
            <GifPicker
              onSelect={handleGifSelect}
              onClose={() => setShowGifPicker(false)}
              isOpen={showGifPicker}
            />

            {/* Confetti button */}
            <ConfettiButton />

            {/* Image upload button */}
            <label className="btn btn-ghost btn-circle btn-sm">
              <Image className="w-5 h-5" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                ref={fileInputRef}
              />
            </label>
          </div>
        </div>

        {/* Send button */}
        <button
          type="submit"
          className="btn btn-circle btn-primary"
          disabled={!text.trim() && !imagePreview}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};

export default MessageInput;