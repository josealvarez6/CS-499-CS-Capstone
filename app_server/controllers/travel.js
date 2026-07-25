// Base endpoint used to retrieve trip information from the REST API.
const tripsEndpoint = 'http://localhost:3000/api/trips';

const options = {
    method: 'GET',
    headers: {
        Accept: 'application/json'
    }
};

/**
 * Builds a public-facing travel-page URL while preserving
 * the current search, filter, and sorting selections.
 *
 * The page parameter is replaced with the requested page,
 * allowing Previous and Next links to retain all filters.
 */
const buildPageUrl = function (query, page) {
    const params = new URLSearchParams();

    // Copy each existing query-string value except page.
    Object.entries(query).forEach(([key, value]) => {
        if (
            key !== 'page' &&
            value !== undefined &&
            value !== null &&
            value !== ''
        ) {
            params.set(key, value.toString());
        }
    });

    params.set('page', page.toString());

    return `/travel?${params.toString()}`;
};

/**
 * GET travel view.
 *
 * Passes search, filtering, sorting, and pagination values
 * from the public website to the reusable trips API.
 */
const travel = async function (req, res) {
    try {
        // Build the API query string from values supplied
        // through the public-facing search form.
        const apiParams = new URLSearchParams();

        const allowedParameters = [
            'destination',
            'minPrice',
            'maxPrice',
            'length',
            'available',
            'sort',
            'order',
            'page',
            'limit'
        ];

        // Only approved query parameters are forwarded to the API.
        allowedParameters.forEach((parameter) => {
            const value = req.query[parameter];

            if (
                value !== undefined &&
                value !== null &&
                value !== ''
            ) {
                apiParams.set(parameter, value.toString());
            }
        });

        // Apply default values when the public page does not
        // provide sorting or pagination selections.
        if (!apiParams.has('sort')) {
            apiParams.set('sort', 'name');
        }

        if (!apiParams.has('order')) {
            apiParams.set('order', 'asc');
        }

        if (!apiParams.has('page')) {
            apiParams.set('page', '1');
        }

        if (!apiParams.has('limit')) {
            apiParams.set('limit', '6');
        }

        const requestUrl =
            `${tripsEndpoint}?${apiParams.toString()}`;

        // Request the filtered and paginated trip data.
        const apiResponse = await fetch(requestUrl, options);

        // Convert the API response into a JavaScript object.
        const responseData = await apiResponse.json();

        // Handle validation or server errors returned by the API.
        if (!apiResponse.ok) {
            return res.status(apiResponse.status).render('travel', {
                title: 'Travlr Getaways',
                trips: [],
                message:
                    responseData.message ||
                    'Unable to retrieve trips.',
                filters: req.query,
                isTravel: true
            });
        }

        // Confirm that the response matches the enhanced API structure.
        if (
            !responseData.success ||
            !Array.isArray(responseData.trips) ||
            !responseData.pagination
        ) {
            return res.status(500).render('travel', {
                title: 'Travlr Getaways',
                trips: [],
                message: 'The API returned an unexpected response.',
                filters: req.query,
                isTravel: true
            });
        }

        const trips = responseData.trips;
        const pagination = responseData.pagination;
        const filters = responseData.filters || {};

        let message;

        if (pagination.totalItems === 0) {
            message =
                'No trips matched the selected search criteria.';
        } else if (pagination.totalItems === 1) {
            message = '1 trip found.';
        } else {
            message = `${pagination.totalItems} trips found.`;
        }

        // Create Previous and Next URLs while preserving
        // the user's current search and filter selections.
        const previousPageUrl =
            pagination.hasPreviousPage
                ? buildPageUrl(
                    req.query,
                    pagination.currentPage - 1
                )
                : null;

        const nextPageUrl =
            pagination.hasNextPage
                ? buildPageUrl(
                    req.query,
                    pagination.currentPage + 1
                )
                : null;

        // Prepare selection flags for Handlebars.
        // This avoids requiring custom comparison helpers.
        const selectedValues = {
            sortName: filters.sort === 'name',
            sortResort: filters.sort === 'resort',
            sortPrice: filters.sort === 'price',
            sortLength: filters.sort === 'length',
            sortStart: filters.sort === 'start',

            orderAscending: filters.order === 'asc',
            orderDescending: filters.order === 'desc',

            availableAll:
                filters.available === null ||
                filters.available === undefined ||
                filters.available === '',

            availableTrue: filters.available === true,
            availableFalse: filters.available === false,

            limitThree:
                pagination.pageSize === 3,

            limitSix:
                pagination.pageSize === 6,

            limitNine:
                pagination.pageSize === 9,

            limitTwelve:
                pagination.pageSize === 12
        };

        // Render the public travel page with results,
        // filters, and pagination information.
        return res.render('travel', {
            title: 'Travlr Getaways',
            trips,
            message,
            filters,
            pagination,
            previousPageUrl,
            nextPageUrl,
            selectedValues,
            isTravel: true
        });
    } catch (error) {
        console.error('Travel page API error:', error);

        return res.status(500).render('travel', {
            title: 'Travlr Getaways',
            trips: [],
            message:
                'The trip service is currently unavailable. Please try again.',
            filters: req.query,
            isTravel: true
        });
    }
};

module.exports = {
    travel
};