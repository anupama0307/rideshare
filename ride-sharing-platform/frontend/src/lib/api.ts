const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (this.token) {
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }


    const json = await response.json();
    // Backend wraps responses in { success: true, data: {...} }
    // Extract the data field if present
    if (json && json.data !== undefined) {
      return json.data as T;
    }
    return json as T;
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    this.setToken(response.token);
    return response;
  }

  async register(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) {
    // Split fullName into firstName and lastName for backend compatibility
    const nameParts = data.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || nameParts[0] || ''; // Use first name as last if only one name

    const response = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: {
        email: data.email,
        password: data.password,
        firstName,
        lastName,
        phone: data.phone || '+10000000000', // Default phone if not provided
      },
    });
    this.setToken(response.token);
    return response;
  }

  async logout() {
    this.setToken(null);
  }

  async getProfile() {
    return this.request<{ user: any }>('/auth/me');
  }

  async updateProfile(data: { firstName?: string; lastName?: string; phone?: string }) {
    return this.request<{ user: any }>('/auth/profile', {
      method: 'PATCH',
      body: data,
    });
  }

  // Ride endpoints
  async createRideRequest(data: {
    pickupLocation: { latitude: number; longitude: number; address: string };
    dropoffLocation: { latitude: number; longitude: number; address: string };
    pickupWindowStart: string;
    pickupWindowEnd: string;
    poolingEnabled: boolean;
    maxWalkingDistance?: number;
    accessibilityNeeds?: string[];
    genderPreference?: 'any' | 'female_only' | 'male_only';
  }) {
    return this.request<{ rideRequest: any; matchingRides: any[]; carbonEstimate: any }>(
      '/rides/requests',
      { method: 'POST', body: data }
    );
  }

  async getMatchingRides(requestId: string) {
    return this.request<{ rides: any[] }>(`/rides/match/${requestId}`);
  }

  async getMyRides(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<{ rides: any[] }>(`/rides/my-rides${query}`);
  }

  async getRideDetails(rideId: string) {
    return this.request<{ ride: any; route: any; passengers: any[] }>(`/rides/${rideId}`);
  }

  async cancelRide(rideId: string, reason?: string) {
    return this.request<{ success: boolean }>(`/rides/${rideId}/cancel`, {
      method: 'POST',
      body: { reason },
    });
  }

  // Booking endpoints
  async createBooking(rideId: string, data: {
    pickupPoint: { latitude: number; longitude: number; address: string };
    dropoffPoint: { latitude: number; longitude: number; address: string };
  }) {
    return this.request<{ booking: any }>('/bookings', {
      method: 'POST',
      body: { rideId, ...data },
    });
  }

  async getMyBookings(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<{ bookings: any[] }>(`/bookings/my-bookings${query}`);
  }

  async rateRide(bookingId: string, rating: number, review?: string) {
    return this.request<{ success: boolean }>(`/bookings/${bookingId}/rate`, {
      method: 'POST',
      body: { rating, review },
    });
  }

  // Demand prediction endpoints
  async getDemandHeatmap(bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }) {
    return this.request<{ zones: any[] }>('/demand/heatmap', {
      method: 'POST',
      body: bounds,
    });
  }

  async getPrediction(location: { latitude: number; longitude: number }, time?: string) {
    return this.request<{ prediction: any }>('/demand/predict', {
      method: 'POST',
      body: { location, time },
    });
  }

  // Carbon stats
  async getCarbonStats() {
    return this.request<{
      totalSaved: number;
      monthlyStats: any[];
      currentStreak: number;
      leaderboardRank: number;
    }>('/carbon/stats');
  }

  async getLeaderboard(limit = 10) {
    return this.request<{ leaderboard: any[] }>(`/carbon/leaderboard?limit=${limit}`);
  }

  // Driver endpoints
  async registerAsDriver(data: {
    vehicleType: string;
    licensePlate: string;
    vehicleModel: string;
    vehicleColor: string;
    vehicleYear: number;
    seats: number;
    isElectric: boolean;
    isWheelchairAccessible: boolean;
  }) {
    return this.request<{ vehicle: any }>('/driver/register', {
      method: 'POST',
      body: data,
    });
  }

  async createRide(data: {
    vehicleId: string;
    startLocation: { latitude: number; longitude: number; address: string };
    endLocation: { latitude: number; longitude: number; address: string };
    scheduledWindowStart: string;
    scheduledWindowEnd: string;
    availableSeats: number;
    pricePerKm: number;
    isPooling: boolean;
  }) {
    return this.request<{ ride: any }>('/driver/rides', {
      method: 'POST',
      body: data,
    });
  }

  async getDriverRides() {
    return this.request<{ rides: any[] }>('/driver/rides');
  }

  async updateRideStatus(rideId: string, status: string) {
    return this.request<{ ride: any }>(`/driver/rides/${rideId}/status`, {
      method: 'PATCH',
      body: { status },
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
