const mongoose = require('mongoose');
const Trip = require('../models/travlr'); // Register model
const Model = mongoose.model('trips');

// GET: /trips
// Retrieves trips using optional search, filtering, sorting,
// availability, and pagination query parameters.
const tripsList = async (req, res) => {
    try {
        // Read query parameters from the incoming request.
        // Default values are used when sorting or pagination
        // parameters are not supplied.
        const {
            destination,
            minPrice,
            maxPrice,
            length,
            available,
            sort = 'name',
            order = 'asc',
            page = '1',
            limit = '6'
        } = req.query;

        // Convert the page and limit values from query-string
        // values into whole numbers.
        const pageNumber = Number.parseInt(page, 10);
        const limitNumber = Number.parseInt(limit, 10);

        // Reject invalid page values.
        if (!Number.isInteger(pageNumber) || pageNumber < 1) {
            return res.status(400).json({
                success: false,
                message: 'Page must be a positive whole number.'
            });
        }

        // Limit the number of records returned per request.
        // A maximum of 50 helps prevent excessively large responses.
        if (
            !Number.isInteger(limitNumber) ||
            limitNumber < 1 ||
            limitNumber > 50
        ) {
            return res.status(400).json({
                success: false,
                message: 'Limit must be a whole number between 1 and 50.'
            });
        }

        // Convert optional numeric filters into numbers.
        // A null value means the filter was not supplied.
        const minimumPrice =
            minPrice !== undefined && minPrice !== ''
                ? Number(minPrice)
                : null;

        const maximumPrice =
            maxPrice !== undefined && maxPrice !== ''
                ? Number(maxPrice)
                : null;

        const tripLength =
            length !== undefined && length !== ''
                ? Number(length)
                : null;

        // Validate the minimum-price filter.
        if (minimumPrice !== null && Number.isNaN(minimumPrice)) {
            return res.status(400).json({
                success: false,
                message: 'Minimum price must be numeric.'
            });
        }

        // Validate the maximum-price filter.
        if (maximumPrice !== null && Number.isNaN(maximumPrice)) {
            return res.status(400).json({
                success: false,
                message: 'Maximum price must be numeric.'
            });
        }

        // Prevent an invalid price range.
        if (
            minimumPrice !== null &&
            maximumPrice !== null &&
            minimumPrice > maximumPrice
        ) {
            return res.status(400).json({
                success: false,
                message: 'Minimum price cannot exceed maximum price.'
            });
        }

        // Validate the trip-length filter.
        if (tripLength !== null && Number.isNaN(tripLength)) {
            return res.status(400).json({
                success: false,
                message: 'Trip length must be numeric.'
            });
        }

        // Map allowed client-facing sort values to actual
        // MongoDB document fields.
        const validSortFields = {
            name: 'name',
            destination: 'name',
            resort: 'resort',
            price: 'perPerson',
            length: 'length',
            start: 'start'
        };

        const selectedSortField = validSortFields[sort];

        // Reject unsupported sort fields.
        // This prevents clients from sorting by arbitrary fields.
        if (!selectedSortField) {
            return res.status(400).json({
                success: false,
                message:
                    'Sort must be name, destination, resort, price, length, or start.'
            });
        }

        // Only ascending and descending sort directions are supported.
        if (!['asc', 'desc'].includes(order)) {
            return res.status(400).json({
                success: false,
                message: 'Order must be either asc or desc.'
            });
        }

        // Validate the availability filter when it is supplied.
        if (
            available !== undefined &&
            available !== '' &&
            !['true', 'false'].includes(available)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Available must be true or false.'
            });
        }

        // This object will be dynamically populated with only
        // the filters supplied by the client.
        const matchConditions = {};

        // Search the trip name, resort, and description.
        // The case-insensitive regular expression allows partial matches.
        if (destination && destination.trim()) {
            const searchText = destination.trim();

            matchConditions.$or = [
                {
                    name: {
                        $regex: searchText,
                        $options: 'i'
                    }
                },
                {
                    resort: {
                        $regex: searchText,
                        $options: 'i'
                    }
                },
                {
                    description: {
                        $regex: searchText,
                        $options: 'i'
                    }
                }
            ];
        }

        // Add minimum-price and maximum-price conditions only
        // when at least one price filter is supplied.
        if (minimumPrice !== null || maximumPrice !== null) {
            matchConditions.perPerson = {};

            if (minimumPrice !== null) {
                matchConditions.perPerson.$gte = minimumPrice;
            }

            if (maximumPrice !== null) {
                matchConditions.perPerson.$lte = maximumPrice;
            }
        }

        // Match trips with the selected numeric length.
        if (tripLength !== null) {
            matchConditions.length = tripLength;
        }

        // A future start date is treated as an available trip.
        if (available === 'true') {
            matchConditions.start = {
                $gte: new Date()
            };
        }

        // A past start date is treated as an unavailable trip.
        if (available === 'false') {
            matchConditions.start = {
                $lt: new Date()
            };
        }

        // MongoDB uses 1 for ascending and -1 for descending.
        const sortDirection = order === 'desc' ? -1 : 1;

        // Calculate how many records MongoDB should skip
        // before returning the requested page.
        const recordsToSkip = (pageNumber - 1) * limitNumber;

        // Build the MongoDB aggregation pipeline.
        const pipeline = [
            {
                // Apply the dynamically generated search and filter rules.
                $match: matchConditions
            },
            {
                // Sort the matching documents.
                // _id is used as a secondary sort to keep results stable.
                $sort: {
                    [selectedSortField]: sortDirection,
                    _id: 1
                }
            },
            {
                // $facet allows the query to return both the current page
                // of trips and the total number of matching documents.
                $facet: {
                    trips: [
                        {
                            $skip: recordsToSkip
                        },
                        {
                            $limit: limitNumber
                        }
                    ],
                    metadata: [
                        {
                            $count: 'totalItems'
                        }
                    ]
                }
            }
        ];

        // Execute the completed aggregation pipeline.
        const results = await Model.aggregate(pipeline).exec();

        // Safely extract the current page of trip documents
        // returned by the aggregation pipeline.
        const tripResults = results[0]?.trips ?? [];

        // Populate the createdBy reference after aggregation.
        // Aggregation returns plain documents, so populate is
        // performed separately instead of chained to the query.
        const trips = await Model.populate(
            tripResults,
            {
                path: 'createdBy',
                select: 'name email'
            }
        );

        const totalItems =
            results[0]?.metadata[0]?.totalItems ?? 0;

        // Calculate the number of available pages.
        const totalPages =
            totalItems === 0
                ? 0
                : Math.ceil(totalItems / limitNumber);

        // Return the trips, pagination metadata, and applied filters.
        return res.status(200).json({
            success: true,
            trips,
            pagination: {
                currentPage: pageNumber,
                pageSize: limitNumber,
                totalItems,
                totalPages,
                hasPreviousPage: pageNumber > 1,
                hasNextPage: pageNumber < totalPages
            },
            filters: {
                destination: destination ?? '',
                minPrice: minimumPrice,
                maxPrice: maximumPrice,
                length: tripLength,
                available:
                    available === undefined || available === ''
                        ? null
                        : available === 'true',
                sort,
                order
            }
        });
    } catch (error) {
        // Log the actual error on the server while returning
        // a safe, structured message to the requesting client.
        console.error('Unable to retrieve trips:', error);

        return res.status(500).json({
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
        // Retrieve the requested trip and replace the createdByObjectId with selected 
        // information from the users collection.
        const q = await Model
            .find({ code: req.params.tripCode })
            .populate('createdBy', 'name email')
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
        // Obtain the authenticated user's identifier from the verified JWT payload 
        // added by the authorization middleware.
        const creatorId =
            req.auth?._id ??
            req.auth?.id ??
            req.auth?.userId ??
            null;

        const newTrip = new Trip({
            code: req.body.code,
            name: req.body.name,
            length: req.body.length,
            start: req.body.start,
            resort: req.body.resort,
            perPerson: req.body.perPerson,
            image: req.body.image,
            description: req.body.description,

            // Associate the new trip with the administrator who submitted the 
            // authenticated request.
            createdBy: creatorId
        });

        const q = await newTrip.save();

        // Populate the relationship so the response contains useful creator information 
        // instead of only an ObjectId.
        await q.populate('createdBy', 'name email');

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