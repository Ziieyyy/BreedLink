# Push Notifications Implementation Guide

## Overview
Push notifications have been implemented in BreedLink with a toggle control in settings. Users can enable/disable notifications at any time.

## Features Implemented

### 1. Settings Toggle
- Located in **Settings > Notifications > Push Notifications**
- Toggle switch to enable/disable push notifications
- Persists user preference using AsyncStorage
- Shows confirmation alerts when toggling

### 2. Notification Service
File: `utils/notificationService.ts`

**Key Functions:**
- `enablePushNotifications()` - Requests permissions and registers device
- `disablePushNotifications()` - Disables notifications and removes token
- `areNotificationsEnabled()` - Checks if notifications are enabled
- `scheduleLocalNotification()` - Sends immediate local notification

### 3. Notification Examples
File: `utils/notificationExamples.ts`

Pre-built functions for common scenarios:
- Match notifications
- Message notifications
- Vaccination reminders
- Agreement notifications
- Profile updates

## How to Use

### In Any Component

```typescript
import { sendMatchNotification } from '../utils/notificationExamples';

// Send notification when match is found
await sendMatchNotification('Fluffy', 'Whiskers');
```

### Example: In cat-profile-search.tsx

```typescript
import { sendMatchNotification } from '../utils/notificationExamples';

const handleSwipeRight = async (cat) => {
  // Your matching logic...
  
  // Send notification
  await sendMatchNotification(myCat.name, cat.name);
};
```

### Example: In breed-chat-list.tsx

```typescript
import { sendMessageNotification } from '../utils/notificationExamples';

const onNewMessage = async (senderName: string, message: string) => {
  await sendMessageNotification(senderName, message);
};
```

### Example: In vaccination-update.tsx

```typescript
import { sendVaccinationReminder } from '../utils/notificationExamples';

const scheduleReminder = async () => {
  await sendVaccinationReminder(
    catName,
    vaccinationType,
    dueDate
  );
};
```

## Configuration

### Update Project ID
In `utils/notificationService.ts`, update this line with your Expo project ID:

```typescript
projectId: 'your-expo-project-id', // Replace with actual project ID
```

You can find your project ID in:
- `app.json` under `expo.extra.eas.projectId`
- Expo dashboard at expo.dev

### Database Setup (Optional)
To store push tokens in Supabase, add a column to the `owner` table:

```sql
ALTER TABLE owner ADD COLUMN push_token TEXT;
```

## Testing Notifications

### 1. Enable Notifications
1. Open the app
2. Go to Settings
3. Toggle "Push Notifications" ON
4. You should receive a test notification

### 2. Send Test Notification
Add this button to any screen for testing:

```typescript
import { scheduleLocalNotification } from '../utils/notificationService';

<TouchableOpacity onPress={() => 
  scheduleLocalNotification('Test', 'This is a test notification')
}>
  <Text>Send Test Notification</Text>
</TouchableOpacity>
```

## Important Notes

### Permissions
- Notifications require user permission
- On first toggle, the app requests permission
- If denied, user must enable in device settings

### Physical Device Required
- Push notifications don't work in simulators
- Test on a real device for best results

### Platform-Specific Setup

**Android:**
- Notifications work out of the box with Expo
- Custom sound and vibration patterns configured

**iOS:**
- Requires Apple Developer account for production
- Works in development with Expo Go

## Notification Flow

```
User toggles ON in Settings
  ↓
Request permission from device
  ↓
Get Expo push token
  ↓
Save token to AsyncStorage & Database
  ↓
App can now send notifications
  ↓
User toggles OFF in Settings
  ↓
Remove token from database
  ↓
Notifications disabled
```

## Troubleshooting

### Notifications not showing?
1. Check if toggle is ON in Settings
2. Verify device permissions (Settings > BreedLink > Notifications)
3. Ensure you're testing on a physical device
4. Check console for error messages

### Token not saving?
1. Verify Supabase connection
2. Check if `push_token` column exists in `owner` table
3. Ensure user is logged in

### Permission denied?
User must manually enable in device settings:
- **iOS:** Settings > BreedLink > Notifications
- **Android:** Settings > Apps > BreedLink > Notifications

## Next Steps

1. **Server-side notifications:** Set up a backend service to send push notifications from server
2. **Scheduled notifications:** Implement scheduled reminders for vaccinations
3. **Rich notifications:** Add images and action buttons
4. **Notification categories:** Group notifications by type
5. **Badge counter:** Show unread notification count on app icon

## Resources

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Push Notification Service](https://expo.dev/notifications)
- [Testing Push Notifications](https://docs.expo.dev/push-notifications/testing/)
