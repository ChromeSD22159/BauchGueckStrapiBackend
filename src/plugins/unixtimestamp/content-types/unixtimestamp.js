'use strict';

module.exports = {
  kind: 'singleType',
  collectionName: 'unixtimestamps',
  info: {
    singularName: 'unixtimestamp',
    pluralName: 'unixtimestamps',
    displayName: 'UnixTimestamp',
    description: 'A custom field for Unix timestamps',
  },
  options: {
    draftAndPublish: false,
  },
  attributes: {
    timestamp: {
      type: 'integer',
      customField: 'plugin::unixtimestamp.unix-timestamp',
    },
  },
};
