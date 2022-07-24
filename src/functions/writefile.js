const fs = require('fs')

const write = (filename, data) => {
  try {
    let file = fs.readFileSync(`./src/database/${filename}`, 'utf-8');
    const fileJSON = JSON.parse(file);
    
    fileJSON.push(data);
    file = JSON.stringify(fileJSON);
    fs.writeFileSync(`./src/database/${filename}`, file, 'utf-8');
  } catch(err) {
    console.log(err.message)
  }
}

module.exports = {
  write,
}
