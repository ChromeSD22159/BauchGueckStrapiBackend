const admin = require('firebase-admin');
const serviceAccount = require('./../../bauchglueck-6c1cf-firebase-adminsdk-ddfi0-72d216c442.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = {
    admin
};
