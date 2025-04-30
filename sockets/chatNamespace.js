const {
    getAllConversations,
    sendMessage,
    getConversationMessages,
    getInstructorsList,
} = require("../controllers/chat");

module.exports = (io) => {
    const chatNamespace = io.of("/api/chat");

    chatNamespace.on("connection", async (socket) => {
        const user = socket.request.user;

        socket.join(`user:${user._id.toString()}`);

        socket.on("instructorsList", async () => {
            try {
                const instructorsList = await getInstructorsList(socket);

                chatNamespace
                    .to(`user:${user._id.toString()}`)
                    .emit("instructorsList", instructorsList);
            } catch (error) {
                chatNamespace
                    .to(`user:${user._id.toString()}`)
                    .emit("errors", error.message);
            }
        });

        socket.on("sendMessage", async (to, text) => {
            try {
                await sendMessage(socket, io, to, text);
            } catch (error) {
                chatNamespace
                    .to(`user:${user._id.toString()}`)
                    .emit("errors", error.message);
            }
        });

        socket.on("getConversations", async () => {
            const conversations = await getAllConversations(socket);
            console.log(conversations);
            chatNamespace
                .to(`user:${user._id.toString()}`)
                .emit("getConversations", conversations);
        });

        socket.on("getConversationMessages", async (conversationId) => {
            try {
                const conversationMessages = await getConversationMessages(
                    socket,
                    conversationId
                );

                chatNamespace
                    .to(`user:${user._id.toString()}`)
                    .emit("getConversationMessages", conversationMessages);
            } catch (error) {
                chatNamespace
                    .to(`user:${user._id.toString()}`)
                    .emit("errors", error.message);
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected from /chat");
        });
    });
};
