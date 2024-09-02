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

module.exports = userIdToString;
