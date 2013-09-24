var lru = require('./')
  , assert = require('assert')
  ;

var test = lru(1000)

test.set('test1', 500)
test.touch('test1')
test.set('test2', 450)
test.touch('test1')
test.set('test3', 450)
test.touch('test1')
test.set('test4', 450)

assert.deepEqual(test.keys(), ['test1', 'test4'])

console.log('works.')