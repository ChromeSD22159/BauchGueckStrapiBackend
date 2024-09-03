const {
  validateUserId,
  validateTimerStamp,
  handleEmptyResponseBody,
  handleEmptyUserParameter,
  handleSearchQueryMustContain3Chars,
  removeTimestamps,
  stringToInteger,
  userIdToString,
  validateRequestBodyIsArray,
} = require('../../../utils/validation');

module.exports = {
    // NOTE: PUBLIC
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
            ctx.status = 500;
            ctx.body = {
                "message": "An error occurred while retrieving the timestamp.",
                "error": error.message
            };
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
  },


    // NOTE: Medication
    async getUpdatedMedicationEntries(ctx) {
      if (handleEmptyUserParameter(ctx)) return;

      const userId = userIdToString(ctx.query.userId);

      const timeStamp = validateTimerStamp(ctx)

      let result = await strapi.entityService.findMany('api::medication.medication', {
        filters: {
          userId: userId,
          updatedAtOnDevice: { $gt: timeStamp },
        },
        populate: {
          intake_times: {
            filters: {
              updatedAtOnDevice: {$gt: timeStamp}, // Filter intake times
            },
            populate: 'intake_statuses',
          },
        },
      });

      ctx.body = removeTimestamps(result);

      handleEmptyResponseBody(ctx, 'No medication found after the specified timestamp')
    },

    async syncDeviceMedicationData(ctx) {
      if(!validateRequestBodyIsArray(ctx)) return;

      const medicationsFromApp = ctx.request.body;

      for (const medicationData of medicationsFromApp) {
        const { medicationId, userId, isDeleted, intake_times } = medicationData;

        // 1. Medikament suchen oder erstellen
        let medicationOrNull = await strapi.db.query('api::medication.medication').findOne({
          where: { medicationId, userId },
        });

        if (isDeleted) {
          if (medicationOrNull) {
            // Medikament existiert und soll gelöscht werden (Soft-Delete)
            await strapi.entityService.update('api::medication.medication', medicationOrNull.id, {
              data: { isDeleted: true },
            });
          }
          // Wenn das Medikament nicht existiert und als gelöscht markiert ist, ignorieren wir es einfach
          continue;
        }

        let medicationIdToUse = medicationOrNull ? medicationOrNull.id : null;

        if (medicationOrNull) {
          // Medikament existiert, also aktualisieren
          await strapi.db.query('api::medication.medication').update({
            where: { id: medicationOrNull.id },
            data: { ...medicationData, id: medicationOrNull.id },
          });
        } else {
          // Medikament existiert nicht, also erstellen
          delete medicationData.id; // Sicherstellen, dass keine ID von der App übergeben wird
          const newMedication = await strapi.db.query('api::medication.medication').create({
            data: medicationData,
          });
          medicationIdToUse = newMedication.id; // Neue ID verwenden
        }

        // 2. Einnahmezeiten verarbeiten (nur wenn das Medikament nicht gelöscht wurde)
        if (!isDeleted) {
          for (const intakeTimeData of intake_times) {
            const { id: intakeTimeId, intakeTime, intake_statuses } = intakeTimeData;

            // Einnahmezeit suchen oder erstellen
            let intakeTimeOrNull = await strapi.db.query('api::intake-time.intake-time').findOne({
              where: { id: intakeTimeId, medication: medicationIdToUse },
            });

            let intakeTimeIdToUse = intakeTimeOrNull ? intakeTimeOrNull.id : null;

            if (intakeTimeOrNull) {
              // Einnahmezeit existiert, also aktualisieren
              await strapi.db.query('api::intake-time.intake-time').update({
                where: { id: intakeTimeOrNull.id },
                data: { intakeTime },
              });
            } else {
              // Einnahmezeit existiert nicht, also erstellen
              delete intakeTimeData.id;
              const newIntakeTime = await strapi.db.query('api::intake-time.intake-time').create({
                data: { ...intakeTimeData, medication: medicationIdToUse },
              });
              intakeTimeIdToUse = newIntakeTime.id;
            }

            // 3. Einnahmestatus verarbeiten
            for (const intakeStatusData of intake_statuses) {
              const { id: intakeStatusId, date, isTaken } = intakeStatusData;

              // Einnahmestatus suchen oder erstellen
              let intakeStatus = await strapi.db.query('api::intake-status.intake-status').findOne({
                where: { id: intakeStatusId, intake_time: intakeTimeIdToUse },
              });

              if (intakeStatus) {
                // Einnahmestatus existiert, also aktualisieren
                await strapi.db.query('api::intake-status.intake-status').update({
                  where: { id: intakeStatus.id },
                  data: { isTaken },
                });
              } else {
                // Einnahmestatus existiert nicht, also erstellen
                delete intakeStatusData.id;
                await strapi.db.query('api::intake-status.intake-status').create({
                  data: { ...intakeStatusData, intake_time: intakeTimeIdToUse },
                });
              }
            }
          }
        }
      }

      ctx.send({
        message: 'Sync completed successfully'
      });
    },


    // NOTE: Recipes
    async searchRecipes(ctx) {
        // Überprüfen, ob die User-ID leer ist
        if (handleEmptyUserParameter(ctx)) return;

        // Überprüfen, ob die Suchabfrage mindestens 3 Zeichen enthält
        if (handleSearchQueryMustContain3Chars(ctx, "No recipe found. You sent less than 3 characters.")) return;

        const userId = ctx.query.userId;
        const searchQuery = ctx.query.searchQuery;

        // Basis-Filter erstellen: Nur öffentliche Rezepte oder private Rezepte des Benutzers
        const filters = {
            $or: [
                { isPrivate: false },
                { userId: userId }
            ]
        };

        // Wenn eine Suchabfrage vorhanden ist, füge sie zu den Filtern hinzu
        if (searchQuery) {
          filters.name = { $contains: searchQuery };
        }

        // Abfrage ausführen und die Ergebnisse zurückgeben
        // Ergebnisse als Antwort senden
        let result = await strapi.entityService.findMany('api::meal.meal', {
            filters: filters,
            populate: {
              ingredients: {  // Die Dynamic Zone "ingredients" wird beachtet
                populate: ['name', 'amount', 'unit'],
              },
              mainImage: true,
              category: true
            }
        });

        // Über jedes Meal-Objekt in der result-Liste iterieren und das "__component"-Feld entfernen
        for (const meal of result) {
          removeComponentFieldFromIngredients(meal);
        }

        ctx.body = removeTimestamps(result);
    },
    async createRecipe(ctx) {
        const {
            mealId,
            userId,
            name,
            description,
            preparation,
            isSnack,
            isPrivate,
            category, // ID der Kategorie
            mainImage, // Datei für das Bild
            ingredients // Dynamic Zone für die Zutaten
        } = ctx.request.body;

      try {
          // Erstelle das neue Rezept in der Datenbank
          // Sende die Antwort zurück
            ctx.body = await strapi.entityService.create('api::meal.meal', {
              data: {
                mealId,
                userId,
                name,
                description,
                preparation,
                isSnack,
                isPrivate,
                category, // Kategorie-ID wird direkt zugewiesen
                mainImage, // Bild wird direkt zugewiesen (wenn es bereits hochgeladen wurde)
                ingredients // Zutaten werden direkt zugewiesen
              }
            });
      } catch (error) {
            ctx.throw(400, 'Unable to create meal. Please check the data and try again.');
      }
  },


    // NOTE: MealPlan
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
      totalWeight += parseFloat(lastWeightEntry[0].value);
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

function removeComponentFieldFromIngredients(meal) {
  if (meal.ingredients && Array.isArray(meal.ingredients)) {
    meal.ingredients = meal.ingredients.map(ingredient => {
      const { __component, ...rest } = ingredient;
      return rest;
    });
  }
  return meal;
}
