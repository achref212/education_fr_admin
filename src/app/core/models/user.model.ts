export interface UserOut {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string; // used for school
  level?: string;
  createdAt: string;
  role: string;
  isActive: boolean;
  mustChangePassword?: boolean;
}

export interface AdminUserOut extends UserOut {
  classLevel?: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface SchoolOut {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  mustChangePassword?: boolean;
  createdAt: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  directorName?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: string;
  user?: UserOut;
  school?: SchoolOut;
}
