const registerChatNamespace = require("./chatNamespace");
module.exports = (io) => {
    registerChatNamespace(io);

    console.log("Socket.IO namespaces registered");
};
