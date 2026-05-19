export interface UserModel {
  id:       number;
  code:     string;
  username: string;
  fullName: string;
  email:    string;
  role:     string;
  isActive: boolean;
  password?: string;
}
