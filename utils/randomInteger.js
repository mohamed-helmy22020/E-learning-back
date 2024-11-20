const randomBetween = (first, end) => {
    return Math.floor(Math.random() * (end - first + 1) + first);
};

module.exports = {
    randomBetween,
};
