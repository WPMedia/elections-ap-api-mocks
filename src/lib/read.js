const fs = require('fs');
const readline = require('readline');

/**
 * Reads a file line-by-line calling worker(line) for each.
 * Returns a promise that resolves when the entire file has been read.
 * @param file
 * @param skipHeader
 * @param worker
 * @returns {Promise<any>}
 */
module.exports = (file, skipHeader, worker) => {
  let isFirst = skipHeader;
  return new Promise(function (fulfill, reject){
    readline
      .createInterface({input: fs.createReadStream(file)})
      .on('line', (line) => {
        if (isFirst) {
          isFirst = false;
          return;
        }
        worker(line);
      })
      .on('close', fulfill)
      .on('error', reject);
  });
};