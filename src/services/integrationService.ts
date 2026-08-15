/**
 * Integration Service for SMS Gateway, OTP Dispatch, and Third-Party Telemetry.
 * Includes comprehensive logging of exact payloads sent and API responses received.
 */

export interface SmsDispatchResponse {
  success: boolean;
  provider?: string;
  accountType?: string;
  matchTemplate?: boolean | string;
  status?: string;
  apiResponse?: string | Record<string, any>;
  code?: string;
  message?: string;
  error?: string;
  diagnostics?: {
    timestamp: string;
    endpoint: string;
    payloadSent: Record<string, any>;
    httpStatus: number;
    rawBody?: string;
  };
}

export const integrationService = {
  /**
   * Dispatches a general transactional SMS message.
   */
  async sendSMS(to: string, message: string): Promise<SmsDispatchResponse> {
    const cleanTo = to.replace(/\D/g, "").slice(-10);
    const payload = { to: cleanTo, message };
    const timestamp = new Date().toISOString();

    console.group(`📡 [SMS Gateway - sendSMS] Dispatching to +91 ${cleanTo} at ${timestamp}`);
    console.log("📤 [Payload Sent to /api/send-sms]:", payload);

    try {
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseStatus = response.status;
      const data: SmsDispatchResponse = await response.json();

      console.log(`📥 [API Response Received (HTTP ${responseStatus})]:`, data);

      if (!response.ok || data.error || data.success === false) {
        const errorMsg = data.error || `SMS gateway dispatch failed with status ${responseStatus}`;
        console.error("❌ [SMS Gateway Dispatch Error]:", errorMsg, {
          payloadSent: payload,
          apiResponse: data,
          status: responseStatus
        });
        console.groupEnd();
        throw new Error(errorMsg);
      }

      console.log("✅ [SMS Gateway Dispatch Confirmed]:", data.status || "SUCCESS");
      console.groupEnd();
      return data;
    } catch (err: any) {
      console.error("🚨 [SMS Gateway Network / Execution Exception]:", err.message || err);
      console.groupEnd();
      throw err;
    }
  },

  /**
   * Dispatches an OTP verification code with comprehensive payload & response telemetry.
   */
  async sendOTP(phoneNumber: string, code: string): Promise<SmsDispatchResponse> {
    const cleanPhone = phoneNumber.replace(/\D/g, "").slice(-10);
    const payload = { phoneNumber: cleanPhone, code };
    const timestamp = new Date().toISOString();

    console.group(`🔐 [SMS Gateway - sendOTP] Dispatching OTP for +91 ${cleanPhone} at ${timestamp}`);
    console.log("📤 [Payload Sent to /api/send-otp]:", {
      ...payload,
      route: "serv_imp",
      senderId: "LKLBND",
      timestamp
    });

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseStatus = response.status;
      let data: SmsDispatchResponse;
      
      try {
        data = await response.json();
      } catch (parseErr) {
        const text = await response.text();
        console.error("❌ [SMS Gateway Response JSON Parse Error]:", text);
        console.groupEnd();
        throw new Error(`Server returned non-JSON response (HTTP ${responseStatus}): ${text}`);
      }

      console.log(`📥 [API Response Received from /api/send-otp (HTTP ${responseStatus})]:`, data);

      if (!response.ok || data.error || data.success === false) {
        const errorMessage = data.error || `OTP Generation/Dispatch failed with HTTP status ${responseStatus}`;
        console.error("⚠️ [OTP Generation Gateway Notice]:", errorMessage, {
          payloadSent: payload,
          apiResponse: data,
          httpStatus: responseStatus
        });
        console.groupEnd();
        return {
          success: false,
          error: errorMessage,
          status: data.status || 'FAILED',
          apiResponse: data.apiResponse || null,
          diagnostics: {
            timestamp,
            endpoint: '/api/send-otp',
            payloadSent: payload,
            httpStatus: responseStatus
          }
        };
      }

      console.log(`✅ [OTP Delivered/Queued]: Provider: ${data.provider}, Status: ${data.status}, Code: ${data.code}`);
      console.groupEnd();
      return {
        ...data,
        diagnostics: {
          timestamp,
          endpoint: '/api/send-otp',
          payloadSent: payload,
          httpStatus: responseStatus
        }
      };
    } catch (err: any) {
      console.error("🚨 [OTP Gateway Network Exception]:", err.message || err);
      console.groupEnd();
      return {
        success: false,
        error: err.message || "Failed to reach OTP dispatch server",
        status: 'NETWORK_ERROR',
        diagnostics: {
          timestamp,
          endpoint: '/api/send-otp',
          payloadSent: payload,
          httpStatus: 0
        }
      };
    }
  },

  /**
   * Verifies an OTP code against backend validation endpoint.
   */
  async verifyOTP(phoneNumber: string, code: string) {
    const cleanPhone = phoneNumber.replace(/\D/g, "").slice(-10);
    const payload = { phoneNumber: cleanPhone, code };

    console.log("🔍 [SMS Gateway - verifyOTP] Submitting verification:", payload);
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      console.log("📥 [verifyOTP Response]:", data);
      return data;
    } catch (err) {
      console.error("🚨 [verifyOTP Exception]:", err);
      throw err;
    }
  }
};
