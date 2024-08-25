'use strict';

/**
 * time-stamp router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::time-stamp.time-stamp');

module.exports = {
    routes: [
        {
            method: "GET",
            path: "/currentTimeStamp",
            handler: "time-stamp.getCurrentTimeStamp",
            config: {
                policies: []
            }
        }
    ]
}