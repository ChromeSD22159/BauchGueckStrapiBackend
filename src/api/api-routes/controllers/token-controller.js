const {handleEmptyResponseBody} = require("../../../utils/validation");
const model = "api::device-token.device-token";

module.exports = {
    async deleteDeviceToken(ctx) {
      const { userID, token } = ctx.request.body;

      if (!userID || !token) {
          return ctx.badRequest('userID und token sind erforderlich.');
      }

      try {
        const existingToken = await strapi.db.query(model).findMany({
            where: {
                userID: userID,
                token: token,
            }
        });

        if (existingToken.length === 0) {
            ctx.status = 400
           return ctx.badRequest('token konnte nicht gelöscht werden');
        }

        const deletedToken = await strapi.db.query(model).delete({
            where: {
              userID: userID,
              token: token
            }
        });

        ctx.status = 200
        ctx.body = {
          message: 'token gelöscht'
        };
      } catch (error) {
        strapi.log.error('Fehler beim Löschen des DeviceTokens:', error);
        return ctx.internalServerError('Fehler beim Löschen des DeviceTokens.');
      }
    },
    async saveDeviceToken(ctx) {
      const { userID, token } = ctx.request.body;

      if (!userID || !token) {
        return ctx.badRequest('userID und token sind erforderlich.');
      }

      try {
        const existingToken = await strapi.db.query(model).findMany({
            where: {
                userID: userID,
                token: token
            }
        });

        if (existingToken.length !== 0) {
            return ctx.badRequest('DeviceToken existiert bereits für diesen Benutzer.');
        }

        const newToken = await strapi.db.query(model).create({
            data: {
                userID: userID,
                token: token
            }
        });


        ctx.status = 201

        ctx.body = {
            message: 'token gespeichert'
        };
      } catch (error) {
        strapi.log.error('Fehler beim Speichern des DeviceTokens:', error);
        return ctx.internalServerError('Fehler beim Speichern des DeviceTokens.');
      }
    }
}
