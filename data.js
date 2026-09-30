window.BUNDLED_TESTS = [
  {
    id: "starter-present-continuous",
    conceptGroup: "Tenses & Time",
    grammarFocus: "Present Continuous",
    title: "Present Continuous: actions happening now",
    sourceBook: "Starter Review",
    sourceUnit: "Unit 1",
    level: "Elementary",
    description: "Build am/is/are + V-ing and avoid common agreement mistakes.",
    color: "#2563eb",
    questions: [
      { id: "pc-1", type: "choice", prompt: "Look! Mia ___ for her English test.", choices: ["studies", "is studying", "study", "studied"], answers: ["is studying"], explanation: "Use is + studying for an action happening now.", errorTag: "missing-be" },
      { id: "pc-2", type: "correction", prompt: "Correct the sentence: They playing soccer now.", answers: ["They are playing soccer now."], explanation: "The present continuous needs a form of be before the -ing verb.", errorTag: "missing-be" },
      { id: "pc-3", type: "choice", prompt: "Which sentence is correct?", choices: ["She not is sleeping.", "She isn't sleeping.", "She doesn't sleeping.", "She no sleeping."], answers: ["She isn't sleeping."], explanation: "Put not after is: she is not / she isn't sleeping.", errorTag: "negative-form" },
      { id: "pc-4", type: "text", prompt: "Complete the sentence: I ___ (write) an email right now.", answers: ["am writing", "I'm writing"], explanation: "With I, use am + writing.", errorTag: "be-agreement" },
      { id: "pc-5", type: "correction", prompt: "Correct the sentence: The boys is running in the park.", answers: ["The boys are running in the park."], explanation: "The plural subject boys takes are, not is.", errorTag: "be-agreement" }
    ]
  },
  {
    id: "starter-past-simple",
    conceptGroup: "Tenses & Time",
    grammarFocus: "Past Simple",
    title: "Past Simple: completed past events",
    sourceBook: "Starter Review",
    sourceUnit: "Unit 2",
    level: "Junior High",
    description: "Review irregular verbs, negatives, questions, and past forms of be.",
    color: "#7c3aed",
    questions: [
      { id: "ps-1", type: "choice", prompt: "Yesterday, we ___ to the science museum.", choices: ["go", "went", "gone", "are going"], answers: ["went"], explanation: "Went is the past form of go.", errorTag: "irregular-verb" },
      { id: "ps-2", type: "correction", prompt: "Correct the sentence: Kevin didn't went to school yesterday.", answers: ["Kevin didn't go to school yesterday.", "Kevin did not go to school yesterday."], explanation: "After did not, use the base verb go.", errorTag: "did-base-verb" },
      { id: "ps-3", type: "choice", prompt: "My parents ___ at home last night.", choices: ["was", "were", "are", "be"], answers: ["were"], explanation: "The plural subject parents takes were.", errorTag: "past-be" },
      { id: "ps-4", type: "text", prompt: "Write the past form of see.", answers: ["saw"], explanation: "See is irregular: see → saw → seen.", errorTag: "irregular-verb" },
      { id: "ps-5", type: "correction", prompt: "Correct the question: Did she finished her homework?", answers: ["Did she finish her homework?"], explanation: "After Did, use the base form finish.", errorTag: "did-base-verb" }
    ]
  },
  {
    id: "starter-noun-clauses",
    conceptGroup: "Clauses & Connections",
    grammarFocus: "Noun Clauses",
    title: "Noun Clauses: statement word order",
    sourceBook: "Starter Review",
    sourceUnit: "Unit 3",
    level: "FCE",
    description: "Use statement word order after question words, whether, and if.",
    color: "#059669",
    questions: [
      { id: "nc-1", type: "choice", prompt: "I don't know ___.", choices: ["where does he live", "where he lives", "where he does live", "he lives where"], answers: ["where he lives"], explanation: "A noun clause uses statement word order: where + subject + verb.", errorTag: "clause-word-order" },
      { id: "nc-2", type: "correction", prompt: "Correct the sentence: Can you tell me what time does the train leave?", answers: ["Can you tell me what time the train leaves?"], explanation: "Do not use question inversion inside the noun clause.", errorTag: "clause-word-order" },
      { id: "nc-3", type: "choice", prompt: "I wonder ___ the shop is still open.", choices: ["that", "what", "whether", "because"], answers: ["whether"], explanation: "Use whether or if for an embedded yes/no question.", errorTag: "whether-if" },
      { id: "nc-4", type: "choice", prompt: "Which sentence is correct?", choices: ["What she said was true.", "What did she say was true.", "What she did say it was true.", "That what she said was true."], answers: ["What she said was true."], explanation: "The whole noun clause What she said functions as the subject.", errorTag: "noun-clause-function" },
      { id: "nc-5", type: "correction", prompt: "Correct the sentence: I wonder where is he.", answers: ["I wonder where he is."], explanation: "Use subject + verb order inside an embedded question.", errorTag: "clause-word-order" }
    ]
  }
];
