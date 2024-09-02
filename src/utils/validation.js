function stringToInteger(str) {
  const num = parseInt(str, 10);
  return isNaN(num) ? 0 : num;
}

function unixToISO(unixTimestamp) {
  return new Date(unixTimestamp * 1000).toISOString();
}

function userIdToString(str) {
  try {
    if (str === undefined || str === null) {
      return null;
    } else {
      // Your existing logic to convert userId to a string
      return String(str);
    }
  } catch (error) {
    console.error("Error converting string to BigInt:", error);
    return null;
  }
}

function removeTimestamps(obj) {
  if (Array.isArray(obj)) {
    obj.forEach(removeTimestamps);
  } else if (typeof obj === 'object' && obj !== null) {
    delete obj['createdAt'];
    delete obj['updatedAt'];

    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        removeTimestamps(obj[key]);
      }
    }
  }
  return obj;
}

function validateUserId(ctx) {
  if (!ctx.query.userId) {
    ctx.status = 400;
    ctx.body = {
      error: 'Invalid User ID',
      message: 'A valid user ID is required but was not provided.'
    };
    return false;
  }
  return true;
}

function validateTimerStamp(ctx) {
   return stringToInteger(ctx.query.timeStamp)
}

function validateRequestBodyIsArray(ctx) {
  const body = ctx.request.body;

  if (!body || !Array.isArray(body) || body.length === 0) {
    ctx.status = 400; // Statuscode 400 für "Bad Request"
    ctx.body = {
      error: {
        status: 400,
        name: "BadRequest",
        message: "Request body must be a non-empty array."
      }
    };
    return false; // Rückgabe von false, um anzuzeigen, dass die Validierung fehlgeschlagen ist
  }

  return true; // Rückgabe von true, wenn die Validierung erfolgreich war
}

module.exports = {
  stringToInteger,
  unixToISO,
  userIdToString,
  removeTimestamps,
  validateUserId,
  validateTimerStamp,
  validateRequestBodyIsArray
};
