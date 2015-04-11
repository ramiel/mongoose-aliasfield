var grunt = require('grunt');

grunt.initConfig({
  mochacov: {
    coverage: {
      options: {
        coveralls: true
      }
    },
    test: {
      options: {
        reporter: 'spec'
      }
    },
    options: {
      files: 'tests/*.js'
    }
  }
});

grunt.loadNpmTasks('grunt-mocha-cov');

grunt.registerTask('travis', ['mochacov:coverage']);
grunt.registerTask('test', ['mochacov:test','mochacov:coverage']);