import { getDueSubscriptions, createSubscriptionOccurrence } from './storage';

/**
 * Process all due subscriptions and create new transaction occurrences
 * This should be called when the app starts to ensure subscriptions are up-to-date
 */
export const processSubscriptions = async (): Promise<number> => {
  try {
    console.log('🔄 Processing due subscriptions...');

    const dueSubscriptions = await getDueSubscriptions();

    if (dueSubscriptions.length === 0) {
      console.log('✅ No due subscriptions to process');
      return 0;
    }

    console.log(`📅 Found ${dueSubscriptions.length} due subscription(s)`);

    let processed = 0;

    for (const subscription of dueSubscriptions) {
      try {
        // Create a new occurrence for this subscription
        await createSubscriptionOccurrence(subscription.id);
        processed++;
        console.log(`✓ Processed subscription: ${subscription.item_name || subscription.category?.name}`);
      } catch (error) {
        console.error(`✗ Error processing subscription ${subscription.id}:`, error);
      }
    }

    console.log(`✅ Processed ${processed} of ${dueSubscriptions.length} subscriptions`);
    return processed;
  } catch (error) {
    console.error('❌ Error in processSubscriptions:', error);
    return 0;
  }
};

/**
 * Check if there are any overdue subscriptions (for notifications or alerts)
 */
export const hasOverdueSubscriptions = async (): Promise<boolean> => {
  try {
    const dueSubscriptions = await getDueSubscriptions();
    return dueSubscriptions.length > 0;
  } catch (error) {
    console.error('Error checking overdue subscriptions:', error);
    return false;
  }
};
