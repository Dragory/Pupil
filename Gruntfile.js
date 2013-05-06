/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    meta: {
      version: '0.2.0'
    },
    banner: '/*! Pupil - v<%= meta.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> ' +
      'Miikka Virtanen; Licensed under MIT unless stated otherwise */\n',
    // Task configuration.
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      lite: {
        src: [
            'js/Init.js',
            'js/Exception.js',
            'js/LexerException.js',
            'js/ParserException.js',
            'js/ValidatorException.js',
            'js/Lexer.js',
            'js/Block.js',
            'js/BlockFactory.js',
            'js/Parser.js',
            'js/Validator.js'
        ],

        dest: 'js-release/PupilLite.js'
      },

      full: {
        src: [
            'js/Init.js',
            'js/Exception.js',
            'js/LexerException.js',
            'js/ParserException.js',
            'js/ValidatorException.js',
            'js/Lexer.js',
            'js/Block.js',
            'js/BlockFactory.js',
            'js/Parser.js',
            'js/Validator.js',
            'js/DefaultFunctions.js'
        ],

        dest: 'js-release/PupilFull.js'
      }
    },

    copy: {
      plugins: {
        files: [
          {
            expand: true,
            cwd: 'js/plugins/',
            src: ['*'],
            dest: 'js-release/plugins/'
          }
        ]
      },

      php: {
        files: [
          {
            expand: true,
            cwd: 'php/',
            src: ['*'],
            dest: 'php-release/Mivir/Pupil/'
          },
          {
            expand: true,
            cwd: 'php/',
            src: ['*'],
            dest: '../packagist/lib/Mivir/Pupil/'
          }
        ]
      }
    },

    uglify: {
      /*options: {
        banner: '<%= banner %>'
      },*/
      full: {
        src: '<%= concat.full.dest %>',
        dest: 'js-release/PupilFull.min.js'
      },

      lite: {
        src: '<%= concat.lite.dest %>',
        dest: 'js-release/PupilLite.min.js'
      },

      plugins: {
        files: [
          {
            expand: true,
            cwd: 'js/plugins/',
            src: '*.js',
            dest: 'js-release/plugins/',
            ext: '.min.js'
          }
        ]
      }
    },

    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        globals: {
          jQuery: true
        }
      },
      gruntfile: {
        src: 'Gruntfile.js'
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Default task.
  grunt.registerTask('default', ['jshint', 'concat', 'copy', 'uglify']);

};
