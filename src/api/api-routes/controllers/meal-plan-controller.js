const {
  validateRequestBodyIsArray,
  handleEmptyUserParameter,
  userIdToString,
  validateTimerStamp,
  removeTimestamps,
  handleEmptyResponseBody
} = require("../../../utils/validation");
module.exports = {
  async syncDeviceMealPlanDayData(ctx) {
    if(!validateRequestBodyIsArray(ctx)) return;
    const mealPlanDayData = ctx.request.body;

    // Iteriere über die übermittelten Daten und synchronisiere jeden Eintrag
    for (const mealPlanDay of mealPlanDayData) {
      const { mealPlanDayId, userId, updatedAtOnDevice } = mealPlanDay;

      // Prüfe, ob der Eintrag bereits existiert
      let existingEntry = await strapi.db.query('api::meal-plan-day.meal-plan-day').findOne({
        where: { mealPlanDayId, userId },
      });

      if (existingEntry) {
        // Aktualisiere den Eintrag, wenn der Zeitstempel neuer ist
        if (updatedAtOnDevice > existingEntry.updatedAtOnDevice) {
          await strapi.db.query('api::meal-plan-day.meal-plan-day').update({
            where: { id: existingEntry.id },
            data: mealPlanDay,
          });
        }
      } else {
        // Erstelle einen neuen Eintrag, wenn er nicht existiert
        await strapi.db.query('api::meal-plan-day.meal-plan-day').create({
          data: mealPlanDay,
        });
      }
    }

    ctx.send({ message: 'Sync completed successfully' });
  },
  async getUpdatedMealPlanDayEntries(ctx) {
    if (handleEmptyUserParameter(ctx)) return;

    const userId = userIdToString(ctx.query.userId);

    const timeStamp = validateTimerStamp(ctx)

    // Abrufen der aktualisierten Einträge nach dem angegebenen Zeitstempel
    let result = await strapi.entityService.findMany('api::meal-plan-day.meal-plan-day', {
      filters: {
        userId: userId,
        updatedAtOnDevice: {$gt: timeStamp},
      },
      populate: {
        mealPlanSlots: {
          populate: {
            mealId: true,
          },
        },
      },
    });

    ctx.body = removeTimestamps(result);

    handleEmptyResponseBody(ctx, 'No medication found after the specified timestamp')
  },
}
