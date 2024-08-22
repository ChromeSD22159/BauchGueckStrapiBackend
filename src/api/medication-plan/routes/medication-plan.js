'use strict';

/**
 * medication-plan router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

//module.exports = createCoreRouter('api::medication-plan.medication-plan');

module.exports.routes = [
    // Standard Routes (CRUD)
    {
        method: 'GET',
        path: '/medication-plans',
        handler: 'api::medication-plan.medication-plan.find', 
        config: {
            policies: []
        }
    },
    {
        method: 'GET',
        path: '/medication-plans/:id',
        handler: 'api::medication-plan.medication-plan.findOne', 
        config: {
            policies: []
        }
    },
    {
        method: 'POST',
        path: '/medication-plans',
        handler: 'api::medication-plan.medication-plan.create', 
        config: {
            policies: []
        }
    },
    {
        method: 'PUT',
        path: '/medication-plans/:id',
        handler: 'api::medication-plan.medication-plan.update',  
        config: {
            policies: []
        }
    },
    {
        method: 'DELETE',
        path: '/medication-plans/:id',
        handler: 'api::medication-plan.medication-plan.delete', 
        config: {
            policies: []
        }
    },
    // END STANDARD

    {
        method: 'PUT',
        path: '/medication-plans/update-or-insert', 
        handler: 'custom-medication-plans.updateOrInsert', 
        config: {
            policies: []
        }
    },
    {
        method: 'DELETE',
        path: '/medication-plans/delete-timer-list', 
        handler: 'custom-medication-plans.deleteMedicationPlans', 
        config: {
            policies: []
        }
    },
    {
        method: 'GET',
        path: '/medication-plans-list', 
        handler: 'custom-medication-plans.getListByUserId', 
        config: {
            policies: []
        }
    },
];