export interface UserOut {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  level: string;
  createdAt: string;
  role: string;
  isActive: boolean;
}

export interface AdminUserOut extends UserOut {}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserOut;
}
