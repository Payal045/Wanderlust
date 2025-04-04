const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    checkin: { type: Date, required: true },
    checkout: { type: Date, required: true },
    guests: { type: Number, required: true },
    email: { type: String, required: true },
    totalPrice: { type: Number, required: true }
});

module.exports = mongoose.model('Reservation', reservationSchema);
