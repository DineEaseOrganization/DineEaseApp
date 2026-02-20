#!/usr/bin/env node

/**
 * Helper script to update local IP address in .env file
 * Usage: node update-local-ip.js [IP_ADDRESS]
 * Example: node update-local-ip.js 192.168.0.50
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

function updateLocalIP(newIP) {
  if (!newIP) {
    console.error('❌ Error: Please provide an IP address');
    console.log('Usage: node update-local-ip.js [IP_ADDRESS]');
    console.log('Example: node update-local-ip.js 192.168.0.50');
    process.exit(1);
  }

  // Validate IP address format
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (!ipRegex.test(newIP)) {
    console.error('❌ Error: Invalid IP address format');
    console.log('Example: 192.168.0.50');
    process.exit(1);
  }

  try {
    // Read current .env file
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Replace IP addresses in URLs
    const oldIP = envContent.match(/http:\/\/([\d.]+):/);
    if (oldIP && oldIP[1]) {
      console.log(`📝 Updating IP from ${oldIP[1]} to ${newIP}`);
      envContent = envContent.replace(
        new RegExp(oldIP[1], 'g'),
        newIP
      );
    } else {
      console.log(`📝 Setting IP to ${newIP}`);
      envContent = envContent
        .replace(/http:\/\/localhost:/g, `http://${newIP}:`)
        .replace(/http:\/\/127\.0\.0\.1:/g, `http://${newIP}:`);
    }

    // Write updated content
    fs.writeFileSync(envPath, envContent);

    console.log('✅ Successfully updated .env file');
    console.log('\n📋 Current configuration:');

    // Display current URLs
    const lines = envContent.split('\n');
    lines.forEach(line => {
      if (line.startsWith('CUSTOMER_AUTH_URL=') ||
          line.startsWith('RESTAURANT_SERVICE_URL=') ||
          line.startsWith('PROCESSING_SERVICE_URL=')) {
        console.log(`  ${line}`);
      }
    });

    console.log('\n💡 Remember to restart your Expo server:');
    console.log('   npm start -- --clear');

  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
    process.exit(1);
  }
}

// Get IP from command line argument
const newIP = process.argv[2];
updateLocalIP(newIP);
