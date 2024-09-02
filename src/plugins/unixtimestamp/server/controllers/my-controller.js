'use strict';

module.exports = ({ strapi }) => ({
  index(ctx) {
    ctx.body = strapi
      .plugin('unixtimestamp')
      .service('myService')
      .getWelcomeMessage();
  },
});
