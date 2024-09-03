module.exports = {
    async getCurrentTimeStamp(ctx) {
    try {
      const currentTimestamp = Date.now();

      const hoursOffset = parseInt(ctx.query.hours) || 2;

      const offsetMilliseconds = hoursOffset * 60 * 60 * 1000;

      ctx.body = {
        previewTimeSamp: currentTimestamp - offsetMilliseconds,
        currentTimestamp: currentTimestamp,
        futureTimeStamp: currentTimestamp + offsetMilliseconds
      };
    } catch(error) {

    }
  },

    async getApiStatistics(ctx) {
        try {
            const countdownTimerTotalEntries = await strapi.entityService.count('api::countdown-timer.countdown-timer');

            const medicationEntries = await strapi.entityService.count('api::medication.medication');
            const intakeTimeEntries = await strapi.entityService.count('api::intake-time.intake-time');
            const intakeStatusEntries = await strapi.entityService.count('api::intake-status.intake-status');

            const weightsEntries = await strapi.entityService.count('api::weight.weight');
            const waterIntakesEntries = await strapi.entityService.count('api::water-intake.water-intake');

            let totalEntries = 0;
            const totalEntriesArray = [
                countdownTimerTotalEntries,
                medicationEntries,
                intakeTimeEntries,
                intakeStatusEntries,
                weightsEntries,
                waterIntakesEntries
            ]

            totalEntriesArray.forEach(count=> {
              totalEntries += count;
            })

            let avgWeightPerUser = await avgWeightFromUsers()
            let avgDurationPerUser = await avgDurationsFromUsers()

            return {
              countdownTimerTotalEntries,
              medications: {
                medicationEntries,
                intakeTimeEntries,
                intakeStatusEntries
              },
              weightsEntries,
              waterIntakesEntries,
              totalEntries,
              avgWeightPerUser,
              avgDurationPerUser
          };
        } catch (err) {
            ctx.status = 500;
            ctx.body = {
            "message": err.message,
          }
        }
  }
};

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
      totalWeight += lastWeightEntry[0].value;
      count++;
    }
  }

  // 5. Berechne das Durchschnittsgewicht
  return count > 0 ? totalWeight / count : 0;
}

async function avgDurationsFromUsers() {
  const x = "api::countdown-timer.countdown-timer"

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

  return count > 0 ? totalTimerDuration / count : 0;
}
