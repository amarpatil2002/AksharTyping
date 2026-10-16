export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type PassageSource = "admin" | "custom";

export interface Passage {
  id: string;
  title: string;
  text: string;
  category: string;
  difficulty: Difficulty;
  source: PassageSource;
}

export const ADMIN_PASSAGES: Passage[] = [
  {
    id: "daily-habits",
    title: "Daily Habits",
    category: "Lifestyle",
    difficulty: "Beginner",
    source: "admin",
    text: "Every day is a new chance to learn something useful. Small habits can make a big difference in our lives. Reading, writing, and regular practice help us improve our skills. Start with a simple goal and work toward it every day.",
  },
  {
    id: "morning-routine",
    title: "A Fresh Morning",
    category: "Lifestyle",
    difficulty: "Beginner",
    source: "admin",
    text: "A fresh morning brings new energy and new opportunities. Wake up on time, drink some water, and plan your day. A calm beginning can help you focus better and complete your work with confidence.",
  },
  {
    id: "technology",
    title: "Technology Today",
    category: "Technology",
    difficulty: "Intermediate",
    source: "admin",
    text: "Technology has changed the way people learn, work, and communicate. Digital tools make information easier to access, but using them wisely is important. A balance between technology and real-world activities helps us remain productive.",
  },
  {
    id: "learning",
    title: "The Power of Learning",
    category: "Education",
    difficulty: "Intermediate",
    source: "admin",
    text: "Learning is a continuous process that requires patience and curiosity. When we practice a skill regularly, difficult tasks gradually become easier. Mistakes are useful because they show us what needs improvement. Consistency matters more than occasional bursts of effort.",
  },
  {
    id: "focus",
    title: "Building Better Focus",
    category: "Productivity",
    difficulty: "Advanced",
    source: "admin",
    text: "Focused work requires deliberate attention, clear priorities, and consistent effort. Instead of switching between several tasks, choose one meaningful objective and complete it carefully. Short breaks can restore concentration and help maintain accuracy throughout a demanding session.",
  },
  {
    id: "digital-future",
    title: "The Digital Future",
    category: "Technology",
    difficulty: "Advanced",
    source: "admin",
    text: "As digital systems continue to evolve, adaptability becomes an increasingly valuable skill. People who combine technical knowledge with critical thinking can solve unfamiliar problems more effectively. Responsible innovation should improve accessibility, protect privacy, and create opportunities for a wider community.",
  },
];
