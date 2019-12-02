/* globals document */
const Store = require('electron-store');
const { ipcRenderer } = require('electron');

const store = new Store();

const getFilters = () => {
  const filters = [];
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
  if (document.querySelector('input#log-folder').files && document.querySelector('input#log-folder').files.length > 0) {
    const pathName = document.querySelector('input#log-folder').files[0].path;
    return pathName.substring(0, pathName.lastIndexOf('\\') + 1);
  }
  return null;
};

document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
  checkbox.addEventListener('change', () => {
    const folder = getFolder();
    if (folder) {
      const filters = getFilters();
      store.set('logFilters', filters.toString());
      ipcRenderer.send('get-files', { filters, folder });
    }
  });
});

document.querySelector('input#log-folder').addEventListener('change', e => {
  const pathName = e.target.files[0].path;
  const folder = pathName.substring(0, pathName.lastIndexOf('\\') + 1);
  store.set('sitecoreLogFolder', folder);
});

const folder = store.get('sitecoreLogFolder');
const filtersStore = store.get('logFilters');
if (folder && filtersStore && filtersStore.length > 0) {
  const filters = filtersStore.split(',');
  filters.forEach((filter) => {
    document.querySelector(`input[type="checkbox"][value="${filter.toLowerCase()}"]`).checked = true;
  });
  const options = {
    filters,
    folder,
  };
  ipcRenderer.send('get-files', options);
}

ipcRenderer.on('got-files', (event, args) => {
  document.getElementById('file-list').innerHTML += `<li>${args.line}</li>`;
});
