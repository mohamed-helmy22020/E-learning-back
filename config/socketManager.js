let io;

module.exports = {
    init: (socketIoInstance) => {
        io = socketIoInstance;
    },
    getIO: () => {
        if (!io) throw new Error("Socket.IO not initialized");
        return io;
    },
};
