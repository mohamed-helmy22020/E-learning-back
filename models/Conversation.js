const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);
conversationSchema.methods.getData = function () {
    return {
        id: this._id,
        participants: this.participants,
        lastMessage: this.lastMessage,
    };
};
module.exports = mongoose.model("Conversation", conversationSchema);
