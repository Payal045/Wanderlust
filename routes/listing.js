const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js")
const {validateListing,isLoggedIn ,isOwner} = require("../middleware.js")
const listingController = require("../controllers/listing.js")
const multer = require("multer")
const {storage}= require("../cloudConfig.js")
const upload = multer({storage})
const fetch = require("node-fetch");
// const upload = multer({dest :'uploads/'})


router.route("/" )
    .get(wrapAsync(listingController.index)) //Index Route
    .get(wrapAsync(listingController.filter))
    .post(isLoggedIn  ,upload.single("image"),validateListing,wrapAsync(listingController.createListing))//Create Route
    // .post(upload.single('listing[image]'),(req,res) =>{
    //     res.send(req.file);
    // })
//New Route
router.get("/new" ,isLoggedIn,listingController.renderNewForm)
     
router.route("/:id")
      .get(wrapAsync(listingController.showListing)) //Show Route
      .put(isLoggedIn ,isOwner,upload.single("image"),validateListing,wrapAsync(listingController.updateListing)) //Update Route
      .delete(isLoggedIn,isOwner ,wrapAsync(listingController.destroyListing)) //Delete Route

      
//Edit Route
router.get("/:id/edit",isLoggedIn,isOwner, wrapAsync(listingController.renderEditForm))

//Reservation Route
router.post("/:id/reserve", wrapAsync(listingController.reserveListing) )

//Confirmation Route
router.post("/:id/confirm", wrapAsync(listingController.confirmListing) )

module.exports = router;
