const path = require('path');
const { app, BrowserWindow } = require('electron');
const { ipcMain } = require('electron');
const chokidar = require('chokidar');
const fs = require('fs');
const rl = require('readline');

const debug = /--debug/.test(process.argv[2]);

if (process.mas) app.setName('Electron APIs');

let mainWindow = null;

function makeSingleInstance() {
  if (process.mas) return;

  app.requestSingleInstanceLock();

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function initialize() {
  makeSingleInstance();

  function createWindow() {
    const windowOptions = {
      width: 800,
      height: 600,
      title: app.getName(),
      webPreferences: {
        nodeIntegration: true,
        // preload: path.join(__dirname, 'preload.js'),
      },
    };

    if (process.platform === 'linux') {
      windowOptions.icon = path.join(__dirname, '/assets/app-icon/png/512.png')
    }

    mainWindow = new BrowserWindow(windowOptions);
    mainWindow.loadURL(path.join('file://', __dirname, '/index.html'))

    // Launch fullscreen with DevTools open, usage: npm run debug
    if (debug) {
      mainWindow.webContents.openDevTools();
      mainWindow.maximize();
      require('devtron').install();
    }

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  app.on('ready', () => {
    createWindow();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
}

initialize();

const getNewestFile = (files, filesPath) => {
  const out = [];
  files.forEach((file) => {
    const stats = fs.statSync(`${filesPath}\\${file}`);
    if (stats.isFile()) {
      out.push({
        file: `${filesPath}\\${file}`,
        mtime: stats.mtime.getTime(),
      });
    }
  });
  out.sort((a, b) => (
    b.mtime - a.mtime
  ));

  return (out.length > 0) ? out[0].file : '';
};

const getLatestLog = (filesPath) => {
  const fullPath = filesPath.substring(0, filesPath.lastIndexOf('\\'));

  const files = fs.readdirSync(fullPath);
  return getNewestFile(files.filter((file) => file.indexOf('log') !== -1), fullPath);
};

ipcMain.on('get-files', (event, options) => {
  chokidar.watch(options.folder).on('all', (e, filesPath) => {
    if (e === 'add' || e === 'change') {
      const latest = getLatestLog(filesPath);

      if (latest !== filesPath) return;

      const readInterface = rl.createInterface({
        input: fs.createReadStream(filesPath),
      });
      let lineNumber = 0;
      readInterface.on('line', (line) => {
        if (!options.filters) {
          event.sender.send('got-files', { line, lineNumber });
        } else if (options.filters.some((filter) => line.indexOf(filter) !== -1)) {
          event.sender.send('got-files', { line, lineNumber });
        }
        lineNumber += 1;
      });
    }
  });
});
