'use strict';

/**
 * water-intake router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::water-intake.water-intake');

module.exports = {
    routes: [
        // Standard Routes (CRUD)
        {
            method: 'GET',
            path: '/water-intakes',
            handler: 'api::water-intake.water-intake.find', 
            config: {
                policies: []
            }
        },
        {
            method: 'GET',
            path: '/water-intakes/:id',
            handler: 'api::water-intake.water-intake.findOne', 
            config: {
                policies: []
            }
        },
        {
            method: 'POST',
            path: '/water-intakes',
            handler: 'api::water-intake.water-intake.create', 
            config: {
                policies: []
            }
        },
        {
            method: 'PUT',
            path: '/water-intakes/:id',
            handler: 'api::water-intake.water-intake.update',  
            config: {
                policies: []
            }
        },
        {
            method: 'DELETE',
            path: '/water-intakes/:id',
            handler: 'api::water-intake.water-intake.delete', 
            config: {
                policies: []
            }
        },
        // END STANDARD



        {
            method: 'PUT',
            path: '/water-intakes/update-or-insert', 
            handler: 'custom-water-intakes.updateOrInsert', 
            config: {
                policies: []
            }
        },
        {
            method: 'DELETE',
            path: '/water-intakes/delete-timer-list', 
            handler: 'custom-water-intakes.deleteWaterIntakes', 
            config: {
                policies: []
            }
        },
        {
            method: 'GET',
            path: '/water-intakes-list', 
            handler: 'custom-water-intakes.getListByUserId', 
            config: {
                policies: []
            }
        },
    ]
}
