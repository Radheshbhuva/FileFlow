export interface AuthUserPayload {
  sub: string;
  email: string;
  fullName?: string;
  customAttributes?: Record<string, any>;
}

export interface AuthResponse {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  sub: string;
  email: string;
}

export interface AuthProvider {
  /**
   * Registers a user in the identity provider
   */
  register(dto: { email: string; password?: string; fullName: string }): Promise<{ sub: string; email: string }>;

  /**
   * Authenticates a user in the identity provider
   */
  authenticate(dto: { email: string; password?: string }): Promise<AuthResponse>;

  /**
   * Confirms user signup (for verification) in the identity provider
   */
  confirmSignUp(email: string): Promise<void>;

  /**
   * Sets/resets a user password in the identity provider
   */
  setUserPassword(email: string, passwordHash: string): Promise<void>;

  /**
   * Refreshes user session tokens using a refresh token
   */
  refreshSession(refreshToken: string, email: string): Promise<Partial<AuthResponse>>;

  /**
   * Retrieves user info from the identity provider using an access token
   */
  getUser(accessToken: string): Promise<AuthUserPayload>;

  /**
   * Deletes a user profile in the identity provider
   */
  deleteUser(email: string): Promise<void>;

  /**
   * Authenticates a user (alias/wrapper for authenticate)
   */
  login(dto: { email: string; password?: string }): Promise<AuthResponse>;

  /**
   * Invalidates a user session/tokens in the identity provider
   */
  logout(accessToken: string): Promise<void>;

  /**
   * Confirms email/signup (alias/wrapper for confirmSignUp)
   */
  verifyEmail(email: string): Promise<void>;

  /**
   * Initiates the password recovery flow (sending code) in the identity provider
   */
  forgotPassword(email: string): Promise<void>;

  /**
   * Resets the password using a confirmation code/token
   */
  resetPassword(email: string, code: string, passwordHashOrPlain: string): Promise<void>;
}
