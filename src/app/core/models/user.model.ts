export interface UserOut {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string; // used for school
  level?: string;
  classLevel?: string;
  createdAt: string;
  role: string;
  isActive: boolean;
  mustChangePassword?: boolean;
  phone?: string;
  dateOfBirth?: string;
  assignedLearningPathId?: string | null;
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

export interface ProfCreateOut {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  plainPassword: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface SchoolStats {
  studentCount: number;
  professorCount: number;
  activeStudents: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: string;
  user?: UserOut;
  school?: SchoolOut;
}
