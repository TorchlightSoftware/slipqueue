# Slipqueue

This was made to solve a gap in Highland.js - namely to run a number of promises in parallel as a part of stream processing.

Highland JS lets you wrap promises and integrate them into a stream - however in the normal behavior this would result in each promise being fully processed before backpressure resolves and the next promise is allowed to execute.  SlipQueue lets you get around that and achieve parallel processing.

Usage:

```js
const H = require('highland')
const SlipQueue = require('slipqueue')

const queue = new SlipQueue({max: 4, debug: console.log})

const addTwo = (n) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(n+2), 100)
  })
}

H([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  .flatMap((n) => H(queue.add(
    addTwo(n)
  )))
  .done(() => {
    console.log('Yay! Finished.')
  })
```

## How it works

The key to using slipqueue is to wrap it in flatMap.  Each time queue.add() is called, it returns either a resolved Promise or an outstanding Promise.

SlipQueue internally keeps track of how many outstanding Promises it has, and if it does not exceed the match, it will keep returning resolved Promises, signalling the stream to continue sending data.

However, when SlipQueue becomes full it will return an unresolved promise, signaling the stream to pause in sending data.  The promise will be resolved when at least one of the internal tasks completes, moving the queue count back under the max.  When the promise resolves, the stream is signaled to continue sending data.
