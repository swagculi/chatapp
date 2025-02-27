import { useEffect, useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/userAuthStore";
import { formatMessageTime } from "../lib/utils";
import ImageModal from "./ImageModal";
import confetti from "canvas-confetti";

const ChatContainer = () => {
  const { messages, getMessages, isMessagesLoading, selectedUser, subscribeToMessages, unsubscribeFromMessages, markMessagesAsSeen } = useChatStore();
  const { authUser, socket } = useAuthStore();

  const messagesEndRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [confettiSender, setConfettiSender] = useState(null);

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
      markMessagesAsSeen(selectedUser._id);
    }
  }, [selectedUser, getMessages, markMessagesAsSeen]);

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for confetti events
  useEffect(() => {
    if (!socket) return;

    const handleConfettiTriggered = ({ senderId }) => {
      // Trigger confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.9 }
      });
      
      // Show who sent the confetti
      setConfettiSender(senderId);
      
      // Clear the sender after animation
      setTimeout(() => {
        setConfettiSender(null);
      }, 3000);
    };

    socket.on("confettiTriggered", handleConfettiTriggered);

    return () => {
      socket.off("confettiTriggered", handleConfettiTriggered);
    };
  }, [socket]);

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome to the Chat App</h1>
          <p className="text-base-content/70">Select a user to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isMessagesLoading ? (
          [...Array(3)].map((_, i) => <MessageSkeleton key={i} />)
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={message._id}
                className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
                ref={index === messages.length - 1 ? messagesEndRef : null}
              >
                <div className="chat-image avatar">
                  <div className="w-10 rounded-full">
                    <img 
                      src={message.senderId === authUser._id ? authUser.profilePic || "/avatar.png" : 
                        selectedUser.profilePic || "/avatar.png"} 
                      alt="avatar" 
                    />
                  </div>
                </div>
                <div className="chat-bubble flex flex-col">
                  {message.text && <span>{message.text}</span>}
                  {message.image && (
                    <img 
                      src={message.image} 
                      alt="message" 
                      className="mt-2 rounded-md cursor-pointer max-h-60 object-contain"
                      onClick={() => setSelectedImage(message.image)}
                    />
                  )}
                </div>
                <div className="chat-footer opacity-50 text-xs flex gap-1 items-center mt-1">
                  {formatMessageTime(message.createdAt)}
                  {message.senderId === authUser._id && (
                    <span>{message.seen ? "Seen" : "Delivered"}</span>
                  )}
                </div>
              </div>
            ))}
            
            {/* Confetti sender notification */}
            {confettiSender && (
              <div className="text-center animate-bounce">
                <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                  {confettiSender === authUser._id ? "You" : selectedUser.fullName} sent confetti! 🎉
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <MessageInput />

      {selectedImage && (
        <ImageModal 
          imageUrl={selectedImage} 
          onClose={() => setSelectedImage(null)} 
        />
      )}
    </div>
  );
};

export default ChatContainer;
