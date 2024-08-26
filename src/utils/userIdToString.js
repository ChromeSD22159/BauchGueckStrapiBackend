function userIdToString(str) {
  try {
    return String(str)
  } catch (error) {
    console.error("Error converting string to BigInt:", error);
    return null;
  }
}

module.exports = userIdToString;
