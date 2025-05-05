module.exports = (io) => {
    const notificationNamespace = io.of("/api/notification");

    notificationNamespace.on("connection", async (socket) => {
        const user = socket.request.user;
        if (!user) {
            socket.disconnect();
        }
        socket.join(`user:${user._id.toString()}`);

        socket.on("disconnect", () => {
            console.log("User disconnected from /chat");
        });
    });
};
