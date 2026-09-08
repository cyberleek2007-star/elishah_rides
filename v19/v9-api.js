// V9 frontend helper
window.ElishahAPI = {
  baseUrl: "",

  async createPayment(payload) {
    const response = await fetch(`${this.baseUrl}/api/payment/create`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    return response.json();
  },

  async notifyBooking(bookingRef) {
    const response = await fetch(`${this.baseUrl}/api/notifications/booking`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ bookingRef })
    });
    return response.json();
  }
};
