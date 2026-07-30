export type UserRole =
  | 'ADMIN'
  | 'WAREHOUSE MANAGER'
  | 'SALES EXECUTIVE'
  | 'DISTRIBUTION MANAGER'
  | 'MANAGER';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  createdAt?: string;
}


/** POST /api/users — request body */
export interface CreateUserRequest {
  username: string;
  email:    string;
  password: string;
  role:     UserRole;
}

/** POST /api/users — response envelope */
export interface CreateUserApiResponse {
  success: boolean;
  message: string;
  data: {
    id:        number;
    email:     string;
    role:      string;
    status:    string;
    createdAt: string;
  };
}

/** PUT /api/users/{id} — request body */
export interface UpdateUserRequest {
  username: string;
  email:    string;
  role?:    UserRole;   // omitted when editing an ADMIN
}

/** PUT /api/users/{id} — response envelope */
export interface UpdateUserApiResponse {
  success:   boolean;
  message:   string;
  timestamp: string;
  data: {
    id:        number;
    username:  string;
    email:     string;
    role:      string;
    status:    string;
    createdAt: string;
  };
}

/** Query params accepted by GET /api/users */
export interface UserListParams {
  search?:  string;
  role?:    string;
  status?:  string;
  page?:    number;
  size?:    number;
  sort?:    string;   // e.g. 'createdAt,desc'
}

/** GET /api/users — response envelope */
export interface UserListApiResponse {
  success:   boolean;
  message:   string;
  timestamp: string;
  data: {
    users: {
      id:        number;
      username:  string;
      email:     string;
      role:      string;
      status:    string;
      createdAt: string;
    }[];
    page:          number;
    size:          number;
    totalElements: number;
    totalPages:    number;
  };
}

/** PATCH /api/users/{id}/status — request body */
export interface ToggleUserStatusRequest {
  status: 'ACTIVE' | 'INACTIVE';
}

/** PATCH /api/users/{id}/status — response envelope */
export interface ToggleUserStatusApiResponse {
  success:   boolean;
  message:   string;
  timestamp: string;
  data: {
    id:        number;
    username:  string;
    email:     string;
    role:      string;
    status:    'ACTIVE' | 'INACTIVE';
    createdAt: string;
  };
}

/** PATCH /api/users/{id}/archive — response envelope */
export interface ArchiveUserApiResponse {
  success:   boolean;
  message:   string;
  timestamp: string;
  data: {
    id:        number;
    username:  string;
    email:     string;
    role:      string;
    status:    string;
    createdAt: string;
  };
}
