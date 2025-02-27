import { useState } from 'react';
import confetti from "canvas-confetti";
import { useAuthStore } from "../store/userAuthStore";
import { useChatStore } from "../store/useChatStore";

// Custom party icon
const PartyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5.8 11.3L2 22l10.7-3.79" />
    <path d="M4 3h.01" />
    <path d="M22 8h.01" />
    <path d="M15 2h.01" />
    <path d="M22 20h.01" />
    <path d="M22 2l-2.24 2.24" />
    <path d="M17 22l-2.24-2.24" />
    <path d="M2 17l2.24-2.24" />
    <path d="M7 2L4.76 4.24" />
  </svg>
);

const ConfettiButton = () => {
  const [isActive, setIsActive] = useState(false);
  const { socket } = useAuthStore();
  const { selectedUser } = useChatStore();

  // Function to trigger confetti animation
  const launchConfetti = () => {
    setIsActive(true);
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.9 }
    });
    
    setTimeout(() => setIsActive(false), 1000);
  };

  // Function to handle button click
  const triggerConfetti = () => {
    // Launch confetti locally
    launchConfetti();
    
    // Send confetti event to the other user
    if (socket && selectedUser) {
      socket.emit("triggerConfetti", {
        receiverId: selectedUser._id
      });
    }
  };

  return (
    <button
      type="button"
      onClick={triggerConfetti}
      className={`btn btn-ghost btn-circle btn-sm ${isActive ? 'text-primary' : ''}`}
    >
      <PartyIcon />
    </button>
  );
};

export default ConfettiButton; 