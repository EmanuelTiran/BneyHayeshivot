const mongoose = require('mongoose');

const CarSchema = new mongoose.Schema({
    make: {
        type: String,
        required: true,
    },
    model: {
        type: String,
        required: true,
    },
    year: {
        type: Number,
        required: true
    },
    licensePlate: {
        type: String,
        required: true,
        unique: true,
    },
    vin: {
        type: String,
        unique: true,
    },
    color: {
        type: String,
        default: 'white',
    },
    type: {
        type: String,
        required: true,
        enum: ['Sedan', 'SUV', 'Truck', 'Van', 'Luxury', 'Economy']
    },
    capacity: {
        passengers: {
            type: Number,
        },
        luggage: Number
    },
    transmission: {
        type: String,
        required: true,
        enum: ['Automatic', 'Manual'],
        default: 'Manual'
    },
    dailyRate: {
        type: Number,
        required: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    },

},);

const Car = mongoose.model('Car', CarSchema);

module.exports = Car;