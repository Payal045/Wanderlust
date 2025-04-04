const Joi = require("joi");

module.exports.listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        propertyType: Joi.string().required(), 
        image: Joi.object({
            filename: Joi.string().optional(),
            url: Joi.string().uri().optional() // ✅ Make it optional
        }).optional(),  // ✅ Allow the entire image object to be optional
        price: Joi.number().required().min(0),
        country: Joi.string().required(),
        location: Joi.string().required(),
    }).required()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().required()
    }).required()
})