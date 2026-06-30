import React from 'react';

export class OTPWidget {
  private static widgetId: string = "";
  private static tokenAuth: string = "";

  private static checkInitialization() {
    if (this.widgetId === "" || this.tokenAuth === "") {
      console.warn("OTPWidget not initialized. Provide widgetid and tokenauth.");
      return false;
    }
    return true;
  }

  static async initializeWidget(widgetid: string, tokenauth: string) {
    this.widgetId = widgetid;
    this.tokenAuth = tokenauth;
    console.log("OTPWidget initialized on Web Stub with:", { widgetid, tokenauth });
  }

  static async sendOTP(body: any) {
    if (!this.checkInitialization()) return null;
    console.log("OTPWidget sendOTP called via Web Stub with:", body);
    return { success: true, message: "OTP sent successfully (Web Stub)", reqId: "stub_" + Date.now() };
  }

  static async verifyOTP(body: any) {
    if (!this.checkInitialization()) return null;
    console.log("OTPWidget verifyOTP called via Web Stub with:", body);
    return { success: true, message: "OTP verified successfully (Web Stub)" };
  }

  static async retryOTP(body: any) {
    if (!this.checkInitialization()) return null;
    console.log("OTPWidget retryOTP called via Web Stub with:", body);
    return { success: true, message: "OTP retried successfully (Web Stub)" };
  }

  static async getWidgetProcess() {
    if (!this.checkInitialization()) return null;
    return { success: true, config: {} };
  }
}

export const DefaultWidget: React.FC<any> = () => {
  return null;
};

export default DefaultWidget;
