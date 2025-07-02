// Test script to verify Google Analytics setup
// Run this in the browser console on your website

function testAnalyticsSetup() {
  console.log('🎯 Testing Google Analytics Setup...\n');
  
  // Check if GA4 is loaded
  if (typeof window.gtag !== 'function') {
    console.error('❌ Google Analytics not loaded');
    console.log('💡 Make sure you have NEXT_PUBLIC_GA_MEASUREMENT_ID in your .env.local');
    return false;
  }
  
  console.log('✅ Google Analytics is loaded');
  
  // Check environment variable
  const measurementId = process?.env?.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'Not found';
  console.log(`📊 Measurement ID: ${measurementId}`);
  
  // Test custom event tracking
  try {
    window.gtag('event', 'test_event', {
      event_category: 'test',
      event_label: 'analytics_setup_test',
      value: 1
    });
    console.log('✅ Custom event tracking works');
  } catch (error) {
    console.error('❌ Custom event tracking failed:', error);
  }
  
  // Test page view tracking
  try {
    window.gtag('config', measurementId, {
      page_path: '/test-analytics-page'
    });
    console.log('✅ Page view tracking works');
  } catch (error) {
    console.error('❌ Page view tracking failed:', error);
  }
  
  console.log('\n🎉 Analytics test complete!');
  console.log('📈 Check Google Analytics Realtime view to see your test events');
  
  return true;
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  testAnalyticsSetup();
} else {
  console.log('Run this script in your browser console on your website');
} 