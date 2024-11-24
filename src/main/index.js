import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';

import { validateGithubRepo } from './helpers';

console.log(join(app.getPath('userData'), 'db.sqlite'));

// const sequelize = new Sequelize({
//   dialect: 'sqlite',
//   storage: join(app.getPath('userData'), 'db.sqlite')
// });

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  //   class User extends Model {}
  //   User.init(
  //     {
  //       // Model attributes are defined here
  //       firstName: {
  //         type: DataTypes.STRING,
  //         allowNull: false
  //       }
  //     },
  //     {
  //       sequelize,
  //       modelName: 'User'
  //     }
  //   );
  //   await sequelize.sync();

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  ipcMain.on('ping', () => console.log('pong'));

  ipcMain.handle('validateRepo', async (_event, repoInfo) => {
    console.log('validating repo: ' + repoInfo);
    return validateGithubRepo(repoInfo);
  });

  // ipcMain.handle('getUsers', async (_event) => {
  //   console.log('find users');
  //   return User.findAll();
  // });

  // ipcMain.handle('addUser', async (_event, username) => {
  //   console.log('add users');
  //   const testUser = { firstName: username };
  //   return User.create(testUser);
  // });

  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', async () => {
  // sequelize.close().then(() => console.log('connection closed'));
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
