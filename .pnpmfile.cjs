function readPackage(pkg) {
  if (pkg.name === 'hono') {
    pkg.version = '4.12.25';
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
