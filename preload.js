const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {});

// Poll Messenger every 5 seconds for unread messages
setInterval(() => {
  try {
    // Look for Messenger badge counters
    // Messenger puts unread counts inside span elements with aria-label or specific role
    let count = 0;

    // Try to find notification badge elements
    const badges = document.querySelectorAll('[aria-label*="unread"], [data-testid="messenger_unread_count"]');
    badges.forEach(el => {
      const n = parseInt(el.innerText.replace(/\D/g, '')); // remove non-digits
      if (!isNaN(n)) count += n;
    });

    // Send the total unread count to main process
    ipcRenderer.send('unread-count', count);
  } catch(e) {
    // Ignore errors from DOM changes
    //console.error('Unread check failed:', e);
  }
}, 5000);