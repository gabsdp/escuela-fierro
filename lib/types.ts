export type UserRole = "admin" | "student";
export type ProductKey =
  | "libreria"
  | "editorial"
  | "fierrogo_libreria"
  | "fierrogo_editorial"
  | "distribuidora";

export const PRODUCT_LABELS: Record<ProductKey, string> = {
  libreria: "Librería",
  editorial: "Editorial",
  fierrogo_libreria: "FierroGO Librería",
  fierrogo_editorial: "FierroGO Editorial",
  distribuidora: "Distribuidora",
};

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  product_key: ProductKey;
  description: string;
  order_index: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string;
  video_url: string;
  order_index: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModuleFile {
  id: string;
  module_id: string;
  name: string;
  file_url: string;
  created_at: string;
}

export interface UserCourse {
  id: string;
  user_id: string;
  course_id: string;
  assigned_at: string;
  assigned_by: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  module_id: string;
  completed: boolean;
  completed_at: string | null;
}

export interface CourseWithProgress extends Course {
  total_modules: number;
  completed_modules: number;
}

export interface CourseWithCounts extends Course {
  module_count: number;
  student_count: number;
}

export interface ModuleWithProgress extends Module {
  completed: boolean;
}

export interface ChecklistItem {
  id: string;
  module_id: string;
  text: string;
  order_index: number;
  created_at: string;
}

export interface FaqItem {
  id: string;
  module_id: string;
  question: string;
  answer: string;
  order_index: number;
  created_at: string;
}

export interface UserChecklistProgress {
  id: string;
  user_id: string;
  checklist_item_id: string;
  completed: boolean;
  completed_at: string | null;
}

export interface ChecklistItemWithProgress extends ChecklistItem {
  completed: boolean;
}

export interface UserWithCourses extends Profile {
  assigned_courses: string[];
}
