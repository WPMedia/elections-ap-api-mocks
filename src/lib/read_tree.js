const fs = require('fs')
const path = require('path')
const read = require('./read')

/**
 * Iterates a directory of files, reading them in order, line by line.
 * Returns a promise that resolves when all files have been read.
 *
 * Callback: Processor(filename, line) {}
 *
 * @param directory
 * @param processor
 */
module.exports = (directory, skipHeader, processor) => {
  // start with an empty promise
  let promise = Promise.resolve({})
  const files = fs.readdirSync(directory)

  files.forEach(file => {
    const filePath = path.join(directory, file)
    // chain each read promise so they execute in order
    promise = promise.then(() => {
      return read(filePath,skipHeader,line => {
        processor(filePath,line)
      })
    })
  })
  return promise
}
