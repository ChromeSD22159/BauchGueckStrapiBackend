module.exports = {
  upload: {
    config: {
      sizeLimit: 2 * 1024 * 1024, // 2mb in bytes
      breakpoints: {
        large: 1000,
        medium: 750,
        small: 500,
        xsmall: 64
      },
    }
  }
}
