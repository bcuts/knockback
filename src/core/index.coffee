###
  knockback.js 0.18.6
  Copyright (c)  2011-2014 Kevin Malakoff.
  License: MIT (http://www.opensource.org/licenses/mit-license.php)
  Source: https://github.com/kmalakoff/knockback
  Dependencies: Knockout.js, Backbone.js, and Underscore.js (or LoDash.js).
  Optional dependencies: Backbone.ModelRef.js and BackboneORM.
###

# use Parse
(@Backbone = @Parse; @_ = @Parse._) if @Parse

# ensure the client symbols are resolved
if window? and require.shim
  require.shim([
    {symbol: '_', path: 'lodash', alias: 'underscore', optional: true}, {symbol: '_', path: 'underscore'}
    {symbol: 'Backbone', path: 'backbone'}
    {symbol: 'ko', path: 'knockout'}
  ])

module.exports = kb = require('./kb')

# cache local references
if @Parse then (Backbone = kb.Parse = @Parse) else (Backbone = kb.Backbone = require 'backbone')
kb.Collection = Backbone.Collection
kb.Model = Backbone.Object or Backbone.Model
kb.Events = Backbone.Events
kb._ = require 'underscore'
kb.ko = require 'knockout'

# required components
require('./utils')
require('./event-watcher')
require('./store')
require('./factory')
require('./observable')
require('./view-model')
require('./utils')
require('./collection-observable')
require('./orm')
require('./inject')

# optional components
try require('../defaults/default-observable') catch err then {}
try require('../formatting/formatted-observable') catch err then {}
try require('../localization/localized-observable') catch err then {}
try require('../statistics/statistics') catch err then {}
try require('../triggering/triggered-observable') catch err then {}
try require('../validation/validation') catch err then {}

# re-expose modules
kb.modules = {}
kb.modules[component] = require(component) for component in ['underscore', 'backbone', 'knockout']
