const {
  ipcMain
} = require('electron');
const chokidar = require('chokidar');
const fs = require('fs');
const rl = require('readline');

const getNewestFile = (files, path) => {
  var out = [];
  files.forEach(function(file) {
      var stats = fs.statSync(path + '\\' + file);
      if(stats.isFile()) {
          out.push({"file":path + '\\' + file, "mtime": stats.mtime.getTime()});
      }
  });
  out.sort(function(a,b) {
      return b.mtime - a.mtime;
  })

  return (out.length>0) ? out[0].file : "";
}

const getLatestLog = (path) => {
  const fullPath = path.substring(0, path.lastIndexOf('\\'));
  const files = fs.readdirSync(fullPath);
  return getNewestFile(files.filter(file => file.indexOf('log') !== -1), fullPath);
}

ipcMain.on('get-files', (event, filters) => {
  chokidar.watch('C:\\temp\\log*').on('all', (e, path) => {
    if (e === 'add' || e === 'change') {
      const latest = getLatestLog(path);

      if (latest !== path) return;
      const readInterface = rl.createInterface({
        input: fs.createReadStream(path),
      });
      readInterface.on('line', (line) => {
        if (!filters) {
          event.sender.send('got-files', line);
        } else if (filters.some(filter => line.indexOf(filter) !== -1)) {
          event.sender.send('got-files', line);
        }
      })
    }
  });
});