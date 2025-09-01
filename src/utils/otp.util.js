require('dotenv').config();

// In-memory storage for OTPs (in production, use Redis or database)
const otpStorage = new Map();

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send an OTP to a phone number (Mock implementation for testing)
 * @param {string} phone - Phone number
 * @param {('sms'|'whatsapp')} channel - OTP delivery method (ignored in mock)
 * @returns {Promise<object>} Mock response
 */
const sendOtp = async (phone, channel = 'sms') => {
  try {
    const otp = generateOTP();
    
    // Store OTP with phone number and expiration (5 minutes)
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes
    otpStorage.set(phone, {
      otp,
      expiresAt,
      attempts: 0
    });

    // Display OTP in console for testing
    console.log('\n' + '='.repeat(50));
    console.log('🔐 MOCK OTP SYSTEM (FOR TESTING)');
    console.log('='.repeat(50));
    console.log(`📱 Phone: ${phone}`);
    console.log(`🔢 OTP Code: ${otp}`);
    console.log(`⏰ Expires: ${new Date(expiresAt).toLocaleString()}`);
    console.log(`📝 Use this OTP to verify: ${phone}`);
    console.log('='.repeat(50) + '\n');

    // Return mock response similar to Twilio
    return {
      status: 'pending',
      to: phone,
      channel: channel,
      sid: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  } catch (err) {
    console.error('[MOCK OTP SEND ERROR]', err);
    throw new Error('Failed to send OTP');
  }
};

/**
 * Verify an OTP for a given phone number (Mock implementation for testing)
 * @param {string} phone - Phone number
 * @param {string} code - 6-digit OTP code
 * @returns {Promise<boolean>} true if verified, false otherwise
 */
const verifyOtp = async (phone, code) => {
  try {
    const storedData = otpStorage.get(phone);
    
    if (!storedData) {
      console.log(`❌ No OTP found for phone: ${phone}`);
      return false;
    }

    // Check if OTP has expired
    if (Date.now() > storedData.expiresAt) {
      console.log(`⏰ OTP expired for phone: ${phone}`);
      otpStorage.delete(phone);
      return false;
    }

    // Check if too many attempts
    if (storedData.attempts >= 3) {
      console.log(`🚫 Too many attempts for phone: ${phone}`);
      otpStorage.delete(phone);
      return false;
    }

    // Increment attempts
    storedData.attempts++;

    // Check if OTP matches
    if (storedData.otp === code) {
      console.log(`✅ OTP verified successfully for phone: ${phone}`);
      otpStorage.delete(phone); // Remove OTP after successful verification
      return true;
    } else {
      console.log(`❌ Invalid OTP for phone: ${phone}. Attempts: ${storedData.attempts}/3`);
      return false;
    }
  } catch (err) {
    console.error('[MOCK OTP VERIFY ERROR]', err);
    return false;
  }
};

/**
 * Get stored OTP for a phone number (for debugging)
 * @param {string} phone - Phone number
 * @returns {object|null} Stored OTP data or null
 */
const getStoredOTP = (phone) => {
  return otpStorage.get(phone) || null;
};

/**
 * Clear all stored OTPs (for testing)
 */
const clearAllOTPs = () => {
  otpStorage.clear();
  console.log('🧹 All stored OTPs cleared');
};

/**
 * List all stored OTPs (for debugging)
 */
const listAllOTPs = () => {
  console.log('\n' + '='.repeat(50));
  console.log('📋 STORED OTPS (FOR DEBUGGING)');
  console.log('='.repeat(50));
  
  if (otpStorage.size === 0) {
    console.log('No OTPs stored');
  } else {
    for (const [phone, data] of otpStorage.entries()) {
      const isExpired = Date.now() > data.expiresAt;
      const status = isExpired ? '❌ EXPIRED' : '✅ ACTIVE';
      console.log(`${phone}: ${data.otp} - ${status} - Attempts: ${data.attempts}/3`);
    }
  }
  console.log('='.repeat(50) + '\n');
};

module.exports = {
  sendOtp,
  verifyOtp,
  getStoredOTP,
  clearAllOTPs,
  listAllOTPs
};
