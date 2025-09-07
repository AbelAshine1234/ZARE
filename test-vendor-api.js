const http = require('http');

// Test phone number cleaning (same as frontend)
function cleanPhoneNumber(phoneNumber) {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  return `+251${cleanPhone}`;
}

// Test with the seeded phone numbers
const testPhoneNumbers = [
  '+251966666667', // Tech Store Owner (already formatted)
  '966666667',     // Without +251 prefix
  '+251 966 666 667', // With spaces
  '966-666-667'    // With dashes
];

console.log('Testing phone number cleaning:');
testPhoneNumbers.forEach(phone => {
  const cleaned = cleanPhoneNumber(phone);
  console.log(`${phone} -> ${cleaned}`);
});

// Test API call
const testApiCall = (phoneNumber) => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/vendors/by-phone/${encodeURIComponent(phoneNumber)}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  console.log(`\nTesting API call with: ${phoneNumber}`);
  
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      try {
        const response = JSON.parse(data);
        console.log('Response:', JSON.stringify(response, null, 2));
      } catch (e) {
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
  });

  req.end();
};

// Test with cleaned phone number
const cleanedPhone = cleanPhoneNumber('966666667');
testApiCall(cleanedPhone);
