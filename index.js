// helper to run a queue of promises
// returns immediately if queue is not full
// this fools the stream into continuing
//
// Behavior:
// 1. immediately return [] until there are no open slots in the queue
// 2. when last slot is taken, return a promise
// 3. when slots free up, resolve promise with one or more results []
//
// Result:
// This function can be flatMapped over with a library like highland.js.
// It will correctly maintain the desired number of parallel tasks, while maintaining
// stream semantics and back pressure.
module.exports = function SlipQueue({max, debug}) {
  max || (max = 10)
  debug || (debug = () => {})
  this.initTime = (new Date).getTime()
  this.processed = 0
  this.inQueue = 0
  this.blocker = null
  this.values = []

  this.add = (promise) => {
    this.inQueue++

    let currentTime = (new Date).getTime()
    let elapsedSeconds = (currentTime - this.initTime) / 1000
    let throughput = (elapsedSeconds / this.processed).toFixed(2)
    let {inQueue, processed} = this
    debug({inQueue, processed, throughput})

    promise.then((value) => {
      this.processed++
      this.inQueue--
      this.values.push(value)
      if (this.blocker) {
        this.blocker.resolve(this.values)
        this.values = []
      }
    })

    promise.catch((error) => {
      this.inQueue--
      if (this.blocker) this.blocker.reject(error)
    })

    if (this.inQueue < max && this.values.length < max) {
      return []
    } else {
      this.blocker = new Deferred
      return this.blocker.promise
    }
  }
}

function Deferred() {
  this.resolve = null
  this.reject = null
  this.promise = new Promise((resolve, reject) => {
    this.resolve = resolve
    this.reject = reject
  })
}
