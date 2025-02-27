// Get unread message counts
export const getUnreadCounts = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Aggregate to count unread messages grouped by sender
        const unreadCounts = await Message.aggregate([
            {
                $match: {
                    receiverId: userId,
                    seen: false
                }
            },
            {
                $group: {
                    _id: "$senderId",
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // Convert to object format for easier client-side use
        const countsObject = {};
        unreadCounts.forEach(item => {
            countsObject[item._id.toString()] = item.count;
        });
        
        res.status(200).json(countsObject);
    } catch (error) {
        console.error("Error in getUnreadCounts controller: ", error);
        res.status(500).json({ message: "Error fetching unread counts" });
    }
}; 