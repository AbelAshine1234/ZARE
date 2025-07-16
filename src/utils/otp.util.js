const twilio = require('twilio');
require('dotenv').config();

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_VERIFY_SID,
} = process.env;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SID) {
  throw new Error('Twilio credentials are missing from environment variables.');
}

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/**
 * Send an OTP to a phone number using Twilio Verify.
 * @param {string} phone - E.164 format, e.g., +2519XXXXXXX
 * @param {('sms'|'whatsapp')} channel - OTP delivery method
 * @returns {Promise<object>} Twilio response
 */
const sendOtp = async (phone, channel = 'sms') => {
  try {
    const verification = await client.verify.v2
      .services(TWILIO_VERIFY_SID)
      .verifications.create({
        to: phone,
        channel,
      });

    return verification;
  } catch (err) {
    console.error('[OTP SEND ERROR]', err);
    throw new Error('Failed to send OTP');
  }
};

/**
 * Verify an OTP for a given phone number.
 * @param {string} phone - E.164 format
 * @param {string} code - 6-digit OTP code
 * @returns {Promise<boolean>} true if verified, false otherwise
 */
const verifyOtp = async (phone, code) => {
  try {
    const result = await client.verify.v2
      .services(TWILIO_VERIFY_SID)
      .verificationChecks.create({
        to: phone,
        code,
      });

    return result.status === 'approved';
  } catch (err) {
    console.error('[OTP VERIFY ERROR]', err);
    return false;
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
};
