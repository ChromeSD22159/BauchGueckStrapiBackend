'use strict';

/**
 * countdown-timer router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

//module.exports = createCoreRouter('api::countdown-timer.countdown-timer');

module.exports = {
    routes: [
         // Standard-Routen (CRUD)
         {
            method: 'GET',
            path: '/countdown-timers',
            handler: 'api::countdown-timer.countdown-timer.find', 
            config: {
                policies: []
            }
        },
        {
            method: 'GET',
            path: '/countdown-timers/:id',
            handler: 'api::countdown-timer.countdown-timer.findOne', 
            config: {
                policies: []
            }
        },
        {
            method: 'POST',
            path: '/countdown-timers',
            handler: 'api::countdown-timer.countdown-timer.create', 
            config: {
                policies: []
            }
        },
        {
            method: 'PUT',
            path: '/countdown-timers/:id',
            handler: 'api::countdown-timer.countdown-timer.update',  
            config: {
                policies: []
            }
        },
        {
            method: 'DELETE',
            path: '/countdown-timers/:id',
            handler: 'api::countdown-timer.countdown-timer.delete', 
            config: {
                policies: []
            }
        },
        // END STANDART



        {
            method: 'POST',
            path: '/countdown-timers/update-or-insert',
            handler: 'custom-countdown-timer.updateOrInsert',
            config: {
                policies: []
            }
        },
        {
            method: 'POST',
            path: '/countdown-timers/delete-timer-list',
            handler: 'custom-countdown-timer.softDeleteTimer',
            config: {
                policies: []
            }
        },
        {
            method: 'GET',
            path: '/timer-list',
            handler: 'custom-countdown-timer.getTimerListByUserId',
            config: {
                policies: []
            }
        },
        {
            method: "POST",
            path: "/timer/updateRemoteData",
            handler: "custom-countdown-timer.updateRemoteData",
            config: {
                policies: []
            }
        },
        {
            method: "GET",
            path: "/timer/fetchTimersAfterTimeStamp",
            handler: "custom-countdown-timer.fetchTimersAfterTimeStamp",
            config: {
                policies: []
            }
        }
    ]
}

/*
[2024-08-20 22:54:50.858] debug: Unknown action "api::countdown-timer.countdown-timer.find" supplied when registering a new permission
[2024-08-20 22:54:50.859] debug: Unknown action "api::countdown-timer.countdown-timer.findOne" supplied when registering a new permission
[2024-08-20 22:54:50.859] debug: Unknown action "api::countdown-timer.countdown-timer.create" supplied when registering a new permission
[2024-08-20 22:54:50.859] debug: Unknown action "api::countdown-timer.countdown-timer.update" supplied when registering a new permission
[2024-08-20 22:54:50.859] debug: Unknown action "api::countdown-timer.countdown-timer.delete" supplied when registering a new permission#
*/