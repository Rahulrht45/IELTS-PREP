// Demo questions for all IELTS sections when database is empty

export const DEMO_QUESTIONS = {
    reading: [],

    listening: [],

    writing: [],

    speaking: []
};

// Function to get demo questions by section
export const getDemoQuestionsBySection = (section) => {
    const sectionKey = section.toLowerCase();
    return DEMO_QUESTIONS[sectionKey] || [];
};

// Function to get a specific demo question by ID
export const getDemoQuestionById = (id) => {
    for (const section in DEMO_QUESTIONS) {
        const question = DEMO_QUESTIONS[section].find(q => q.id === id);
        if (question) return question;
    }
    return null;
};

// Function to get all demo questions
export const getAllDemoQuestions = () => {
    const allQuestions = [];
    for (const section in DEMO_QUESTIONS) {
        allQuestions.push(...DEMO_QUESTIONS[section]);
    }
    return allQuestions;
};
