'use strict';

/**
 * countdown-timer router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::countdown-timer.countdown-timer');

module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/countdown-timers/update-or-insert',
            handler: 'countdown-timer-update-or-insert.updateOrInsert',
            config: {
                policies: []
            }
        },
        {
            method: 'DELETE',
            path: '/countdown-timers/delete-timer-list',
            handler: 'countdown-timer-delete-timer-list.deleteTimerList',
            config: {
                policies: []
            }
        },
        {
            method: 'GET',
            path: '/countdown-timers/timer-list',
            handler: 'countdown-timer-delete-timer-list.getTimerListByUserId',
            config: {
                policies: []
            }
        }
    ]
}