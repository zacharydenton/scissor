module.exports = (grunt) ->

  # Project configuration.
  grunt.initConfig
    coffee:
      compile:
        files:
          'js/webscissor.js': 'js/webscissor.coffee'
    less:
      compile:
        files:
          'css/webscissor.css': 'css/webscissor.less'
    watch:
      all:
        files: ['js/*.coffee', 'css/*.less']
        tasks: ['coffee', 'less']
    connect:
      server:
        options:
          port: 1337
          hostname: '*'

  # These plugins provide necessary tasks.
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-less'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-connect'

  # Default task.
  grunt.registerTask 'default', ['connect', 'watch']
