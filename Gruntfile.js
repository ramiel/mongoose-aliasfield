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

  grunt.registerTask('travis', ['mochacov:coverage']);
  if(process.env.TRAVIS || true){
    grunt.registerTask('test', ['mochacov:test','travis']);
  }else{
    grunt.registerTask('test', ['mochacov:test']);
  }
};