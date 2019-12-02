const {
  ipcMain,
} = require('electron');
const chokidar = require('chokidar');
const fs = require('fs');
const rl = require('readline');

const getNewestFile = (files, path) => {
  const out = [];
  files.forEach((file) => {
    const stats = fs.statSync(`${path}\\${file}`);
    if (stats.isFile()) {
      out.push({
        file: `${path}\\${file}`,
        mtime: stats.mtime.getTime(),
      });
    }
  });
  out.sort((a, b) => (
    b.mtime - a.mtime
  ));

  return (out.length > 0) ? out[0].file : '';
};

const getLatestLog = (path) => {
  console.log(path);

  const fullPath = path.substring(0, path.lastIndexOf('\\'));
  console.log(fullPath);

  const files = fs.readdirSync(fullPath);
  return getNewestFile(files.filter((file) => file.indexOf('log') !== -1), fullPath);
};

ipcMain.on('get-files', (event, options) => {
  console.log('inside get-files');
  console.log(options);

  chokidar.watch(options.folder).on('all', (e, path) => {
    if (e === 'add' || e === 'change') {
      const latest = getLatestLog(path);

      if (latest !== path) return;
      const readInterface = rl.createInterface({
        input: fs.createReadStream(path),
      });
      readInterface.on('line', (line) => {
        if (!options.filters) {
          event.sender.send('got-files', line);
        } else if (options.filters.some((filter) => line.indexOf(filter) !== -1)) {
          event.sender.send('got-files', line);
        }
      });
    }
  });
});

(function() {
  console.log('load main');

})();
