function unixToISO(timestampString) {
    const timestamp = parseInt(timestampString, 10);
    const date = new Date(timestamp);
    return date.toISOString();
}

module.exports = unixToISO;
