import favicon from "./extensions/favicon.png";

export default {
  config: {
    locales: [
      'de', 'en'
    ],
    head: {
      favicon: favicon,
    },
    menu: {
      logo: favicon,
    },
    auth: {
      logo: favicon,
    }
  },
  bootstrap() {},
};
