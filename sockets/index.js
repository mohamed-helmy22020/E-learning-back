const registerChatNamespace = require("./chatNamespace");
const registerNotificationNamespace = require("./notificationNamespace");
module.exports = (io) => {
    registerChatNamespace(io);
    registerNotificationNamespace(io);
    console.log("Socket.IO namespaces registered");
};
