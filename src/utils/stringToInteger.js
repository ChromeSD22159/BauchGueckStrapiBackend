function stringToInteger(str) {
  try {
    if (/^-?\d+$/.test(str)) {
      return parseInt(str);
    } else {
      throw new Error("Invalid input: not a valid integer representation");
    }
  } catch (error) {
    console.error("Error converting string to integer:", error); // Updated error message
    return null;
  }
}

module.exports = stringToInteger;
