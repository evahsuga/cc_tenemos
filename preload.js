const { contextBridge, ipcRenderer } = require('electron');

console.log('✅ preload.js が読み込まれました - Step 7対応版');

const apiObject = {
  testAction: () => ipcRenderer.invoke('test-action'),
  runColorMe: (orderId) => ipcRenderer.invoke('run-coloreme', orderId),
  runYayoi: (customerCode) => ipcRenderer.invoke('run-yayoi', customerCode),
  runColorMeDownload: () => ipcRenderer.invoke('run-coloreme-download'),
  runYayoiCustomerImport: () => ipcRenderer.invoke('run-yayoi-customer-import'),
  runYayoiSalesImport: () => ipcRenderer.invoke('run-yayoi-sales-import')
};

console.log('📋 定義するAPIオブジェクト:', Object.keys(apiObject));

contextBridge.exposeInMainWorld('api', apiObject);

console.log('✅ window.api に公開しました');

// 定義後、実際に確認
setTimeout(() => {
  console.log('🔍 window.apiの内容を確認:', Object.keys(window.api || {}));
  console.log('🔍 runYayoiSalesImport存在?', typeof window.api?.runYayoiSalesImport);
}, 100);
