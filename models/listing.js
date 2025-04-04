const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const Review = require("./review.js")

const listingSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    image: {
        url: { type: String, required: true },
        filename: { type: String, required: true }
    },
    price: {
        type: Number,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    propertyType:{
        type: String,
        required: true
    },
    reviews: [
        {
          type: Schema.Types.ObjectId,
          ref: "Review"  
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    geometry: {
        type:  {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type:[Number],
            required: true
        }
    }
});

listingSchema.post("findOneAndDelete", async(listing)=>{
    if(listing){
    await Review.deleteMany({reviews : {$in: listing.reviews}})
}})

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;

