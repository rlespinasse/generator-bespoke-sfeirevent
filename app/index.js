'use strict';

var fs = require('fs');
var util = require('util');
var path = require('path');
var generators = require('yeoman-generator');
var chalk = require('chalk');
var sortedObject = require('sorted-object');
var _ = require('lodash');
var execSync = require('child_process').execSync;

var welcome = [
  "",
  chalk.cyan.bold("oooooooooo.                                          oooo                          o8o              "),
  chalk.cyan.bold("`888'   `Y8b                                         `888                          `\"'             "),
  chalk.cyan.bold(" 888     888  .ooooo.   .oooo.o oo.ooooo.   .ooooo.   888  oooo   .ooooo.         oooo  .oooo.o     "),
  chalk.cyan.bold(" 888oooo888' d88' `88b d88(  \"8  888' `88b d88' `88b  888 .8P'   d88' `88b        `888 d88(  \"8   "),
  chalk.cyan.bold(" 888    `88b 888ooo888 `\"Y88b.   888   888 888   888  888888.    888ooo888         888 `\"Y88b.    "),
  chalk.cyan.bold(" 888    .88P 888    .o o.  )88b  888   888 888   888  888 `88b.  888    .o .o.     888 o.  )88b     "),
  chalk.cyan.bold("o888bood8P'  `Y8bod8P' 8\"\"888P'  888bod8P' `Y8bod8P' o888o o888o `Y8bod8P' Y8P     888 8\"\"888P' "),
  chalk.cyan.bold("                                 888                                               888              "),
  chalk.cyan.bold("                                o888o                                          .o. 88P              "),
  chalk.cyan.bold("                                                                               `Y888P               "),
  "",
  chalk.green.bold("Thanks for choosing Bespoke.js for your presentation! :)   -@markdalgleish"),
  ""
].join('\n');

var plugins = [
  { name: 'sfeirevents', version: 'rlespinasse/bespoke-theme-sfeirevents', isTheme: true, priority: 0 },
  { name: 'classes', version: '^1.0.0', priority: 1 },
  { name: 'scale', version: '^1.0.1', configValue: "'transform'", priority: 2 },
  { name: 'nav', version: '^1.0.2', priority: 2 },
  { name: 'overview', version: '^1.0.4', priority: 2 },
  { name: 'bullets', version: '^1.1.0', onlyConfig: true, configValue: "'.build, .build-items > *:not(.build-items)'", priority: 2 },
  { name: 'hash', version: '^1.0.2', priority: 2 },
  { name: 'multimedia', version: '^1.1.0', priority: 2 },
  { name: 'cursor', version: '^1.0.3', configValue: "3000", priority: 2 },
  { name: 'extern', version: '^1.0.0', configValue: "bespoke", priority: 3 },
  { name: 'progress', version: '^1.0.0', priority: 3 },
];

var SCHOOL = 'Sfeir School';
var LUNCH = 'Sfeir Lunch';
var SHARE = 'Ch\'feir Share';

var questions = [
  {
    name: 'eventTemplate',
    message: 'Which event template would you like to use?',
    type: 'list',
    choices: [SCHOOL,LUNCH,SHARE],
    default: SCHOOL
  },
  {
    name: 'title',
    message: 'What is the title of your presentation?',
    default: 'Some Title'
  },
  {
    when: function (response) {
      return response.eventTemplate != SCHOOL;
    },
    name: 'subtitle',
    message: 'What is the subtitle of your presentation?',
    default: 'Some Subtitle'
  },
  {
    when: function (response) {
      return response.eventTemplate == SCHOOL;
    },
    name: 'schoolCode',
    message: 'What is the code of your Sfeir School?',
    default: 'ST'
  },
  {
    when: function (response) {
      return response.eventTemplate == SCHOOL;
    },
    name: 'schoolLevel',
    message: 'Which level is your Sfeir School?',
    type: 'list',
    choices: ['100', '200', '300'],
    default: '200'
  },
  {
    name: 'license',
    message: 'Which license (by identifier) do you want to apply? [see https://spdx.org/licenses]',
    default: 'MIT'
  },
  {
    name: 'useGeneratePdf',
    message: 'Would you need to generate a PDF from your presentation?',
    type: 'confirm',
    default: true
  },
  {
    name: 'useEnsuite',
    message: 'Would you like to have a presenter console for your presentation?',
    type: 'confirm',
    default: true
  },
  {
    name: 'useShowcase',
    message: 'Would you like to have showcase slides in your presentation?',
    type: 'confirm',
    default: true
  },
];

var detectGitRepository = function () {
  let repo;
  if (fs.existsSync('.git/config')) {
    const lines = fs.readFileSync('.git/config', 'utf8').split(/\r?\n/);
    let startIndex = lines.indexOf('[remote "origin"]');
    if (startIndex > -1) {
      lines.slice(startIndex + 1, lines.length).every((line) => {
        if (line.startsWith("\t")) {
          if (line.startsWith("\turl = ")) {
            repo = line.slice(7, line.length).replace(/^git@([^:]+):/, 'https://$1/')
            return
          }
          return true
        }
      })
    }
  }
  return repo
}

module.exports = generators.Base.extend({

  constructor: function () {
    generators.Base.apply(this, arguments);
    this.log(welcome);
  },

  prompting: function () {

    var prompts = questions;

    return this.prompt(prompts).then(function (answers) {

      this.selectedPlugins = _.sortBy(plugins, 'priority');

      this.selectedPlugins.forEach(function (plugin) {
        plugin.varName = _.camelCase(plugin.name);
      });
      
      this.isSchool = answers.eventTemplate == SCHOOL;
      this.isLunch = answers.eventTemplate == LUNCH;
      this.isShare = answers.eventTemplate == SHARE;
      if (this.isSchool) {
        this.schoolCode = answers.schoolCode;
        this.schoolLevel = answers.schoolLevel;
      }
      
      this.eventTemplate = answers.eventTemplate;
      this.license = answers.license;
      this.title = answers.title;

      if (this.isSchool) {
        this.fullTitle = this.title;
        this.packageName = _.kebabCase(this.eventTemplate + '-' + this.title)
      } else {
        this.fullTitle = this.title + ': ' + answers.subtitle;
        this.packageName = _.kebabCase(this.eventTemplate + '-' + this.title + '-' + answers.subtitle)
      }

      this.useGeneratePdf = answers.useGeneratePdf;
      this.useEnsuite = answers.useEnsuite;
      this.useShowcase = answers.useShowcase;
      
    }.bind(this));
  },

  configuring: function () {

    this.template('README.adoc', 'README.adoc');
    this.template('Makefile', 'Makefile');
    this.copy('gulpfile.js', 'gulpfile.js');
    this.copy('_gitignore', '.gitignore');
    this.copy('_editorconfig', '.editorconfig');
    this.copy('Gemfile', 'Gemfile');

    var packageSettings = {
      name: this.packageName,
      version: '1.0.0',
      license: this.license
    };

    var gitRepoUrl = detectGitRepository();
    if (gitRepoUrl) {
      packageSettings['repository'] = {
        type: 'git',
        url: gitRepoUrl
      };
    }

    var devDependencies = {
      'bespoke': '^1.1.0',
      'browserify': '^14.4.0',
      'del': '^3.0.0',
      'gh-pages': '^1.0.0',
      "git-rev-sync": "^1.8.0",
      'gulp': '^3.9.1',
      // hold back gulp-autoprefixer as latest release requires Node 4.5
      'gulp-autoprefixer': '^3.1.1',
      'gulp-connect': '^5.0.0',
      'gulp-csso': '^3.0.0',
      "gulp-exec": "^2.1.2",
      'gulp-plumber': '^1.1.0',
      'gulp-rename': '^1.2.2',
      'gulp-stylus': '^2.6.0',
      'gulp-uglify': '^3.0.0',
      "gulp-uglify-es": "^0.1.3",
      'gulp-util': '^3.0.8',
      'normalizecss': '^3.0.0',
      'through': '^2.3.8',
      'vinyl-buffer': '^1.0.0',
      'vinyl-source-stream': '^1.1.0',
    };

    if (this.useGeneratePdf) {
      devDependencies['decktape'] = '^2.9.1';
    }

    this.selectedPlugins.forEach(function (plugin) {
      devDependencies['bespoke-' + (plugin.isTheme ? 'theme-':'') + plugin.name] = plugin.version;
    });

    packageSettings.devDependencies = sortedObject(devDependencies);

    packageSettings.engines = { 'node': '>=4.2.0' }

    this.fs.writeJSON(this.destinationPath('package.json'), packageSettings);
  },

  writing: function () {

    this.template('src/index.adoc', 'src/index.adoc');

    this.copy('src/images/speakers/speaker-480x480.jpg', 'src/images/speakers/speaker-480x480.jpg');

    this.copy('src/scripts/bespoke-bullets-patched.js', 'src/scripts/bespoke-bullets-patched.js');
    this.template('src/scripts/main.js', 'src/scripts/main.js');

    this.copy('src/styles/main.styl', 'src/styles/main.styl');
    this.copy('src/styles/user.styl', 'src/styles/user.styl');

    if (this.useEnsuite) {
      this.template('src/presenter.adoc', 'src/presenter.adoc');
      this.copy('src/scripts/ensuite-protocol-bespoke.js', 'src/scripts/ensuite-protocol-bespoke.js');
    }

    if (this.useShowcase) {
      this.copy('src/images/showcase/mountain.jpg', 'src/images/showcase/mountain.jpg');
      this.copy('src/images/showcase/road.jpg', 'src/images/showcase/road.jpg');
      this.copy('src/images/showcase/sfeir_institute.png', 'src/images/showcase/sfeir_institute.png');
      this.copy('src/images/showcase/sfeir_school.png', 'src/images/showcase/sfeir_school.png');
    }
  },

  install: function () {
    if (!this.options['skip-install']) {
      try {
        console.log([
          'I\'m running ' +
          chalk.yellow.bold('yarn') +
          ' for you to install the required Node modules.',
          'If this fails, try running the command yourself.',
          ''
        ].join('\n'));
        execSync('yarn', { stdio: [0, 1, 2] });
      }
      catch (e) {
        var warning = [
          '',
          chalk.red.bold('Failed to install the required Node modules. Try running these commands yourself:'),
          chalk.cyan.bold('type yarn || npm install -g yarn'),
          chalk.cyan.bold('yarn'),
          ''
        ].join('\n');
        console.warn(warning);
      }

      try {
        console.log([
          'I\'m also running ' +
          chalk.yellow.bold('bundle --path=.bundle/gems') +
          ' for you to install the required Ruby gems.',
          'If this fails, try running the command yourself.',
          ''
        ].join('\n'));
        execSync('bundle --path=.bundle/gems', { stdio: [0, 1, 2] });
      }
      catch (e) {
        var warning = [
          '',
          chalk.red.bold('Failed to install the required Ruby gems. Try running these commands yourself:'),
          chalk.cyan.bold('bundle version || gem install bundler'),
          chalk.cyan.bold('bundle --path=.bundle/gems'),
          ''
        ].join('\n');
        console.warn(warning);
      }
    }
    else {
      console.log([
        'Also run ' +
        chalk.yellow.bold('yarn') +
        ' to install the required Node modules and ',
        chalk.yellow.bold('bundle --path=.bundle/gems') +
        ' to install the required Ruby gems.',
        ''
      ].join('\n'));
    }
  }
});
