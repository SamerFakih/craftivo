// Karma configuration with coverage thresholds
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: { clearContext: false },
    reporters: ['progress', 'coverage'],
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage'),
      reporters: [ { type: 'html' }, { type: 'text-summary' }, { type: 'lcov' } ],
      check: { global: { statements: 60, branches: 50, functions: 55, lines: 60 } }
    },
    browsers: ['ChromeHeadless'],
    singleRun: true
  });
};
