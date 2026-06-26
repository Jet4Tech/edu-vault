export type Category = { name: string; slug: string; icon: string };

export const categories: Category[] = [
  { name: "School & Exam Resources", slug: "school-exam", icon: "GraduationCap" },
  { name: "Teacher Resources", slug: "teacher-resources", icon: "BookOpen" },
  { name: "Student Productivity", slug: "student-productivity", icon: "Target" },
  { name: "University & Higher Education", slug: "university-higher-ed", icon: "Library" },
  { name: "Digital Design Assets for Education", slug: "digital-design-assets", icon: "Palette" },
  { name: "Interactive Resources", slug: "interactive-resources", icon: "Puzzle" },
  { name: "AI-Related Resources", slug: "ai-resources", icon: "Sparkles" },
  { name: "Specialised Subjects", slug: "specialised-subjects", icon: "FlaskConical" },
];

export function getCategoryBySlug(slug: string): Category | null {
  return categories.find((category) => category.slug === slug) ?? null;
}
