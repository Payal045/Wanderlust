const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    const { listing, checkin, checkout, total } = req.query;
    res.send(`Booking page placeholder - Listing: ${listing}, Check-in: ${checkin}, Check-out: ${checkout}, Total: $${total}`);
});

module.exports = router;
