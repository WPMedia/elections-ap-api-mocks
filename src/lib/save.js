const fs = require('fs');

/**
 * writes a json object to a directory, ensuring the directory exists before writing
 */
module.exports = (directory, filename, data, escape) => {
  let json = JSON.stringify(data, null, escape ? 0 : 2);
  if (escape) json = `"${json.replace(/"/g,'\\\"')}"`;

  if (!fs.existsSync(directory)){
    fs.mkdirSync(directory);
  }
  fs.writeFileSync(`${directory}/${filename}`, json);
};