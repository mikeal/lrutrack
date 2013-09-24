var util = require('util')
  , events = require('events')
  ;
var _ =
  { each : require('lodash.foreach')
  , reduce: require('lodash.reduce')
  , values: require('lodash.values')
  }

function LRUTrack (max) {
  this.max = max || 1024 * 1000 * 99
  this.arr = []
  this.dict = {}
}
util.inherits(LRUTrack, events.EventEmitter)
LRUTrack.prototype.set = function (key, value) {
  if (value > this.max) return false
  this.del(key)
  this.arr.push(key)
  this.dict[key] = value
  this.trim()
  return true
}
LRUTrack.prototype.del = function (key) {
  if (this.arr.indexOf(key) !== -1) {
    this.arr.splice(this.arr.indexOf(key), 1)
  }
  delete this.dict[key]
}
LRUTrack.prototype.touch = function (key) {
  var val = this.get(key)
  if (!val) return false
  this.set(key, val)
  return true
}
LRUTrack.prototype.get = function (key) {
  return this.dict[key]
}
LRUTrack.prototype.reset = function () {
  var self = this
  _.each(this.arr, function (key) { self.del(key) })
}
LRUTrack.prototype.trim = function () {
  var key
  while (this.length() > this.max) {
    key = this.arr.shift()
    if (key === undefined) return console.log('fuck')
    this.del(key)
    this.emit('dispose', key, this.dict[key])
  }
}
LRUTrack.prototype.length = function () {
  return _.reduce(this.values(), function (x,y) {return x+y}, 0)
}
LRUTrack.prototype.values = function () {
  return _.values(this.dict)
}
LRUTrack.prototype.keys = function () {
  return this.arr
}

module.exports = function (max) { return new LRUTrack(max) }