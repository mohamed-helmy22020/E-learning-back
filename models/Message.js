const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: [true, "Please provide conversation id"],
        },
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Please provide sender user"],
        },
        to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Please provide receiver user"],
        },
        text: {
            type: String,
            required: [true, "Please provide message"],
        },
        seen: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

messageSchema.methods.getData = function () {
    return {
        id: this._id,
        conversationId: this.conversationId,
        from: this.from,
        to: this.to,
        text: this.text,
        seen: this.seen,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};
module.exports = mongoose.model("Message", messageSchema);
