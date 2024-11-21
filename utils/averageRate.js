const calculateAverageRate = (ratings) => {
    let totalRatings = 0;
    let totalCount = 0;

    ratings.forEach((count, index) => {
        const ratingValue = index + 1;

        totalRatings += ratingValue * count;
        totalCount += count;
    });

    return totalCount === 0 ? 0 : (totalRatings / totalCount).toFixed(1);
};
module.exports = calculateAverageRate;
