module.exports = function(grunt) {
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

  if(process.env.TRAVIS){
    grunt.registerTask('test', ['mochacov:test','mochacov:coverage']);
  }else{
    grunt.registerTask('test', ['mochacov:test']);
  }
};