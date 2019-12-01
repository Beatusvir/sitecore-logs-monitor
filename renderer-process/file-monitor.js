const {
  ipcRenderer
} = require('electron')

const getFilters = () => {
  let filters = [];
  if (document) {
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(filter => filters.push(filter.toUpperCase()));
  }
  return filters;
}

document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
  checkbox.addEventListener('change', (e) => {
    ipcRenderer.send('get-files', getFilters);
  });
})


ipcRenderer.send('get-files', getFilters);
ipcRenderer.on('got-files', (event, arg) => {
  document.getElementById('file-list').innerHTML += `<li>${arg}</li>`;
});