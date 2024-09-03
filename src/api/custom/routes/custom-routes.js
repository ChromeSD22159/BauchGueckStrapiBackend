const controller = "custom-controller."

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/timeStamp',
      handler: controller + 'getCurrentTimeStamp',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/getApiStatistics',
      handler: controller + 'getApiStatistics',
      config: {}
    }
  ],
};
