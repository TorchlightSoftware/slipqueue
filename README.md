# Slipqueue

This was made to solve a gap in Highland.js - namely to run a number of promises in parallel as a part of stream processing.

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
