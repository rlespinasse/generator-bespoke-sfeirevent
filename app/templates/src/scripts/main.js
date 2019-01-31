// Require Node modules in the browser thanks to Browserify: http://browserify.org
var bespoke = require('bespoke');
var bullets = require('./bespoke-bullets-patched');
<% if (useEnsuite) { -%>
var ensuite = require('./ensuite-protocol-bespoke');
<% } -%>

<%- selectedPlugins.map(function (plugin) {
  return (plugin.onlyConfig ? '':'var ' + plugin.varName + " = require('bespoke-" + (plugin.isTheme ? 'theme-':'') + plugin.name + "');");
}).join('\n'); %>

// Bespoke.js
bespoke.from({ parent: 'article.deck', slides: 'section' }, [
<%- selectedPlugins.map(function (plugin) {
  return '  ' + plugin.varName + '(' + (plugin.configValue || '') + ')';
}).join(',\n') %>,
<% if (useEnsuite) { -%>
  (/(^\?|&)ensuite(?=$|&)/.test(window.location.search) ? ensuite() : () => {})
<% } -%>
]);
