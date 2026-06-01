const ServiceProvider = require("../models/ServiceProvider");
const Booking = require("../models/Booking");
const calculateDistance = require("../utils/haversine");
const cosineSimilarity = require("../utils/cosineSimilarity");

const getRecommendations = async (req, res) => {
    try {
        const {
            category,
            latitude,
            longitude,
            problemDescription,
        } = req.query;

        if (!category || !latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: "Category, latitude and longitude are required",
            });
        }

        const userLat = Number(latitude);
        const userLon = Number(longitude);

        const providers = await ServiceProvider.find({
            isAvailable: true,
            isVerified: true,
            "services.category": {
                $regex: category,
                $options: "i",
            },
        }).populate("user", "name email rating totalReviews isActive");

        const userBookings = await Booking.find({
            user: req.user._id,
        });

        const userPreviousCategories = userBookings.map(
            (booking) => booking.serviceCategory.toLowerCase()
        );

        const recommendations = providers.map((provider) => {
            const matchedService = provider.services.find((service) =>
                service.category.toLowerCase().includes(category.toLowerCase())
            );

            const price = matchedService ? matchedService.price : 1000;

            const distance = calculateDistance(
                userLat,
                userLon,
                provider.location.latitude,
                provider.location.longitude
            );

            const providerText = provider.services
                .map((service) => {
                    return `${service.category} ${service.description || ""}`;
                })
                .join(" ");

            const similarity = problemDescription
                ? cosineSimilarity(problemDescription, providerText)
                : 0;

            const preference = userPreviousCategories.includes(
                category.toLowerCase()
            )
                ? 1
                : 0;

            const ratingScore = provider.rating || 0;
            const priceScore = 1 / price;
            const distanceScore = 1 / (distance + 1);
            const preferenceScore = preference;
            const similarityScore = similarity;

            const w1 = 0.35; // rating
            const w2 = 0.15; // price
            const w3 = 0.20; // distance
            const w4 = 0.15; // preference
            const w5 = 0.15; // cosine similarity

            const finalScore =
                w1 * ratingScore +
                w2 * priceScore +
                w3 * distanceScore +
                w4 * preferenceScore +
                w5 * similarityScore;

            return {
                provider,
                matchedService,
                distance: Number(distance.toFixed(2)),
                similarity: Number(similarity.toFixed(2)),
                preference,
                finalScore: Number(finalScore.toFixed(4)),
            };
        });

        recommendations.sort((a, b) => b.finalScore - a.finalScore);

        res.status(200).json({
            success: true,
            count: recommendations.length,
            recommendations,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get recommendations",
            error: error.message,
        });
    }
};

module.exports = {
    getRecommendations,
};