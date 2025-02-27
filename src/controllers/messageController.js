const getMessages = async (req, res) => {
  try {
    const { id } = req.params; // This is likely "unread-counts" in the error case
    
    // Special handling for unread counts
    if (id === "unread-counts") {
      // Handle unread counts logic here
      // For example:
      const userId = req.user.id; // Assuming you have user info in the request
      const unreadCounts = await getUnreadMessageCounts(userId);
      return res.status(200).json(unreadCounts);
    }
    
    // Regular message fetching logic
    // Make sure to validate that id is a valid ObjectId before querying
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }
    
    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, receiverId: id },
        { senderId: id, receiverId: req.user.id }
      ]
    }).sort({ createdAt: 1 });
    
    return res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages controller: ", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}; 