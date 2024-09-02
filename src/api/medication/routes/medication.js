'use strict';

/**
 * medication router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = {
    routes: [
        // STANDARD ROUTES (CRUD)
        {
            method: 'GET',
            path: '/medications',
            handler: 'api::medication.medication.find',
            config: {
                policies: []
            }
        },
        {
            method: 'GET',
            path: '/medications/:id',
            handler: 'api::medication.medication.findOne',
            config: {
                policies: []
            }
        },
        {
            method: 'POST',
            path: '/medications',
            handler: 'api::medication.medication.create',
            config: {
                policies: []
            }
        },
        {
            method: 'PUT',
            path: '/medications/:id',
            handler: 'api::medication.medication.update',
            config: {
                policies: []
            }
        },
        {
            method: 'DELETE',
            path: '/medications/:id',
            handler: 'api::medication.medication.delete',
            config: {
                policies: []
            }
        },
        // END STANDARD ROUTES



        // CUSTOM ROUTES
        {
            method: "POST",
            path: "/medication/updateRemoteData",
            handler: "custom-medications.updateRemoteData",
            config: {
                policies: []
            }
        },
        {
          method: "GET",
          path: "/medication/findUpdated",
          handler: "custom-medications.findUpdated",
          config: {
            policies: []
          }
        },
        {
          method: "GET",
          path: "/medication/counts",
          handler: "custom-medications.getCounts",
          config: {
            policies: []
          }
        }
      // END CUSTOM ROUTES
    ]
}
