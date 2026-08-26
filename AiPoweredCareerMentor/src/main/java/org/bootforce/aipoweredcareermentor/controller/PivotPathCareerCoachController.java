package org.bootforce.aipoweredcareermentor.controller;

import lombok.RequiredArgsConstructor;
import org.bootforce.aipoweredcareermentor.dto.SkillGapReport;
import org.bootforce.aipoweredcareermentor.service.ExternalTools;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin
@RestController
@RequestMapping("/api/coach")
@RequiredArgsConstructor
public class PivotPathCareerCoachController {

    private final ChatClient chatClient;
    private final VectorStore vectorStore;
    private final ChatMemory chatMemory;
    private final ExternalTools tools;


    @GetMapping("/history/{chatId}")
    public List<Message> getChatHistory(@PathVariable String chatId) {
        return chatMemory.get(chatId);
    }

    @PostMapping("/analyze-gap")
    public SkillGapReport analyzeGap(@RequestBody String jobDescription) {

        return chatClient.prompt()
                .advisors(
                        QuestionAnswerAdvisor.builder(vectorStore)
                                .searchRequest(SearchRequest.builder()
                                        .filterExpression("category == 'RESUME'")
                                        .topK(3).build())
                                .build()
                )
                .system("""
                 You are a Senior Technical Recruiter. 
                 STRICT RULES:
                 1. Compare Resume (Context) vs Job Description.
                 STRICT TRUTH RULES:
                     1. ZERO HALLUCINATION: Only list a skill as 'Matched' if the EXACT word or a direct synonym exists in the resume.
                     2. JAVA vs JAVASCRIPT: Treat Java and JavaScript as COMPLETELY different languages. If the resume has JavaScript but not Java, mark Java as MISSING.
                     3. COURSEWORK IS NOT EXPERIENCE: Just because they studied 'OOP' does not mean they know 'Java'. Check the 'Programming Languages' section specifically.
                     4. BE SKEPTICAL: It is better to list a skill as missing than to incorrectly mark it as matched.
                 """)
                .user(u -> u.text("""
                    Job Description: {jd}
                    """)
                        .param("jd", jobDescription))
                .call()
                .entity(SkillGapReport.class);

    }

    @PostMapping("/chat")
    public String chatWithCoach(@RequestParam String message, @RequestParam String chatId) {
        List<Document> courseDocuments = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(message)
                        .filterExpression("category == 'COURSE'")
                        .topK(5)
                        .build()
        );

        String courseContext = courseDocuments.stream()
                .map(doc -> String.format("--- COURSE ENTRY ---\n%s", doc.getText()))
                .collect(Collectors.joining("\n\n"));
                
        return chatClient.prompt()
                .advisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                .advisors(a -> a.param("chat_memory_conversation_id", chatId))
                .advisors(new SimpleLoggerAdvisor())
                .tools(tools)
                .system("""
                You are a Career Mentor and Technical Advisor.
                ENTRY RULES:
                        - If the user says 'Matched Skill: [SkillName]', greet them and ask if they are ready for a 5-question Mastery Quiz.
                        - If the user says 'Deep Dive: [SkillName]', explain its industry importance and suggest a course.   
                       CONTEXT HANDLING:
                    - You have access to the previous conversation history.
                    
                YOUR GOALS:
                1. Explain 'WHY': If a user asks about a missing skill, explain its practical use in the industry.
                2. MOTIVATE: Be encouraging but realistic about the effort required.
                QUIZ MODE RULES:
                            1. If the user chooses a 'Mastery Quiz', you must track the state: [Question X/5, Current Score: Y].
                            2. Start at 'Medium' difficulty.
                            3. SCALING:
                               - If Correct: Increase difficulty (Advanced/Architect level).
                               - If Incorrect: Slightly increase difficulty (stay at current level but ask a different concept).
                            4. ONE BY ONE: Ask only one MCQ at a time. Wait for the user's answer.
                            5. FEEDBACK: After each answer, say 'Correct' or 'Incorrect', explain why, then provide the next question.
                            QUIZ FORMATTING RULES:
                                    1. Always present the Question on its own line.
                                    2. Present each MCQ option (A, B, C, D) on a NEW line.
                                    3. Use bolding for the Question text (e.g., **Question 1: ...**).
                                    Example:
                                    **Question 1: What is the purpose of the 'volatile' keyword in Java?**
                                    A) To cache variables
                                    B) To ensure visibility of changes to variables across threads
                                    C) To prevent inheritance
                                    D) To make a variable constant
                            ENDING THE QUIZ:
                            - After 5 questions, calculate the final score.
                            - If Score >= 4: Say 'You are an expert at this skill! You are ready for the interview.'
                            - If Score < 4: Say 'You have a good start, but need more practice.'
                            - THEN: Search for the skill in your context. Suggest a course from the catalog.
                              (Keep your existing CONTEXT HANDLING, GOALS, and QUIZ rules...)
                        ADDITIONAL FORMATTING RULE:
                           - When recommending a course (from catalog or tool), you MUST use Markdown: [Course Name](URL).
                           - This allows the user to click the link and open it in a new tab.
                           - IF NOT in catalog: Call the 'fetchWebTutorials(skillName)' tool automatically.
                                you have to give course recommendation only and only if the user has selected the missing skill or the user failed to answer more than 2 out 5 questions from the quiz.
                           -  DO NOT repeat the tool call if you already have the 'TOOL_RESULT'.
                           -   When calling a tool, you must follow the function calling syntax exactly: <function=toolName>{"arg": "val"}</function>. Do not add spaces inside the function brackets.
                STRICT RULES:
                  1. Answer the user's question DIRECTLY.
                  2. If the user provides an answer to a quiz (e.g., "A", "B"), respond only with the result and explanation.
                Keep responses concise and professional.
                """)
                .user(u -> u.text("""
                USER MESSAGE: {msg}
                
                INTERNAL COURSE CATALOG:
                {courses}
                """)
                .param("msg", message)
                .param("courses", courseContext.isEmpty() ? "No matching courses in catalog." : courseContext))
                .call()
                .content();
    }
}
