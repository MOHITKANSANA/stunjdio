
import type { LucideIcon } from 'lucide-react';
import { Book, BrainCircuit, Calculator, FlaskConical, Globe, Wallet, FileText, GraduationCap, Newspaper, Trophy, Scroll, Briefcase } from 'lucide-react';

export interface Course {
  title: string;
  category: string;
  description: string;
  icon: LucideIcon;
}

export const courses: Course[] = [
  { title: "Algebra Fundamentals", category: "Maths", description: "Master the basics of algebra.", icon: Calculator },
  { title: "World History", category: "GK", description: "Explore major historical events.", icon: Globe },
  { title: "English Grammar", category: "English", description: "Improve your grammar and writing.", icon: Book },
  { title: "Intro to Physics", category: "Science", description: "Discover the laws of motion.", icon: FlaskConical },
  { title: "Logical Puzzles", category: "Reasoning", description: "Sharpen your logical thinking.", icon: BrainCircuit },
  { title: "Geometry Basics", category: "Maths", description: "Learn about shapes and spaces.", icon: Calculator },
  { title: "Current Affairs", category: "GK", description: "Stay updated with global news.", icon: Globe },
  { title: "Advanced Chemistry", category: "Science", description: "Dive deep into chemical reactions.", icon: FlaskConical },
];

export interface Test {
    title: string;
    subject: string;
    questions: number;
    duration: string;
}

export const tests: Test[] = [
    { title: "Maths Practice Test 1", subject: "Maths", questions: 25, duration: "45 mins" },
    { title: "General Knowledge Quiz", subject: "GK", questions: 50, duration: "30 mins" },
    { title: "English Vocabulary Test", subject: "English", questions: 40, duration: "30 mins" },
    { title: "Science Mock Exam", subject: "Science", questions: 30, duration: "60 mins" },
    { title: "Reasoning Challenge", subject: "Reasoning", questions: 20, duration: "40 mins" },
];

export const userCourses = [
  { name: "Algebra Fundamentals", progress: 75 },
  { name: "World History", progress: 40 },
  { name: "English Grammar", progress: 95 },
];

export const testHistory = [
  { name: "Maths Practice Test 1", score: "88%", date: "2023-10-15" },
  { name: "General Knowledge Quiz", score: "72%", date: "2023-10-12" },
  { name: "English Vocabulary Test", score: "95%", date: "2023-10-10" },
];

export const certificates = [
  { name: "Certificate of Completion: English Grammar", course: "English Grammar", date: "2023-10-11" },
];

export interface DashboardGridItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

export const dashboardGridItems: DashboardGridItem[] = [
  { label: "Paid Course", icon: Wallet, href: "/dashboard/courses" },
  { label: "Test Series", icon: FileText, href: "/dashboard/tests" },
  { label: "Free Courses", icon: GraduationCap, href: "/dashboard/courses" },
  { label: "Previous Papers", icon: Newspaper, href: "/dashboard/tests" },
  { label: "Current Affairs", icon: Globe, href: "/dashboard/courses" },
  { label: "Quiz", icon: Trophy, href: "/dashboard/tests" },
  { label: "Syllabus", icon: Scroll, href: "/dashboard/courses" },
  { label: "Our Books", icon: Book, href: "/dashboard/courses" },
  { label: "Job Alerts", icon: Briefcase, href: "/dashboard/courses" },
];
