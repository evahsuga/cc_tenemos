const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  testAction: () => ipcRenderer.invoke('test-action'),
  runColorMe: (orderId) => ipcRenderer.invoke('run-coloreme', orderId),
  runYayoi: (customerCode) => ipcRenderer.invoke('run-yayoi', customerCode),
  runColorMeDownload: () => ipcRenderer.invoke('run-coloreme-download'),
  runYayoiCustomerImport: () => ipcRenderer.invoke('run-yayoi-customer-import'),
  runYayoiSalesImport: () => ipcRenderer.invoke('run-yayoi-sales-import')
});
