import PushReceiver from "@hieuht/push-receiver";
import { ipcMain } from "electron";
import Store from "electron-store";
import {
  START_NOTIFICATION_SERVICE,
  NOTIFICATION_SERVICE_STARTED,
  NOTIFICATION_SERVICE_ERROR,
  NOTIFICATION_RECEIVED,
  TOKEN_UPDATED,
} from "./constants";

const store = new Store();

let receiver;
let stopListeningToCredentials;
let stopListeningToNotifications;

// To be sure that start is called only once
let started = false;

// To be call from the main process
function setup(webContents) {
  // Will be called by the renderer process
  ipcMain.on(START_NOTIFICATION_SERVICE, async (_, senderId) => {
    // Retrieve saved credentials
    let credentials = store.get("credentials");
    // Retrieve saved senderId
    const savedSenderId = store.get("senderId");
    if (started) {
      webContents.send(NOTIFICATION_SERVICE_STARTED, ((credentials && credentials.fcm) || {}).token);
      return;
    }

    try {
      // Retrieve saved persistentId : avoid receiving all already received notifications on start
      const persistentIds = store.get("persistentIds") || [];
      // Register if no credentials or if senderId has changed

      if (!credentials || savedSenderId !== senderId) {
        receiver = new PushReceiver({
          senderId: senderId,
          persistentIds, // Recover stored ids of all previous notifications
        });

        stopListeningToCredentials = receiver.onCredentialsChanged(({ oldCredentials, newCredentials }) => {
          // Save credentials for later use
          store.set("credentials", newCredentials);

          // Notify the renderer process that the FCM token has changed
          webContents.send(TOKEN_UPDATED, newCredentials.fcm.token);
        });

        stopListeningToNotifications = receiver.onNotification((notification) => {
          // Do something with the notification
          // Notify the renderer process that a new notification has been received
          // And check if window is not destroyed for darwin Apps
          if (!webContents.isDestroyed()) {
            webContents.send(NOTIFICATION_RECEIVED, notification);
          }
        });

        await receiver.connect();

        // Save senderId
        store.set("senderId", senderId);

        started = true;
      }
    } catch (e) {
      console.error("PUSH_RECEIVER:::Error while starting the service", e);
      // Forward error to the renderer process
      webContents.send(NOTIFICATION_SERVICE_ERROR, e.message);
    }
  });
}

// Called in the disconnect
function reset() {
  store.set("credentials", null);
  store.set("senderId", null);
  store.set("persistentIds", null);
  started = false;

  if (stopListeningToCredentials) {
    stopListeningToCredentials();
  }

  if (stopListeningToNotifications) {
    stopListeningToNotifications();
  }

  if (receiver) {
    receiver.destroy();
  }
}

export {
  START_NOTIFICATION_SERVICE,
  NOTIFICATION_SERVICE_STARTED,
  NOTIFICATION_SERVICE_ERROR,
  NOTIFICATION_RECEIVED,
  TOKEN_UPDATED,
  setup,
  reset,
};
