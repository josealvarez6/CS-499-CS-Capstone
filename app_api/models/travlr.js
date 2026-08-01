const mongoose = require('mongoose');

// Define the trip schema
const tripSchema = new mongoose.Schema({

    // Unique trip code used throughout the application
    code: {
        type: String,
        required: [true, 'Trip code is required.'],
        unique: true,
        trim: true,
        index: true
    },

    // Name displayed to users
    name: {
        type: String,
        required: [true, 'Trip name is required.'],
        trim: true,
        index: true
    },

    // Trip duration stored as a numeric value (days)
    length: {
        type: Number,
        required: [true, 'Trip length is required.'],
        min: [1, 'Trip length must be at least one day.']
    },

    // Departure date
    start: {
        type: Date,
        required: [true, 'Start date is required.'],
        index: true
    },

    // Resort or destination
    resort: {
        type: String,
        required: [true, 'Resort is required.'],
        trim: true
    },

    // Price stored as a numeric value
    perPerson: {
        type: Number,
        required: [true, 'Price is required.'],
        min: [0, 'Price cannot be negative.'],
        index: true
    },

    // Image filename
    image: {
        type: String,
        required: [true, 'Image is required.'],
        trim: true
    },

    // Description shown on the website
    description: {
        type: String,
        required: [true, 'Description is required.'],
        trim: true
    },
    
    // Administrator who created the trip
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: false
    }

},
    {
        timestamps: true
    });

const Trip = mongoose.model('trips', tripSchema);

module.exports = Trip;