module.exports = function(grunt) {
  grunt.initConfig({
    mochacov: {
      coverage: {
        options: {
          coveralls: {
            repoToken: 'eyho4zXOZDH8j7krQc6Neg0jox4jTcxB7'
          }
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
  if(process.env.TRAVIS){
    grunt.registerTask('test', ['mochacov:test','travis']);
  }else{
    grunt.registerTask('test', ['mochacov:test']);
  }
};