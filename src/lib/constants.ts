import { RoleplayScenario, InterviewMode, DailyMission } from '@/types'

export const ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  {
    id: 'hr-interview',
    title: 'HR Manager',
    aiRole: 'HR Manager',
    context: 'You are an HR Manager conducting a job interview. Start by welcoming the candidate and asking them to introduce themselves. Be professional but friendly.',
    startingPrompt: 'Good morning! Welcome to our company. Please have a seat. I am Sarah, the HR Manager. Could you please start by introducing yourself?',
    icon: '👔',
  },
  {
    id: 'hotel-receptionist',
    title: 'Hotel Receptionist',
    aiRole: 'Hotel Receptionist',
    context: 'You are a hotel receptionist helping a guest check in. Be professional and helpful.',
    startingPrompt: 'Good evening! Welcome to Grand Palace Hotel. How may I assist you today?',
    icon: '🏨',
  },
  {
    id: 'airport-officer',
    title: 'Airport Immigration Officer',
    aiRole: 'Airport Immigration Officer',
    context: 'You are an immigration officer at an international airport. Ask standard immigration questions professionally.',
    startingPrompt: 'Good afternoon. May I see your passport and boarding pass please?',
    icon: '✈️',
  },
  {
    id: 'restaurant',
    title: 'Restaurant Waiter',
    aiRole: 'Restaurant Waiter',
    context: 'You are a waiter at a nice restaurant. Help the customer with the menu and take their order.',
    startingPrompt: 'Good evening! Welcome to La Bella Restaurant. I am your server today. Can I start you off with something to drink?',
    icon: '🍽️',
  },
  {
    id: 'doctor',
    title: 'Doctor',
    aiRole: 'Doctor',
    context: 'You are a doctor in a clinic. The patient has come for a consultation. Ask about their symptoms professionally.',
    startingPrompt: 'Hello, please come in and have a seat. I am Dr. Johnson. What brings you in today?',
    icon: '🏥',
  },
  {
    id: 'team-lead',
    title: 'Team Lead / Manager',
    aiRole: 'Team Lead',
    context: 'You are a team lead having a one-on-one with your team member about their project progress and challenges.',
    startingPrompt: 'Hi! Thanks for making time. I wanted to catch up about your current project. How is everything going so far?',
    icon: '💼',
  },
  {
    id: 'foreign-tourist',
    title: 'Foreign Tourist',
    aiRole: 'Foreign Tourist',
    context: 'You are a tourist visiting India for the first time and need help from a local. Be curious and friendly.',
    startingPrompt: 'Excuse me! Hi! I am visiting from Canada. Could you help me? I am looking for a good local restaurant nearby.',
    icon: '🗺️',
  },
  {
    id: 'customer-service',
    title: 'Customer Service Rep',
    aiRole: 'Customer Service Representative',
    context: 'You are a customer service rep handling a complaint. Be professional, empathetic, and solution-focused.',
    startingPrompt: 'Thank you for calling SupportLine. My name is Alex. I understand you have a concern today — I am here to help. Could you please describe the issue you are experiencing?',
    icon: '🎧',
  },
]

export const INTERVIEW_MODES: InterviewMode[] = [
  { id: 'software-testing', title: 'Software Testing Interview', description: 'QA, testing methodologies, bug tracking', icon: '🧪' },
  { id: 'software-dev', title: 'Software Developer Interview', description: 'Coding concepts, problem solving, architecture', icon: '💻' },
  { id: 'hr-general', title: 'HR / Behavioral Interview', description: 'Soft skills, situational questions, culture fit', icon: '🤝' },
  { id: 'customer-support', title: 'Customer Support Interview', description: 'Communication, empathy, problem resolution', icon: '📞' },
  { id: 'banking', title: 'Banking & Finance Interview', description: 'Finance concepts, customer handling, compliance', icon: '🏦' },
  { id: 'sales', title: 'Sales Interview', description: 'Persuasion, targets, client handling', icon: '📈' },
]

export const DAILY_MISSIONS: DailyMission[] = [
  {
    id: 'introduce-yourself',
    level: 'beginner',
    title: 'Introduce Yourself',
    description: 'Tell the AI your name, where you are from, and what you do.',
    prompt: 'Great! Today\'s mission is to introduce yourself. Tell me your name, where you are from, and what you do for work. Take your time!',
    completed: false,
  },
  {
    id: 'describe-day',
    level: 'beginner',
    title: 'Describe Your Day',
    description: 'Talk about what you did today from morning to now.',
    prompt: 'For today\'s mission, I want you to tell me about your day so far — from the time you woke up until now. Use as many details as you can!',
    completed: false,
  },
  {
    id: 'describe-hometown',
    level: 'intermediate',
    title: 'Describe Your Hometown',
    description: 'Talk about your city or town — what is special about it?',
    prompt: 'Today\'s mission: describe your hometown to me as if I have never been there. What is it like? What are the famous places? What do you love about it?',
    completed: false,
  },
  {
    id: 'dream-job',
    level: 'intermediate',
    title: 'Talk About Your Dream Job',
    description: 'Describe your ideal career and why you want it.',
    prompt: 'Today\'s speaking mission is about careers. Tell me — what is your dream job? What does that job involve? Why do you want it? And what steps are you taking to get there?',
    completed: false,
  },
  {
    id: 'future-goals',
    level: 'advanced',
    title: 'Future Career Goals',
    description: 'Explain where you want to be professionally in 5 years.',
    prompt: 'Today\'s mission is to talk about your future. Where do you see yourself in the next 5 years professionally? What goals are you working toward? What challenges do you expect?',
    completed: false,
  },
  {
    id: 'ai-debate',
    level: 'expert',
    title: 'Debate: AI in the Workplace',
    description: 'Discuss the advantages and disadvantages of AI replacing human jobs.',
    prompt: 'Today\'s expert mission: Let\'s have a real discussion about Artificial Intelligence in the workplace. Do you think AI will replace most jobs in the next 20 years? What are the benefits and the risks? Give me your honest opinion with reasons.',
    completed: false,
  },
]

export const CONVERSATION_STARTERS = [
  "Good morning! How has your day been so far?",
  "What did you do after work or school yesterday?",
  "What are your plans for this weekend?",
  "If you could travel anywhere in the world right now, where would you go and why?",
  "What is something exciting that happened to you recently?",
  "Tell me about something you are currently learning or trying to improve at.",
  "What kind of movies or shows do you enjoy watching? Have you seen anything good lately?",
  "If you could have dinner with any famous person, who would it be and what would you talk about?",
  "What is the best piece of advice someone has ever given you?",
  "Tell me about a goal you are currently working toward.",
]

export const BADGE_INFO: Record<string, { label: string; icon: string }> = {
  'first-conversation': { label: 'First Conversation', icon: '🌟' },
  '10-conversations': { label: '10 Conversations', icon: '🔥' },
  '50-conversations': { label: '50 Conversations', icon: '🏆' },
  '3-day-streak': { label: '3 Day Streak', icon: '⚡' },
  '7-day-streak': { label: '7 Day Streak', icon: '💪' },
  '30-day-streak': { label: '30 Day Streak', icon: '👑' },
  '1-hour-speaking': { label: '1 Hour Speaking', icon: '🎯' },
  '10-hours-speaking': { label: '10 Hours Speaking', icon: '🎤' },
  'vocab-50': { label: '50 Words Learned', icon: '📚' },
  '1000-xp': { label: '1000 XP Earned', icon: '💎' },
}
