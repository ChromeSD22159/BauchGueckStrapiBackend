const { google } = require('googleapis');
const functions = require('firebase-functions');
const { admin } = require('../../config/firebase/index')
const serviceAccount = require('../../serviceAccount.json');

const project = serviceAccount.project_id;
const location = 'europe-west3';
// https://europe-west3-bauchglueck-6c1cf.cloudfunctions.net/sendNotification

async function createFirebaseJob(intakeTimeId, time, tokens) {
  const scheduler = google.cloudscheduler('v1');
  const location = 'europe-west3'; // e.g., us-central1
  const jobId = `intakeTime-${intakeTimeId}`; // Unique job ID
  const timeString = formatTimeToCron(time); // Convert time to cron format

  const job = {
    name: `projects/${project}/locations/${location}/jobs/${jobId}`,
    schedule: timeString, // Set the time for daily notification
    timeZone: 'UTC', // Timezone for scheduling
    httpTarget: {
      uri: `https://${location}-${project}.cloudfunctions.net/sendNotification`,
      httpMethod: 'POST',
      body: Buffer.from(JSON.stringify({
        tokens,
        intakeTimeId,
      })).toString('base64'),
      headers: {
        'Content-Type': 'application/json',
      },
    },
  };

  try {
    await scheduler.projects.locations.jobs.create({
      parent: `projects/${project}/locations/${location}`,
      requestBody: job,
    });
    console.log(`Job created for intakeTimeId: ${intakeTimeId}`);
  } catch (error) {
    console.error('Error creating job:', error);
  }
}

async function updateFirebaseJob(intakeTimeId, time, tokens) {
  const scheduler = google.cloudscheduler('v1');
  const jobId = `intakeTime-${intakeTimeId}`;
  const timeString = formatTimeToCron(time);

  const job = {
    name: `projects/${project}/locations/${location}/jobs/${jobId}`,
    schedule: timeString,
    timeZone: 'UTC',
    httpTarget: {
      uri: `https://${location}-${project}.cloudfunctions.net/sendNotification`,
      httpMethod: 'POST',
      body: Buffer.from(JSON.stringify({
        tokens,
        intakeTimeId,
      })).toString('base64'),
      headers: {
        'Content-Type': 'application/json',
      },
    },
  };

  try {
    await scheduler.projects.locations.jobs.patch({
      name: `projects/${project}/locations/${location}/jobs/${jobId}`,
      updateMask: 'schedule,httpTarget',
      requestBody: job,
    });
    console.log(`Job updated for intakeTimeId: ${intakeTimeId}`);
  } catch (error) {
    console.error('Error updating job:', error);
  }
}

async function deleteFirebaseJob(intakeTimeId) {
  const scheduler = google.cloudscheduler('v1');
  const jobId = `intakeTime-${intakeTimeId}`;

  try {
    await scheduler.projects.locations.jobs.delete({
      name: `projects/${project}/locations/${location}/jobs/${jobId}`,
    });
    console.log(`Job deleted for intakeTimeId: ${intakeTimeId}`);
  } catch (error) {
    console.error('Error deleting job:', error);
  }
}

async function handleRecurringNotifications(medications) {
  for (const medication of medications) {
    const tokens = await strapi.entityService.findMany('api::device-token.device-token', {
      filters: { userId: medication.userId }
    });

    const tokenList = tokens.map(token => token.deviceToken);

    for (const intakeTime of medication.intake_times) {
      const existingJob = await checkFirebaseJob(intakeTime.intakeTimeId); // Placeholder for checking existing job

      if (medication.notify) {
        // Update or Create Notification Job
        if (existingJob) {
          await updateFirebaseJob(intakeTime.intakeTimeId, intakeTime.time, tokenList);
        } else {
          await createFirebaseJob(intakeTime.intakeTimeId, intakeTime.time, tokenList);
        }
      } else {
        // Delete Job if Notify is false
        if (existingJob) {
          await deleteFirebaseJob(intakeTime.intakeTimeId);
        }
      }
    }
  }
}

async function checkFirebaseJob(intakeTimeId) {
  const scheduler = google.cloudscheduler('v1');
  const jobId = `intakeTime-${intakeTimeId}`; // Unique job ID

  try {
    // Attempt to get the job
    const job = await scheduler.projects.locations.jobs.get({
      name: `projects/${project}/locations/${location}/jobs/${jobId}`,
    });

    if (job) {
      console.log(`Job found for intakeTimeId: ${intakeTimeId}`);
      return job; // Job exists
    }
  } catch (error) {
    if (error.code === 404) {
      console.log(`No job found for intakeTimeId: ${intakeTimeId}`);
      return null; // No job found
    }
    console.error('Error checking job:', error);
    throw error;
  }
}

function formatTimeToCron(time) {
  // Convert time (HH:mm) to cron format for daily scheduling
  const [hour, minute] = time.split(':');
  return `${minute} ${hour} * * *`; // Runs every day at specified hour and minute
}

exports.sendNotification = functions.https.onRequest(async (req, res) => {
  const { tokens, intakeTimeId } = req.body;

  const message = {
    notification: {
      title: 'Medication Reminder',
      body: `It's time to take your medication for intake time: ${intakeTimeId}`,
    },
    tokens: tokens,
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log('Notification sent successfully:', response);
    res.status(200).send('Notification sent successfully');
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send('Failed to send notification');
  }
});

module.exports = {
  createFirebaseJob,
  updateFirebaseJob,
  deleteFirebaseJob,
  checkFirebaseJob,
  handleRecurringNotifications
};
