/* globals document */
const Store = require('electron-store');
const {
  ipcRenderer
} = require('electron');

const getFilters = () => {
  let filters = [];
  if (document) {
    document.querySelectorAll('input[type="checkbox"]:checked').forEach((filter) => filters.push(filter.value.toUpperCase()));
  }
  return filters;
};

const getFolder = () => {
  const folder = store.get('sitecoreLogFolder');
  if (folder) {
    return folder;
  }
  if (document.querySelector('input#log-folder').files) {
    const pathName = document.querySelector('input#log-folder').files[0].path;
    return pathName.substring(0, pathName.lastIndexOf('\\') + 1);
  }
  return null;
};

document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
  checkbox.addEventListener('change', () => {
    const folder = getFolder();
    if (folder) {
      ipcRenderer.send('get-files', { filters: getFilters(), folder });
    }
  });
});

const store = new Store();
document.querySelector('input#log-folder').addEventListener('change', e => {
  const pathName = e.target.files[0].path;
  const folder = pathName.substring(0, pathName.lastIndexOf('\\') + 1);
  store.set('sitecoreLogFolder', folder);
});

ipcRenderer.on('got-files', (event, arg) => {
  document.getElementById('file-list').innerHTML += `<li>${arg}</li>`;
});

const getFiles = () => {
  const pathName = document.querySelector('input#log-folder').files[0].path;
  const folder = pathName.substring(0, pathName.lastIndexOf('\\') + 1);
  const options = {
    filters: getFilters(),
    folder,
  }
}

(function () {
  const folder = store.get('sitecoreLogFolder');
  if (folder) {
    const options = {
      filters: getFilters(),
      folder,
    }
    ipcRenderer.send('get-files', options);
  }
})();
