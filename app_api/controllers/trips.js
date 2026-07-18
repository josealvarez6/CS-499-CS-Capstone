const mongoose = require('mongoose');
const Trip = require('../models/travlr'); // Register model
const Model = mongoose.model('trips');

// GET: /trips - list all the trips
// Regardless of outcome, response must include HTML status code
// and JSON message to the requesting client
const tripsList = async (req, res) => {
    try {
        const q = await Model
            .find({})
            .exec();

        if (!q || q.length === 0) {
            return res
                .status(404)
                .json({
                    success: false,
                    message: 'No trips found.'
                });
        }

        return res
            .status(200)
            .json(q);

    } catch (error) {
        // Return a structured response when the database query fails.
        return res
            .status(500)
            .json({
                success: false,
                message: 'Unable to retrieve trips.'
            });
    }
};

// GET: /trips/:tripCode - lists a single trip
// Regardless of outcome, response must include HTML status code
// and JSON message to the requesting client
const tripsFindByCode = async (req, res) => {
    try {
        const q = await Model
            .find({ code: req.params.tripCode })
            .exec();

        if (!q || q.length === 0) {
            return res
                .status(404)
                .json({
                    success: false,
                    message: 'Trip not found.'
                });
        }

        return res
            .status(200)
            .json(q);

    } catch (error) {
        // Return a structured response when the database query fails.
        return res
            .status(500)
            .json({
                success: false,
                message: 'Unable to retrieve the requested trip.'
            });
    }
};

// POST: /trips - Adds a new Trip
// Regardless of outcome, response must include HTML status code
// and JSON message to the requesting client
const tripsAddTrip = async (req, res) => {
    try {
        const newTrip = new Trip({
            code: req.body.code,
            name: req.body.name,
            length: req.body.length,
            start: req.body.start,
            resort: req.body.resort,
            perPerson: req.body.perPerson,
            image: req.body.image,
            description: req.body.description
        });

        const q = await newTrip.save();

        return res
            .status(201)
            .json(q);

    } catch (error) {
        // Return field-specific messages when Mongoose validation fails.
        if (error.name === 'ValidationError') {
            const validationErrors = {};

            Object.keys(error.errors).forEach((field) => {
                validationErrors[field] = error.errors[field].message;
            });

            return res
                .status(400)
                .json({
                    success: false,
                    message: 'Trip validation failed.',
                    errors: validationErrors
                });
        }

        // Return a conflict response when the trip code already exists.
        if (error.code === 11000) {
            return res
                .status(409)
                .json({
                    success: false,
                    message: 'A trip with this code already exists.'
                });
        }

        // Return a general server response for unexpected database errors.
        return res
            .status(500)
            .json({
                success: false,
                message: 'Unable to add trip.'
            });
    }
};

// PUT: /trips/:tripCode - Updates a trip
// Regardless of outcome, response must include HTML status code
// and JSON message to the requesting client
const tripsUpdateTrip = async (req, res) => {
    try {
        const q = await Model
            .findOneAndUpdate(
                { code: req.params.tripCode },
                {
                    code: req.body.code,
                    name: req.body.name,
                    length: req.body.length,
                    start: req.body.start,
                    resort: req.body.resort,
                    perPerson: req.body.perPerson,
                    image: req.body.image,
                    description: req.body.description
                },
                {
                    new: true,

                    // Ensure updates follow the validation rules
                    // defined in the Mongoose trip schema.
                    runValidators: true
                }
            )
            .exec();

        if (!q) {
            return res
                .status(404)
                .json({
                    success: false,
                    message: 'Trip not found.'
                });
        }

        return res
            .status(200)
            .json(q);

    } catch (error) {
        // Return field-specific messages when Mongoose validation fails.
        if (error.name === 'ValidationError') {
            const validationErrors = {};

            Object.keys(error.errors).forEach((field) => {
                validationErrors[field] = error.errors[field].message;
            });

            return res
                .status(400)
                .json({
                    success: false,
                    message: 'Trip validation failed.',
                    errors: validationErrors
                });
        }

        // Return a conflict response when an updated trip code
        // duplicates an existing record.
        if (error.code === 11000) {
            return res
                .status(409)
                .json({
                    success: false,
                    message: 'A trip with this code already exists.'
                });
        }

        // Return a general server response for unexpected database errors.
        return res
            .status(500)
            .json({
                success: false,
                message: 'Unable to update trip.'
            });
    }
};

module.exports = {
    tripsList,
    tripsFindByCode,
    tripsAddTrip,
    tripsUpdateTrip
};