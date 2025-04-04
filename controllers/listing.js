const Listing = require("../models/listing.js");
const sendEmail = require('../mailer.js');
const Reservation = require('../models/reservation.js'); 

module.exports.index = async(req,res) =>{
    const allListings = await Listing.find({})
    res.render("./listings/index.ejs" ,{allListings})
}

module.exports.filter = async (req, res) => {
    try {
        let query = {}; // Empty query object to apply filters

        // Extract filter parameters from the request
        let { city, minPrice, maxPrice, propertyType, sortBy } = req.query;

        // Apply filters
        if (city) {
            query.location = { $regex: city, $options: "i" }; // Case-insensitive search for partial matches
        }
        if (minPrice) {
            query.price = { $gte: parseInt(minPrice) };
        }
        if (maxPrice) {
            query.price = query.price ? { ...query.price, $lte: parseInt(maxPrice) } : { $lte: parseInt(maxPrice) };
        }
        // if (propertyType) {
        //     query.propertyType = propertyType; // Exact match for property type
        // }

        // Fetch filtered listings
        let listings = await Listing.find(query);

        // Sorting Logic
        if (sortBy === "priceAsc") {
            listings.sort((a, b) => a.price - b.price);
        } else if (sortBy === "priceDesc") {
            listings.sort((a, b) => b.price - a.price);
        }

        // Render the template with filter values
        res.render("listings/index", {
            allListings: listings,
            city,
            minPrice,
            maxPrice,
            propertyType,
            sortBy
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports.renderNewForm = (req,res) =>{
    res.render("listings/new.ejs")
}

// Function to fetch coordinates using Nominatim API
async function getCoordinates(location) {
    if (!location || location.trim() === "") {
        console.warn("⚠️ Empty location received!");
        return { lat: null, lng: null };
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location.trim())}`
        );
        const data = await response.json();

        console.log(`📌 API Response for "${location}":`, data);

        if (data.length > 0 && data[0].lat && data[0].lon) {
            console.log(`✅ Coordinates found: ${data[0].lat}, ${data[0].lon}`);
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        } else {
            console.warn(`⚠️ No coordinates found for: "${location}"`);
            return { lat: null, lng: null };
        }
    } catch (error) {
        console.error(`❌ Error fetching coordinates for ${location}:`, error);
        return { lat: null, lng: null };
    }
}

module.exports.showListing = async (req, res) => {
    try {
        let { id } = req.params;

        // Fetch listing and populate related fields
        const listing = await Listing.findById(id)
            .populate("owner")
            .populate({
                path: "reviews",
                populate: { path: "author" }
            });

        if (!listing) {
            req.flash("error", "Listing you requested for doesn't exist!!");
            return res.redirect("/listings");
        }
        // console.log(`📌 Fetching Listing: ${listing.name}`);
        // console.log(`📍 Location: ${listing.location}`);
        // console.log(`🗺️ Coordinates: ${listing.geometry?.coordinates}`);

        // Extract coordinates safely
        const coords = listing.geometry?.coordinates || [null, null];
        
        res.render("./listings/show.ejs", {
            listing: { 
                ...listing.toObject(), 
                lat: coords[1], // Latitude
                lng: coords[0]  // Longitude
            }
        });

    } catch (error) {
        console.error("🚨 Error fetching listing:", error);
        req.flash("error", "Something went wrong!");
        res.redirect("/listings");
    }
};

module.exports.createListing = async (req, res, next) => {
    try {
        if (!req.file) {
            req.flash("error", "Image upload failed. Please try again.");
            return res.redirect("/listings/new");
        }

        let url = req.file.path;
        let filename = req.file.filename;
        
        //console.log("📌 Final Data before saving:", req.body.listing, url, filename);

        // ✅ Fetch coordinates
        const coords = await getCoordinates(req.body.listing.location);

        if (!coords.lat || !coords.lng) {
            req.flash("error", "Invalid location. Could not fetch coordinates.");
            return res.redirect("/listings/new");
        }

        // ✅ Create new listing with geometry field
        const newListing = new Listing({
            ...req.body.listing,
            image: { url, filename },
            owner: req.user._id,
            geometry: {
                type: "Point",
                coordinates: [coords.lng, coords.lat] // GeoJSON format
            }
        });
        //console.log("✅ Final Listing Object before save:", newListing);

        await newListing.save();

        req.flash("success", "New Listing is created!!");
        res.redirect("/listings");
    } catch (err) {
        console.error("🚨 Error saving listing:", err);
        next(err);
    }
};


module.exports.renderEditForm = async(req,res) =>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error" , "Listing you requested for doesn't exist!!")
        res.redirect("/listings")
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload","/upload/h_300,w_250")
    //console.log(listing);
    res.render("./listings/edit.ejs",{listing ,originalImageUrl})
}

module.exports.updateListing = async(req,res) =>{
    let {id} = req.params
    let listing = await Listing.findByIdAndUpdate(id,{...req.body.listing});
    if(typeof req.file !== "undefined"){
        let url = req.file.path
        let filename = req.file.filename
        listing.image = {url ,filename}
        await listing.save();
    }
    //console.log(req.body.listing)
    req.flash("success" , "Listing Updated!!")
    res.redirect(`/listings/${id}`)
}

module.exports.destroyListing = async(req,res) =>{
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    //console.log(deletedListing)
    req.flash("success" , "Listing Deleted!!")
    res.redirect("/listings");
}

module.exports.reserveListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            return res.status(404).send("Listing not found");
        }
        res.render('./listings/reservation.ejs', { listing }); // Pass listing data to reservation.ejs
    } catch (error) {
        console.error(error);
        res.status(500).send("Error loading reservation page.");
    }
}

module.exports.confirmListing = async (req, res) => {
    try {
        const { checkin, checkout, guests, email } = req.body;
        const listing = await Listing.findById(req.params.id);

        const checkinDate = new Date(checkin);
        const checkoutDate = new Date(checkout);
        const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
        const basePrice = listing.price * nights;
        const gst = basePrice * 0.18;
        const totalPrice = basePrice + gst;

        const reservation = new Reservation({
            listing: listing._id,
            checkin: checkinDate,
            checkout: checkoutDate,
            guests,
            email,
            totalPrice
        });

        await reservation.save();

        // 📩 Send confirmation email
        const message = `Hello, 

Your reservation for ${listing.title} is confirmed.
Check-in: ${checkin}
Check-out: ${checkout}
Number of guests: ${guests}
Total Price (incl. GST): $${totalPrice.toFixed(2)}

Enjoy your stay!
- Wanderlust Team`;

        await sendEmail(email, 'Reservation Confirmed - Wanderlust', message);
        res.render("./listings/confirmation.ejs",{ listing, reservation });
    } catch (error) {
        console.error("❌ Error sending email:", error);
        res.status(500).send("Error processing reservation.");
    }
};