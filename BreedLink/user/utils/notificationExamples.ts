/**
 * Example functions showing how to send notifications in different scenarios
 * Import these functions in your components and call them when needed
 */

import { scheduleLocalNotification, areNotificationsEnabled } from './notificationService';

/**
 * Send a notification when a new match is found
 */
export async function sendMatchNotification(catName: string, matchName: string) {
  const enabled = await areNotificationsEnabled();
  if (!enabled) return;

  await scheduleLocalNotification(
    '🐱 New Match Found!',
    `${catName} has a potential match with ${matchName}`,
    { type: 'match', catName, matchName }
  );
}

/**
 * Send a notification when a new message is received
 */
export async function sendMessageNotification(senderName: string, messagePreview: string) {
  const enabled = await areNotificationsEnabled();
  if (!enabled) return;

  await scheduleLocalNotification(
    `💬 New message from ${senderName}`,
    messagePreview,
    { type: 'message', senderName }
  );
}

/**
 * Send a notification for vaccination reminder
 */
export async function sendVaccinationReminder(catName: string, vaccineName: string, dueDate: string) {
  const enabled = await areNotificationsEnabled();
  if (!enabled) return;

  await scheduleLocalNotification(
    '💉 Vaccination Reminder',
    `${catName} is due for ${vaccineName} on ${dueDate}`,
    { type: 'vaccination', catName, vaccineName, dueDate }
  );
}

/**
 * Send a notification when breeding agreement is ready
 */
export async function sendAgreementNotification(catName: string) {
  const enabled = await areNotificationsEnabled();
  if (!enabled) return;

  await scheduleLocalNotification(
    '📄 Agreement Ready',
    `The breeding agreement for ${catName} is ready to review`,
    { type: 'agreement', catName }
  );
}

/**
 * Send a notification for profile updates
 */
export async function sendProfileUpdateNotification(message: string) {
  const enabled = await areNotificationsEnabled();
  if (!enabled) return;

  await scheduleLocalNotification(
    '✅ Profile Updated',
    message,
    { type: 'profile' }
  );
}

/**
 * Example: How to use in your components
 * 
 * ```typescript
 * import { sendMatchNotification } from '../utils/notificationExamples';
 * 
 * // In your component when a match is found:
 * const handleMatchFound = async () => {
 *   // Your matching logic here...
 *   
 *   // Send notification
 *   await sendMatchNotification('Fluffy', 'Whiskers');
 * };
 * ```
 */
