export interface User {
  id: string;
  email: string;
}

export interface Profile {
  _id: string;
  userId: string;
  fullName: string;
  about: string;
  specialties: string[];
  roles: string[];
  updatedAt: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  specialty: string;
  requiredRoles: string[];
  status: "Відкрито" | "Закрито";
  authorId: string;
  createdAt: string;
}

export interface CoAuthoredCourse extends Course {
  myRole?: string;
}

export interface CourseApplication {
  _id: string;
  courseId: string;
  applicantId: string;
  type: "співавтор" | "слухач";
  role?: string;
  status: "очікує" | "підтверджено" | "відхилено";
  createdAt: string;
}

export interface Message {
  _id: string;
  courseId: string;
  senderId: string;
  recipientId: string;
  text: string;
  createdAt: string;
  readAt: string | null;
}
