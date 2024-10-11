const {
  validateUserId, unixToISO, removeTimestamps, removeComponentFieldFromIngredients,
} = require('../../../utils/validation');



module.exports = {
    async getCurrentTimeStamp(ctx) {
        try {
            const currentTimestamp = Date.now();

            const hoursOffset = parseInt(ctx.query.hours) || 2;

            const offsetMilliseconds = hoursOffset * 60 * 60 * 1000;

            ctx.body = {
                previewTimeSamp: currentTimestamp - offsetMilliseconds,
                currentTimestamp: currentTimestamp,
                futureTimeStamp: currentTimestamp + offsetMilliseconds,
                currentTimeString: new Date().toISOString(),
            };
        } catch (error) {
            ctx.status = 500;
            ctx.body = {
                "message": "An error occurred while retrieving the timestamp.",
                "error": error.message
            };
        }
    },
    async appStatistics(ctx) {
    try {
      const countdownTimerTotalEntries = await strapi.entityService.count('api::countdown-timer.countdown-timer') || 0;
      const totalMealPlans = await strapi.entityService.count('api::meal-plan-day.meal-plan-day') || 0;
      const totalMealPlansSpots = await strapi.entityService.count('api::meal-plan-slot.meal-plan-slot') || 0;
      const totalMeal = await strapi.entityService.count('api::meal.meal') || 0;
      const totalMedication = await strapi.entityService.count('api::medication.medication') || 0;
      const totalIntakeTimes = await strapi.entityService.count('api::intake-time.intake-time') || 0;
      const totalIntakeStatus = await strapi.entityService.count('api::intake-status.intake-status') || 0;

      const weightsEntries = await strapi.entityService.count('api::weight.weight') || 0;
      const waterIntakesEntries = await strapi.entityService.count('api::water-intake.water-intake') || 0;

      let totalEntries = 0;
      const totalEntriesArray = [
        countdownTimerTotalEntries,
        totalMedication,
        totalIntakeTimes,
        totalIntakeStatus,
        weightsEntries,
        waterIntakesEntries,
        totalMealPlansSpots,
        totalMealPlans
      ];

      totalEntriesArray.forEach(count => {
        totalEntries += count || 0;
      });

      let avgWeightPerUser = (await avgWeightFromUsers()) || 0.0;
      let avgDurationPerUser = (await avgDurationsFromUsers()) || 0.0;
      let avgMedicationsData = await avgMedicationsTimerFromUsers(totalMedication);
      let avgStatusPerUser = avgMedicationsData.avgStatusPerUser || 0.0;
      let avgTimerPerUser = avgMedicationsData.avgTimerPerUser || 0.0;

      return {
        mealPlan: {
          totalMealPlansSpots: totalMealPlansSpots || 0,
          totalMealPlans: totalMealPlans || 0
        },
        medications: {
          totalMedication: totalMedication || 0,
          totalIntakeTimes: totalIntakeTimes || 0,
          totalIntakeStatus: totalIntakeStatus || 0
        },
        recipes: {
          totalMeal: totalMeal || 0
        },
        totalEntries,
        timer: {
          countdownTimerTotalEntries: countdownTimerTotalEntries || 0
        },
        userRelated: {
          avgWeightPerUser,
          avgDurationPerUser,
          avgTimerPerUser,
          avgStatusPerUser
        },
        weights: {
          weightsEntries: weightsEntries || 0
        },
        waterIntake: {
          waterIntakesEntries: waterIntakesEntries || 0
        }
      };
    } catch (err) {
      ctx.status = 500;
      ctx.body = {
        "message": err.message,
      };
    }
  },
    async generateID(ctx) {
      try {
        const id = generateId();

        ctx.body = {
          generatedId: id
        };
      } catch (error) {
        ctx.status = 500;
        ctx.body = {
          "message": "An error occurred while retrieving the timestamp.",
          "error": error.message
        };
      }
    },
    async changeLog(ctx) {
        let changeLogModel = "api::change-log.change-log"
        let result = await strapi.entityService.findMany(changeLogModel, {
            populate: {
                features: true
            },
        });

        if (result.features && Array.isArray(result.features)) {
            result.features = result.features.map(feature => {
                delete feature.id
                const { __component, ...rest } = feature;
                return rest;
            });
        }

        ctx.body = removeTimestamps(result);
    }
}

function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const blocks = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('')
  );
  return blocks.join('-');
}

async function avgWeightFromUsers() {
  // 1. Finde alle eindeutigen Firebase uid in der Gewichtstabelle
  const uniqueUserIds = await strapi.db.query('api::weight.weight').findMany({
    select: ['userId'], // Hier 'userId' als das Feld mit der Firebase UID
    distinct: true,
  });

  // 2. Initialisiere Variablen für die Summe der Gewichte und die Anzahl der Benutzer
  let totalWeight = 0;
  let count = 0;


  for (const uid of uniqueUserIds) {
    // 3. Finde den letzten Gewichtseintrag für jeden `uid`
    const lastWeightEntry = await strapi.entityService.findMany('api::weight.weight', {
      filters: {userId: uid.userId},
      sort: {createdAt: 'desc'},  // oder 'updatedAt', je nachdem, welches Feld das neuste Gewicht anzeigt
      limit: 1,
      fields: ['value']
    });

    if (lastWeightEntry.length > 0) {
      // 4. Addiere den Wert zum totalWeight
      totalWeight += parseFloat(lastWeightEntry[0].value);
      count++;
    }
  }

  // 5. Berechne das Durchschnittsgewicht
  return count > 0 ? totalWeight / count : 0.0;
}

async function avgDurationsFromUsers() {
  const uniqueUserIds = await strapi.db.query('api::water-intake.water-intake').findMany({
    select: ['userId'],
    distinct: true,
  });

  let totalTimerDuration = 0;
  let count = 0;

  for (const uid of uniqueUserIds) {
    const countdownTimerEntries = await strapi.entityService.findMany('api::countdown-timer.countdown-timer', {
      filters: {userId: uid.userId},
      fields: ['duration']
    });

    if (countdownTimerEntries.length > 0) {
      for (const entry of countdownTimerEntries) {
        totalTimerDuration += parseFloat(entry.duration);
        count++;
      }
    }
  }

  return count > 0 ? totalTimerDuration / count : 0.0;
}

async function avgMedicationsTimerFromUsers(totalMedication) {
  const intakeTime = "api::intake-time.intake-time"
  const intakeStatus = "api::intake-status.intake-status"

  const uniqueUserIds = await strapi.db.query(intakeTime).findMany({
    select: ['intakeTimeId'],
    distinct: true,
  });

  let totalStatusPerUser = 0;
  let count = 0;

  for (const timer of uniqueUserIds) {
    const statusEntries = await strapi.entityService.findMany(intakeStatus, {
      filters: {intakeTimeId: timer.intakeTimeId},
    });

    totalStatusPerUser += parseFloat(statusEntries.length);
    count++;
  }

  return {
    avgStatusPerUser: totalStatusPerUser / totalMedication,
    avgTimerPerUser: count / totalMedication
  }
}
