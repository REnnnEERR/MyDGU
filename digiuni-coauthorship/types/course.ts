export interface CourseApplication {
  id: string;
  userName: string;
  role: string;
  status: "очікує" | "підтверджено" | "відхилено";
}

export interface Course {
  id: string;
  title: string;
  description: string;
  specialty: string;
  requiredRoles: string[];
  status: "Відкрито" | "Закрито";
  author: string;
  authorId: string;
  applications: CourseApplication[];
}