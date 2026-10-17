import type { ExamPassage, ExamProfile } from "./types";

export const SAMPLE_EXAM_PASSAGES: ExamPassage[] = [
  {
    id: "101",
    title: "Office Administration",
    language: "English",
    difficulty: "Beginner",
    category: "Administration",
    text: "An office plays an important role in the smooth functioning of an organization. Employees must maintain records, organize documents, respond to letters, and complete their daily duties on time. Proper communication and careful planning help an office work efficiently.",
  },
  {
    id: "102",
    title: "Government Office Procedures",
    language: "English",
    difficulty: "Intermediate",
    category: "Government",
    text: "Government offices are responsible for delivering public services and maintaining official records. Every application should be examined carefully, and the required documents must be verified before a decision is made. Employees should follow established procedures and treat every citizen fairly.",
  },
  {
    id: "103",
    title: "Court Administration",
    language: "English",
    difficulty: "Advanced",
    category: "Judiciary",
    text: "The effective administration of justice depends on accurate documentation, timely communication, and systematic record management. Court staff must handle official information responsibly, maintain the confidentiality of sensitive records, and ensure that files are available whenever required for judicial proceedings.",
  },
  {
    id: "104",
    title: "कार्यालयीन कामकाज",
    language: "Marathi",
    difficulty: "Beginner",
    category: "प्रशासन",
    text: "कार्यालयीन कामकाजामध्ये वेळेचे नियोजन आणि शिस्त महत्त्वाची असते. प्रत्येक कर्मचाऱ्याने आपली जबाबदारी योग्य प्रकारे पार पाडली पाहिजे. आवश्यक कागदपत्रांची नोंद ठेवणे, पत्रव्यवहार करणे आणि नागरिकांना योग्य माहिती देणे ही कार्यालयातील महत्त्वाची कामे आहेत.",
  },
  {
    id: "105",
    title: "शासकीय कार्यालयातील कार्यपद्धती",
    language: "Marathi",
    difficulty: "Intermediate",
    category: "शासन",
    text: "शासकीय कार्यालयात प्राप्त होणाऱ्या अर्जांची तपासणी नियमानुसार केली जाते. आवश्यक कागदपत्रे पूर्ण आहेत की नाहीत याची खात्री करून पुढील कार्यवाही केली जाते. कार्यालयीन नोंदी व्यवस्थित ठेवल्यामुळे कामकाजात पारदर्शकता राहते आणि नागरिकांना सेवा देणे अधिक सोपे होते.",
  },
];

export const SAMPLE_EXAM_PROFILES: ExamProfile[] = [
  {
    id: "201",
    title: "Court Junior Clerk — Mock Exam",
    description: "Practice administrative and court-related typing passages.",
    language: "English",
    durationSeconds: 600,
    targetWpm: 40,
    passageIds: ["101", "102", "103"],
    status: "published",
  },
  {
    id: "202",
    title: "Marathi Clerk — Mock Exam",
    description: "Practice Marathi office and government-related passages.",
    language: "Marathi",
    durationSeconds: 600,
    targetWpm: 30,
    passageIds: ["104", "105"],
    status: "draft",
  },
];
