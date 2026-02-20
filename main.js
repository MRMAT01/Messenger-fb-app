const { app, BrowserWindow, Tray, Menu, nativeImage, Notification, ipcMain } = require('electron');
const path = require('path');
const Jimp = require('jimp');
const { execFile } = require('child_process');

let win;
let tray;
let lastUnread = 0;
let autoStartEnabled = false;

const ICON_PATH = path.join(__dirname, 'icon.ico');

// Alert sound path for dev and installed app
const ALERT_SOUND = app.isPackaged
  ? path.join(process.resourcesPath, 'alert.mp3') // installed
  : path.join(__dirname, 'alert.mp3');            // dev

// -------------------------
// Create Messenger Window
// -------------------------
function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 800,
    autoHideMenuBar: true,
    backgroundColor: '#1e1e1e',
    icon: ICON_PATH,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.webContents.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
  );

  win.loadURL('https://www.messenger.com');

  win.on('minimize', (event) => {
    event.preventDefault();
    win.hide();
  });
}

// -------------------------
// Tray Icon + Badge
// -------------------------
async function updateTrayIcon(unread) {
  try {
    if (unread === 0) {
      tray.setImage(nativeImage.createFromPath(ICON_PATH));
      tray.setToolTip('Messenger');
      return;
    }

    const iconBuffer = nativeImage.createFromPath(ICON_PATH).toPNG();
    const image = await Jimp.read(iconBuffer);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    const text = unread > 99 ? '99+' : unread.toString();

    const circle = new Jimp(50, 50, 0xFF0000FF);
    image.composite(circle, image.bitmap.width - 50, 0);
    image.print(font, image.bitmap.width - 48, 2, text);

    const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
    tray.setImage(nativeImage.createFromBuffer(buffer));
    tray.setToolTip(`Messenger - ${unread} unread`);
  } catch (e) {
    console.error('Tray icon update failed:', e);
  }
}

function createTray() {
  tray = new Tray(nativeImage.createFromPath(ICON_PATH));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Messenger', click: () => win.show() },
    {
      label: 'Start with Windows',
      type: 'checkbox',
      checked: autoStartEnabled,
      click: (menuItem) => {
        autoStartEnabled = menuItem.checked;
        app.setLoginItemSettings({ openAtLogin: autoStartEnabled, path: process.execPath });
      }
    },
    { label: 'Quit', click: () => app.quit() }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Messenger');
  tray.on('double-click', () => win.show());
}

// -------------------------
// IPC: Unread count + notifications
// -------------------------
ipcMain.on('unread-count', async (event, count) => {
  if (count > lastUnread) {
    // Play alert sound silently (hidden PowerShell window)
    execFile('powershell', [
      '-WindowStyle', 'Hidden', '-NoProfile', '-c',
      `(New-Object Media.SoundPlayer '${ALERT_SOUND}').PlaySync();`
    ], { windowsHide: true }, (err) => {
      if (err) console.log('Sound error:', err);
    });

    // Show desktop notification
    new Notification({
      title: 'Messenger',
      body: `You have ${count} unread message(s)`
    }).show();
  }

  lastUnread = count;
  await updateTrayIcon(count);
});

// -------------------------
// App ready
// -------------------------
app.whenReady().then(() => {
  createTray();
  createWindow();
});

// -------------------------
// Quit / activate
// -------------------------
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });