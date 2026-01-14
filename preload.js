const { contextBridge, ipcRenderer } = require('electron');

console.log('✅ preload.js が読み込まれました - Step 7対応版 v2');

const apiObject = {
  testAction: () => ipcRenderer.invoke('test-action'),
  runColorMe: (orderId) => ipcRenderer.invoke('run-coloreme', orderId),
  runYayoi: (customerCode) => ipcRenderer.invoke('run-yayoi', customerCode),
  runColorMeDownload: () => ipcRenderer.invoke('run-coloreme-download'),
  runYayoiCustomerImport: () => ipcRenderer.invoke('run-yayoi-customer-import'),
  runYayoiSalesImport: () => ipcRenderer.invoke('run-yayoi-sales-import')
};

console.log('📋 定義するAPIオブジェクト:', Object.keys(apiObject));
console.log('📋 API数:', Object.keys(apiObject).length);

contextBridge.exposeInMainWorld('api', apiObject);

console.log('✅ contextBridge.exposeInMainWorld 実行完了');
