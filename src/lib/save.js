const fs = require('fs');

/**
 * writes a json object to a directory, ensuring the directory exists before writing
 */
module.exports = (directory, filename, data, escape) => {
  let json = JSON.stringify(data, null, 2);
  if (escape) json = `"${json.replace(/"/g,'\\\"')}"`;

  if (!fs.existsSync(directory)){
    fs.mkdirSync(directory);
  }
  fs.writeFile(`${directory}/${filename}`, json, (err) => {
    if (err) console.error(err);
  });
};