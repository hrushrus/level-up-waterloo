/**
 * Predefined security questions for account recovery
 * Users will select 3 questions and provide answers
 */
export const SECURITY_QUESTIONS = [
  "What is the name of your first pet?",
  "What city were you born in?",
  "What is your mother's maiden name?",
  "What is the name of your elementary school?",
  "What was the make of your first car?",
  "What is your favorite book?",
  "What is the name of your best friend in high school?",
  "What is your favorite movie?",
  "What street did you live on in third grade?",
  "What is your favorite food?",
  "What is the name of your first employer?",
  "What is your favorite sports team?",
  "In what city or town did your mother and father meet?",
  "What is your favorite song?",
  "What is the name of your favorite teacher?",
  "What is your favorite color?",
  "What is the name of your first crush?",
  "What is your favorite restaurant?",
  "What is the name of your childhood best friend?",
  "What is your favorite hobby?",
];

export interface SecurityQuestion {
  id: number;
  question: string;
  answer: string; // User's answer (case-insensitive, trimmed)
}

export interface SecurityQuestionsData {
  questions: SecurityQuestion[];
  setupDate?: Date;
}
