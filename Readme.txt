Windows FB Messenger
Install node

messenger-app/
├─ main.js
├─ preload.js
├─ package.json
resources├─ alert.mp3         (any short sound replaceable with your own. Still may not work)
├─ icon.ico          (for tray, window, and exe)
├─ node_modules/     (after npm install)

Tray icon with unread red circle badge ✅

Sound notifications ✅

Auto-start toggle ✅

No terminal spam/errors shown in the installed app


How to Use
CMD cd c:/folder

Install dependencies (first time):

npm install


Run in development (with logs):

npm run dev (This will run the app to test make sure there are no errors)
Close app before building.

Build standalone .exe:

npm run build


