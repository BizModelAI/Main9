import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

async function testStripeKey() {
  console.log('🔍 Testing Stripe Key...\n');
  
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeKey) {
    console.log('❌ STRIPE_SECRET_KEY not found in environment variables');
    return;
  }
  
  console.log('✅ STRIPE_SECRET_KEY found');
  console.log('Key starts with:', stripeKey.substring(0, 10) + '...');
  console.log('Key type:', stripeKey.startsWith('sk_live_') ? 'Live' : stripeKey.startsWith('sk_test_') ? 'Test' : 'Unknown');
  
  try {
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2025-06-30.basil',
    });
    
    console.log('✅ Stripe instance created successfully');
    
    // Test the key by making a simple API call
    console.log('Testing API call...');
    const account = await stripe.accounts.retrieve();
    
    console.log('✅ Stripe API call successful!');
    console.log('Account ID:', account.id);
    console.log('Account type:', account.type);
    console.log('Charges enabled:', account.charges_enabled);
    console.log('Payouts enabled:', account.payouts_enabled);
    
  } catch (error) {
    console.log('❌ Stripe API call failed:');
    console.log('Error type:', error.type);
    console.log('Error message:', error.message);
    console.log('Error code:', error.code);
    
    if (error.type === 'StripeAuthenticationError') {
      console.log('🔑 This indicates an invalid API key');
    } else if (error.type === 'StripePermissionError') {
      console.log('🔑 This indicates insufficient permissions');
    } else if (error.type === 'StripeInvalidRequestError') {
      console.log('🔑 This indicates an invalid request format');
    }
  }
}

testStripeKey().catch(console.error); 