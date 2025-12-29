const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  testAction: () => ipcRenderer.invoke('test-action'),
  runColorMe: (orderId) => ipcRenderer.invoke('run-coloreme', orderId),
  runYayoi: (customerCode) => ipcRenderer.invoke('run-yayoi', customerCode)
});
