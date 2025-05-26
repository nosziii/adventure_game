export class UserDto {
  id: number;
  email: string;
  role: string; // 'admin' vagy 'user'
  selected_archetype_id: number | null;
}
