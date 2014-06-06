var util = require('util')
  , events = require('events')
  , _ =
    { each : require('lodash.foreach')
    , reduce: require('lodash.reduce')
    , values: require('lodash.values')
    }

/**
* Initialize a new LRU tracker
* [max] - {int} The size in bytes that storage should be limited to
*               Defaults to 5mb because the arbitrary limit appears to be that
*               for localStorage
*/
function LRUTrack (max) {
  this.max = max || 1024 * 1024 * 5

  // Increments/decrements when things are added and removed from the tracker
  this.currentUsage = 0

  // The queue is for tracking what was least recently used
  this.queue = []

  /*
  * This dict is for quickly figuring out if we are tracking a specific key
  * it also stores the content length so we can fix currentUsage when
  * keys are deleted
  */
  this.dict = {}
}

util.inherits(LRUTrack, events.EventEmitter)

/**
* Notify LRU tracker of a new key
* key - {string} The key to track
* contentLength - {int} The size of the content this key represents
*
* return - {bool} If the key was accepted for tracking
*/
LRUTrack.prototype.set = function (key, contentLength) {

  if (contentLength > this.max) return false

  if(!this.dict[key]) {
    this.queue.push(key)
    this.currentUsage += contentLength
  }
  else {
    this.touch(key)
    this.currentUsage = this.currentUsage - this.dict[key] + contentLength
  }

  this.dict[key] = contentLength

  this.trim()

  return true
}

/**
* Notify LRU tracker that a key is no longer needed
* key - {string} The key to stop tracking
*
* return - {bool} True is key was deleted, false if it wasn't being tracked
*/
LRUTrack.prototype.del = function (key) {
  if(this.get(key) === undefined) return false

  this.queue.splice(this.queue.indexOf(key), 1)
  this.currentUsage -= this.dict[key]
  delete this.dict[key]
  return true
}

/**
* Notify LRU tracker that a key was used
* key - {string} The key that was used
*
* return - {bool} False if the key has not been
*                 registered for tracking, true otherwise
*/
LRUTrack.prototype.touch = function (key) {
  var keyIndex = this.queue.indexOf(key)

  if (keyIndex < 0) return false

  // Move the key to the end of the queue
  this.queue.splice(this.queue.indexOf(key), 1)
  this.queue.push(key)

  return true
}

/**
* Returns the content length of a key
* key - {string} The key to get
*/
LRUTrack.prototype.get = function (key) {
  return this.dict[key]
}

/**
* Removes all items from tracking
*/
LRUTrack.prototype.reset = function () {
  var self = this
  _.each(this.queue, function (key) { self.del(key) })

  if(this.currentUsage !== 0) throw new Error('LRUTrack is not consistent')
}

/**
* Disposes keys until the size of data being tracked
* is back within the max limit
*/
LRUTrack.prototype.trim = function () {
  while (this.currentUsage > this.max) {
    var leastestUsed = this.queue[0]
    this.emit('dispose', leastestUsed, this.dict[leastestUsed])
    this.del(leastestUsed)
  }
}

/**
* Returns the size of data being tracked
*/
LRUTrack.prototype.length = function () {
  return this.currentUsage
}

/**
* Returns an array of the size of data being tracked
*/
LRUTrack.prototype.values = function () {
  return _.values(this.dict)
}

/**
* Returns the keys being tracked
*/
LRUTrack.prototype.keys = function () {
  return this.queue
}

module.exports = function (max) {
  return new LRUTrack(max)
}
