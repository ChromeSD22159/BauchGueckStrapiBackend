const {handleEmptyUserParameter, userIdToString, validateTimerStamp, removeTimestamps, handleEmptyResponseBody} = require("../../../utils/validation");

const model = "api::shopping-list.shopping-list";

module.exports = {
  async getUpdatedShoppingListEntries(ctx) {
      if (handleEmptyUserParameter(ctx)) return;

      const userId = userIdToString(ctx.query.userId);

      const timeStamp = validateTimerStamp(ctx)

      let result = await strapi.entityService.findMany(model, {
          filters: {
              userId: userId,
              updatedAtOnDevice: { $gt: timeStamp },
          },
      });

      ctx.body = removeTimestamps(result);

      handleEmptyResponseBody(ctx, 'No ShoppingList found after the specified timestamp')
  },
  async syncDeviceShoppingListData(ctx) {
      const shoppingListsFromApp = ctx.request.body;

      for (const shoppingListData of shoppingListsFromApp) {
          // 1. shoppingList suchen, bb shoppingList existiert
          let shoppingListOrNull = await strapi.db.query(model).findOne({
              where: {
                  shoppingListId: shoppingListData.shoppingListId,
                  userId: shoppingListData.userId
              },
          });

          // 2. wenn zugesendete gelöscht ist, update Strapi.
          if (shoppingListData.isDeleted) {
              if (shoppingListOrNull) {
                  await strapi.entityService.update(model, shoppingListOrNull.id, {
                      data: { isDeleted: true },
                  });
              }
              continue;
          }

          // 3. set idOrNull
          let shoppingListIdToUse = shoppingListOrNull ? shoppingListOrNull.id : null;

          // 4. wenn Medikament ist vorhanden update anhand der id, wenn nicht entferne id und update
          if (shoppingListOrNull) {
              // Medikament existiert, also aktualisieren
              await strapi.db.query(model).update({
                where: { id: shoppingListOrNull.id },
                data: { ...shoppingListData, id: shoppingListOrNull.id },
              });
          } else {
              // Medikament existiert nicht, also erstellen
              delete shoppingListOrNull.id;
              const newShoppingList = await strapi.db.query(model).create({
                  data: shoppingListData,
              });
              shoppingListIdToUse = newShoppingList.id;
          }
      }

      ctx.send({
          message: 'Sync completed successfully'
      });
  }
}
