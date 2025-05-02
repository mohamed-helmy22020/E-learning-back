const { BadRequestError, UnauthenticatedError } = require("../errors");
const Conversation = require("../models/Conversation");
const Course = require("../models/Course");
const Message = require("../models/Message");
const User = require("../models/User");

const getInstructorsList = async (socket) => {
    const user = socket.request.user;
    const enrolledCoursesInstructors = (
        await Course.find(
            {
                _id: { $in: user.enrolledCourses },
            },
            { instructorId: 1, _id: 0 }
        ).populate("instructorId", "name userProfileImage email")
    )
        .map((c) => c.instructorId)
        .reduce(
            (acc, instructor) => {
                if (!acc.map.has(instructor._id)) {
                    acc.map.set(instructor._id, instructor);
                    acc.result.push(instructor);
                }
                return acc;
            },
            { map: new Map(), result: [] }
        ).result;

    socket.request.instructors = enrolledCoursesInstructors;
    return { success: true, instructors: enrolledCoursesInstructors };
};

const getPrivateConversation = async (userIdA, userIdB) => {
    const [id1, id2] = [userIdA.toString(), userIdB.toString()].sort();

    let conversation = await Conversation.findOne({
        participants: {
            $size: 2,
            $all: [id1, id2],
        },
    }).populate("lastMessage", "from to text seen");

    if (!conversation) {
        conversation = (
            await Conversation.create({
                participants: [id1, id2],
            })
        ).populate("lastMessage", "from to text seen");
    }

    return conversation;
};

const getAllConversations = async (socket) => {
    const user = socket.request.user;

    const conversations = (
        await Conversation.find({
            participants: user._id,
        })
            .populate("participants", "name userProfileImage")
            .populate("lastMessage", "from to text seen createdAt updatedAt")
    )
        .map((c) => c.getData())
        .map((c) => {
            return { ...c, lastMessage: c.lastMessage?.getData() };
        });
    return conversations;
};

const sendMessage = async (socket, io, to, text) => {
    const user = socket.request.user;
    const chatNamespace = io.of("/api/chat");
    const otherSide = await User.findById(to);
    if (!otherSide) {
        throw new BadRequestError("No user with this id");
    }
    const conversation = await getPrivateConversation(user._id, to);
    const messageData = {
        conversationId: conversation._id,
        from: user._id,
        to,
        text,
    };
    const message = await Message.create(messageData);

    conversation.lastMessage = message._id;
    await conversation.save();
    chatNamespace
        .to(`user:${to}`)
        .to(`user:${user._id.toString()}`)
        .emit("receiveMessage", {
            success: true,
            message: message.getData(),
            conversation: {
                ...conversation.getData(),
                lastMessage: message.getData(),
            },
        });
};

const getConversationMessages = async (socket, userId) => {
    const user = socket.request.user;
    const otherSide = await User.findById(userId);
    if (!otherSide) {
        throw new BadRequestError("No user with this id");
    }
    const conversation = await getPrivateConversation(user._id, userId);

    if (!conversation.participants.includes(user._id)) {
        throw new UnauthenticatedError(
            "You can only get your conversations messages"
        );
    }
    if (
        conversation.lastMessage &&
        !conversation.lastMessage?.seen &&
        conversation.lastMessage?.from.toString() !== user._id.toString()
    ) {
        conversation.lastMessage.seen = true;
        await conversation.lastMessage.save();
    }
    const conversationMessages = (
        await Message.find({
            conversationId: conversation._id,
        })
    ).map((c) => c.getData());
    return conversationMessages;
};

module.exports = {
    getInstructorsList,
    getAllConversations,
    sendMessage,
    getConversationMessages,
};
