'use strict';

/**
 * weight router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::weight.weight');

module.exports = {
    routes: [
         // Standard-Routen (CRUD)
         {
            method: 'GET',
            path: '/weights',
            handler: 'api::weight.weight.find', 
            config: {
                policies: []
            }
        },
        {
            method: 'GET',
            path: '/weights/:id',
           handler: 'api::weight.weight.findOne', 
            config: {
                policies: []
            }
        },
        {
            method: 'POST',
            path: '/weights',
           handler: 'api::weight.weight.create', 
            config: {
                policies: []
            }
        },
        {
            method: 'PUT',
            path: '/weights/:id',
            handler: 'api::weight.weight.update',  
            config: {
                policies: []
            }
        },
        {
            method: 'DELETE',
            path: '/weights/:id',
            handler: 'api::weight.weight.delete', 
            config: {
                policies: []
            }
        },
        // END STANDART



        {
            method: 'PUT',
            path: '/weights/update-or-insert',
            handler: 'custom-weights.updateOrInsert',
            config: {
                policies: []
            }
        },
        {
            method: 'DELETE',
            path: '/weights/delete-timer-list',
            handler: 'custom-weights.deleteWeights',
            config: {
                policies: []
            }
        },
        {
            method: 'GET',
            path: '/weights-list',
             handler: 'custom-weights.getListByUserId',
            config: {
                policies: []
            }
        },
    ]
}