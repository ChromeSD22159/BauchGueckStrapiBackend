'use strict';

/**
 * medication router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::medication.medication');   

module.exports = {
    routes: [
        // Standard Routes (CRUD)
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
        // END STANDARD



        {
            method: 'PUT',
            path: '/medications/update-or-insert', 
            handler: 'custom-medications.updateOrInsert', 
            config: {
                policies: []
            }
        },
        {
            method: 'DELETE',
            path: '/medications/delete-timer-list', 
            handler: 'custom-medications.deleteMedications', 
            config: {
                policies: []
            }
        },
        {
            method: 'GET',
            path: '/medications-list', 
            handler: 'custom-medications.getListByUserId', 
            config: {
                policies: []
            }
        },
    ]
}