package org.bootforce.aipoweredcareermentor.service;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bootforce.aipoweredcareermentor.dto.FinalRoot;
import org.bootforce.aipoweredcareermentor.exception.AiServiceException;
import org.bootforce.aipoweredcareermentor.exception.ResourceNotFoundException;
import org.bootforce.aipoweredcareermentor.model.*;
import org.bootforce.aipoweredcareermentor.repository.ChatMessageRepository;
import org.bootforce.aipoweredcareermentor.repository.ProfileRepo;
import org.bootforce.aipoweredcareermentor.repository.QuizRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.DefaultChatClient;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import java.io.InputStream;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;


@Slf4j
@Service
@AllArgsConstructor
public class GemmaService {

    private ChatClient chatClient;
    private ProfileRepo repo;
    private QuizRepository quizRepo;
    private NotificationService nserv;
    private ChatMessageRepository chatRepo;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    private static final int MAX_HISTORY_MESSAGES = 20;

    public Flux<String> getAnalysis(String query, MultipartFile file) {
        String fileContent = extractText(file);
        String fullPrompt = query + "\n\n--- ATTACHED FILE CONTENT ---\n" + fileContent;

        return chatClient.prompt()
               // .tools(ExternalTools.class)
                .user(fullPrompt)
                .stream()
                .content();
    }

    public Flux<String> getAnalysis(String query, MultipartFile[] files) {
        StringBuilder allContent = new StringBuilder(query).append("\n\n--- ATTACHED FILES CONTENT ---\n");
        for (MultipartFile file : files) {
            allContent.append("\nFile [").append(file.getOriginalFilename()).append("]:\n")
                     .append(extractText(file)).append("\n---\n");
        }
        return chatClient.prompt()
                .user(allContent.toString())
                .stream()
                .content();
    }

    private String extractText(MultipartFile file) {
        if (file == null || file.isEmpty()) return "";
        
        String contentType = file.getContentType();
        if (contentType == null) contentType = "";
        
        try (InputStream is = file.getInputStream()) {
            if (contentType.contains("pdf")) {
                try (PDDocument document = Loader.loadPDF(file.getBytes())) {
                    return new PDFTextStripper().getText(document);
                }
            } else if (contentType.contains("officedocument.wordprocessingml")) {
                try (XWPFDocument doc = new XWPFDocument(is);
                     XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
                    return extractor.getText();
                }
            } else if (contentType.contains("msword")) {
                try (HWPFDocument doc = new HWPFDocument(is);
                     WordExtractor extractor = new WordExtractor(doc)) {
                    return extractor.getText();
                }
            } else {
                return new String(file.getBytes());
            }
        } catch (Exception e) {
            log.error("Failed to extract text from file: " + file.getOriginalFilename(), e);
            return "[Error extracting text from " + file.getOriginalFilename() + "]";
        }
    }

    public String generateMockInterview(String role, String experience) {
        String prompt = """
            You are an expert technical interviewer and HR manager.
            Generate exactly 5 realistic mock interview questions for the role of "%s" with "%s" experience.
            
            Return ONLY a valid JSON array of objects. Exactly 5 questions.
            Each object must adhere to this EXACT structure:
            {
              "question": "string",
              "type": "string", // "Technical", "Behavioral", or "Situational"
              "hint": "string", // 1-2 sentence tip on how to answer effectively
              "expectedKeywords": ["string"] // 3-4 keywords the candidate should mention
            }
            
            Do NOT include any extra text, and do NOT include markdown block characters (like ```json), just the raw JSON.
            """.formatted(role, experience);

        String response = chatClient.prompt(prompt).call().content();
        return cleanJsonResponse(response);
    }


    public String reviewResume(MultipartFile file, String targetedRole) {
        String prompt = """
            You are an expert career coach and technical expert
            Review the attached resume for the targeted role of "%s".
            
            Provide an actionable, structured review in valid JSON format.
            Return ONLY a JSON object that matches this EXACT schema:
            {
              "overallScore": 0, // Number 1-100
              "strengths": ["string"], // Top 3 strengths
              "weaknesses": ["string"], // Things missing or poorly framed 
              "actionableTips": ["string"], // 3-4 highly specific tips for improvement
              "atsOptimization": "string" // A small paragraph explaining ATS compatibility feedback
            }
            
            Do NOT include markdown blocks. Output only the raw JSON.
            """.formatted(targetedRole != null ? targetedRole : "General Request");

        String fileContent = extractText(file);
        String finalPrompt = prompt + "\n\n--- RESUME CONTENT ---\n" + fileContent;

        String response = chatClient.prompt()
                .user(finalPrompt)
                .call()
                .content();
        return cleanJsonResponse(response);
    }

    public String getSkillGapAnalysis(int profileId) {
        Profile profile = repo.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));
                
        String currentSkills = profile.getSkills() != null ? profile.getSkills() : "None";
        String targetIndustry = profile.getCourseRecommendations() != null 
                && profile.getCourseRecommendations().getIndustry() != null 
                ? profile.getCourseRecommendations().getIndustry() : "General";
                
        String currentRole = profile.getPreference() != null ? profile.getPreference() : "Entry Level";

        String prompt = """
            You are a senior talent acquisition specialist mapping out developer and professional career trajectories.
            Calculate the exact "Skill Gap" for a user striving to enter the "%s" industry as a "%s".
            
            The user currently possesses these skills: %s.
            
            Return ONLY a JSON object representing the skill gap. Must match EXACTLY:
            {
               "missingCriticalSkills": ["string"], // 3 to 5 core skills missing that are mandatory
               "niceToHaveSkills": ["string"], // 2 to 3 skills that provide an edge
               "learningResources": ["string"], // 2 to 3 recommended approaches or tools to learn the missing skills
               "estimatedTimeToBridge": "string" // Realistically how long to bridge the gap (e.g., "3 to 6 months")
            }
            
            Do NOT include markdown blocks. Output only the raw JSON.
            """.formatted(targetIndustry, currentRole, currentSkills);

        String response = chatClient.prompt(prompt).call().content();
        return cleanJsonResponse(response);
    }

    public String generateLearningRoadmap(int profileId, String targetRole) {
        Profile profile = repo.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));
        String currentSkills = profile.getSkills() != null ? profile.getSkills() : "None";

        String prompt = """
            You are an expert technical career coach.
            Generate a comprehensive 4-week learning roadmap for a user whose current skills are "%s" and who wants to become a "%s".
            
            Return ONLY a valid JSON object. It must match exactly this schema:
            {
              "weeks": [
                {
                  "weekNo": 1,
                  "days": [
                    {
                      "dayNo": 1,
                      "title": "string",
                      "description": "string",
                      "youtubeSearchQuery": "string", // Example: 'React hooks complete guide'
                      "articleLinks": ["string"] // 2-3 real URLs like 'https://react.dev'
                    }
                  ]
                }
              ]
            }
            Ensure 7 days a week, 4 weeks total. Provide actionable topics for the target role.
            DO NOT output any extra text, only the raw JSON string. Do not use block characters.
            """.formatted(currentSkills, targetRole);

        String response = chatClient.prompt(prompt).call().content();
        return cleanJsonResponse(response);
    }

    public String getResumeCompatibility(MultipartFile file, String jobDescription) {
        String prompt = """
            Analyze the following resume against the provided job description.
            
            Provide actionable 'improvementSuggestions' limited to exactly 2-3 lines.
            
            Return ONLY a JSON response containing strictly this schema:
            {
              "compatibilityScore": 0, // 0-100
              "skillMatchScore": 0, // 0-100
              "experienceScore": 0, // 0-100
              "analysisSummary": "string", // Concise summary
              "skillGaps": [
                {
                  "skillName": "string",
                  "gapLevel": 5, // 1-5 where 5 is critical
                  "improvementSuggestions": "string"
                }
              ]
            }
            Job Description:
            %s
            
            Do NOT include markdown blocks. Output only the raw JSON.
            """.formatted(jobDescription);
        
        String fileContent = extractText(file);
        String finalPrompt = prompt + "\n\n--- RESUME CONTENT ---\n" + fileContent;

        String response = chatClient.prompt()
                .user(finalPrompt)
                .call()
                .content();
        return cleanJsonResponse(response);
    }


    public Flux<String> getResponse(int profileId, String message) {
        Profile profile = repo.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        List<ChatMessage> history = chatRepo.findByProfileIdOrderByTimestampAsc(profileId);
        int fromIndex = Math.max(0, history.size() - MAX_HISTORY_MESSAGES);
        List<ChatMessage> recentHistory = history.subList(fromIndex, history.size());

        boolean isMentor = profile.getUser() != null && "MENTOR".equals(profile.getUser().getRole().name());

        StringBuilder contextBuilder = new StringBuilder();
        if (isMentor) {
            contextBuilder.append("You are an AI assistant designed to support human career mentors. ")
                    .append("Help the mentor by providing resources, industry insights, pedagogical advice, and strategies to effectively guide their students.\n")
                    .append("Be concise, analytical, and highly professional.\n\n");
        } else {
            contextBuilder.append("You are a highly experienced Indian career counselor and mentor. ")
                    .append("Help students with career guidance, course selection, skills development, and professional growth.\n")
                    .append("Be concise, practical, and encouraging.\n\n");
        }

        if (!recentHistory.isEmpty()) {
            contextBuilder.append("Previous conversation:\n");
            for (ChatMessage msg : recentHistory) {
                contextBuilder.append(msg.getRole()).append(": ").append(msg.getContent()).append("\n");
            }
            contextBuilder.append("\n");
        }

        contextBuilder.append("USER: ").append(message).append("\nAI:");

        String prompt = contextBuilder.toString();

        ChatMessage userMsg = ChatMessage.builder()
                .content(message)
                .role("USER")
                .profile(profile)
                .build();
        chatRepo.save(userMsg);

        StringBuilder fullAiResponse = new StringBuilder();

        return chatClient.prompt(prompt)
                .stream()
                .content()
                .doOnNext(fullAiResponse::append)
                .doOnComplete(() -> Schedulers.boundedElastic().schedule(() -> {
                    try {
                        ChatMessage aiMsg = ChatMessage.builder()
                                .content(fullAiResponse.toString())
                                .role("AI")
                                .profile(profile)
                                .build();
                        chatRepo.save(aiMsg);
                    } catch (Exception e) {
                        System.err.println("Failed to save AI chat message: " + e.getMessage());
                    }
                }));
    }

    public List<ChatMessage> getChatHistory(int profileId) {
        return chatRepo.findByProfileIdOrderByTimestampAsc(profileId);
    }

    public Flux<String> getFreeResponse(String currentCourse, String text) {
        String prompt = "You are a helpful educational assistant. Provide relevant details regarding education, " +
                "career trajectories, and all relevant information for the following query: \"" + text + "\". " +
                "The current course context is: " + currentCourse + ". " +
                "Keep the response concise — use only key points or headings. Plain text only, no markdown.";

        return chatClient.prompt(prompt)
                .stream()
                .content();
    }

    @Transactional
    public CourseRecommendation getCourseRecommendation(int profileId, FinalRoot root) throws JsonProcessingException {

        Profile profile = repo.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found with ID: " + profileId));

        String jsonString = objectMapper.writeValueAsString(root);
        String preference = profile.getPreference() != null ? profile.getPreference() : "Not specified";

        String educationLevel = profile.getEducationLevel();
        boolean isClass10Student = educationLevel != null && educationLevel.contains("10");

        String prompt = isClass10Student
                ? buildClass10Prompt(jsonString, preference)
                : buildClass12Prompt(jsonString, preference, root.quizTitle);

        String aiResponse = chatClient.prompt(prompt).call().content();

        if (aiResponse == null || aiResponse.isBlank()) {
            throw new AiServiceException("AI returned an empty response for course recommendation");
        }

        aiResponse = cleanJsonResponse(aiResponse);

        Pattern pattern = Pattern.compile("\\{.*\\}", Pattern.DOTALL);
        Matcher matcher = pattern.matcher(aiResponse);
        if (matcher.find()) {
            aiResponse = matcher.group();
        } else {
            throw new AiServiceException("Could not extract JSON from AI response: " + aiResponse);
        }

        System.out.println("[CourseRecommendation] AI Response: " + aiResponse);

        CourseRecommendation recommendation = objectMapper.readValue(aiResponse, CourseRecommendation.class);

       CourseRecommendation existing = profile.getCourseRecommendations();
        if (existing != null) {
            existing.setCourseName(recommendation.getCourseName());
            existing.setDescription(recommendation.getDescription());
            existing.setCareerPath(recommendation.getCareerPath());
            existing.setIndustry(recommendation.getIndustry());
            profile.setCourseRecommendations(existing);
        } else {
            profile.setCourseRecommendations(recommendation);
        }

        repo.save(profile);
        return profile.getCourseRecommendations();
    }

    @Transactional
    public List<College> RecommendColleges(int profileId, String cityPreference) {
        Profile profile = repo.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with profile id: " + profileId));

        String prompt = buildCollegePrompt(profileId, cityPreference, profile);
        String jsonResponse = chatClient.prompt(prompt).call().content();

        if (jsonResponse == null || jsonResponse.isBlank()) {
            throw new AiServiceException("AI returned empty response for college recommendation");
        }

        jsonResponse = cleanJsonResponse(jsonResponse);

        Pattern pattern = Pattern.compile("\\[.*?\\]", Pattern.DOTALL);
        Matcher matcher = pattern.matcher(jsonResponse);

        if (!matcher.find()) {
            throw new AiServiceException("AI service error: could not match JSON array in response: " + jsonResponse);
        }

        String cleanedJson = matcher.group();
        try {
            List<College> collegeList = objectMapper.readValue(cleanedJson, new TypeReference<List<College>>() {});

            List<College> newColleges = new ArrayList<>(collegeList);
            profile.getSavedColleges().clear();
            profile.getSavedColleges().addAll(newColleges);

            repo.save(profile);
            return new ArrayList<>(profile.getSavedColleges());
        } catch (Exception e) {
            throw new AiServiceException("Failed to parse college JSON from AI response: " + cleanedJson, e);
        }
    }

    @Transactional
    public Quiz generateAndSaveQuestions(Quiz quiz, String difficulty) {
        String title = quiz.getTitle();
        int numberOfQuestions = (quiz.getNumQ() != null && quiz.getNumQ() > 0) ? quiz.getNumQ() : 10;
        String category = (quiz.getCategory() != null) ? quiz.getCategory() : "General Knowledge";

        String difficultyInstruction = (difficulty == null || difficulty.isBlank())
                ? "Distribute the questions evenly across Easy, Medium, and Hard difficulty levels."
                : "All questions must have the difficulty level \"" + difficulty + "\".";

        String promptTemplate = """
            You are an expert in creating high-quality multiple-choice quiz questions.
            
            Task:
            Generate exactly %d multiple-choice quiz questions for a quiz titled "%s".
            
            Each question must strictly follow this JSON structure:
            {
              "questionTitle": "string",
              "option1": "string",
              "option2": "string",
              "option3": "string",
              "option4": "string",
              "rightAnswer": "string",
              "category": "string",
              "difficultyLevel": "string"
            }
            
            Rules:
            1. The "category" for all questions must be "%s".
            2. The "difficultyLevel" must be one of: "Easy", "Medium", "Hard".
               %s
            3. Each question must have four unique and plausible options.
            4. The "rightAnswer" must exactly match one of the four options verbatim.
            5. Do NOT include any field named "qid" — it is auto-generated.
            6. Output ONLY a valid JSON array with no extra text, no explanations, and no markdown.
            
            Now generate %d such questions.
            """.formatted(numberOfQuestions, title, category, difficultyInstruction, numberOfQuestions);

        String aiResponse;
        try {
            aiResponse = chatClient.prompt(promptTemplate).call().content();
        } catch (Exception e) {
            throw new AiServiceException("Failed to get response from AI model: " + e.getMessage(), e);
        }

        if (aiResponse == null || aiResponse.isBlank()) {
            throw new AiServiceException("AI returned an empty response for quiz generation");
        }

        aiResponse = cleanJsonResponse(aiResponse);

        Pattern pattern = Pattern.compile("\\[.*?\\]", Pattern.DOTALL);
        Matcher matcher = pattern.matcher(aiResponse);
        if (matcher.find()) {
            aiResponse = matcher.group();
        } else {
            System.err.println("[QuizGen] No JSON array found in AI response: " + aiResponse);
            throw new AiServiceException("No valid JSON array found in AI quiz generation response");
        }

        try {
            List<Question> questions = objectMapper.readValue(aiResponse, new TypeReference<List<Question>>() {});

            if (questions == null || questions.isEmpty()) {
                throw new AiServiceException("No questions could be parsed from AI response");
            }

            for (Question q : questions) {
                if (q.getCategory() == null || q.getCategory().isBlank()) {
                    q.setCategory(category);
                }
                if (q.getDifficultyLevel() == null || q.getDifficultyLevel().isBlank()) {
                    q.setDifficultyLevel(difficulty != null && !difficulty.isBlank() ? difficulty : "Medium");
                }
            }

            List<Question> list = quiz.getQuestionList();
            if (list == null) {
                list = new ArrayList<>();
                quiz.setQuestionList(list);
            }

            list.addAll(questions);
            quiz.setNumQ(list.size());

            if (quiz.getTempCreatorId() != null) {
                repo.findById(quiz.getTempCreatorId()).ifPresent(quiz::setCreator);
            }

            return quizRepo.save(quiz);
        } catch (AiServiceException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("[QuizGen] Failed to parse AI response: " + aiResponse);
            throw new AiServiceException("Failed to parse quiz questions from AI response: " + e.getMessage(), e);
        }
    }


    /**
     * Strips markdown code fences and trims whitespace from an AI response.
     * Handles both opening (```json) and closing (```) fences.
     */
    private String cleanJsonResponse(String response) {
        if (response == null) return "";
        response = response.trim();
        
        // Remove common markdown fences first
        response = response.replaceAll("(?m)^```[a-zA-Z]*\\s*", "");
        response = response.replaceAll("(?m)^```\\s*$", "");

        Pattern pattern = Pattern.compile("(\\[[\\s\\S]*\\]|\\{[\\s\\S]*\\})", Pattern.DOTALL);
        Matcher matcher = pattern.matcher(response);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        
        return response.trim();
    }

    private String buildCollegePrompt(int profileId, String cityPreference, Profile profile) {
        String userLocation = profile.getLocation();
        CourseRecommendation course = profile.getCourseRecommendations();

        if (course == null) {
            throw new RuntimeException("No course recommendation found for profile ID: " + profileId +
                    ". Please complete the course recommendation quiz first.");
        }

        String finalLocation = (cityPreference != null && !cityPreference.isBlank()) ? cityPreference : userLocation;
        if (finalLocation == null || finalLocation.isBlank()) {
            finalLocation = "India";
        }

        return """
        You are an expert educational guide. Based on the provided location and the course recommendation,
        return a list of exactly 5 nearby **government colleges** that offer programs in the given course field.

        Details:
        Location: %s
        Course: %s

        Return ONLY a JSON array of exactly 5 colleges. Each college must follow this exact schema:
        {
          "collegeName": "string",
          "address": "string",
          "city": "string",
          "state": "string",
          "pincode": "string",
          "contact": "string",
          "email": "string",
          "course": "string",
          "facilities": "string"
        }

        Do NOT include any explanations, markdown, or extra text. Return ONLY the JSON array.
        """.formatted(finalLocation, course.getCourseName());
    }

    private String buildClass10Prompt(String jsonString, String preference) {
        return new StringBuilder()
                .append("You are a highly experienced Indian career counselor and strict rule-based assistant.\n")
                .append("Your job is to recommend the most suitable **stream** (Class 11-12 specialization) for a Class 10 student.\n")
                .append("You must strictly follow the rules below to analyze the student's quiz results and personal preference.\n\n")

                .append("⚠ QUIZ STRUCTURE ⚠\n")
                .append("The quiz has a total of 20 questions, divided into 4 fixed sections of 5 questions each:\n")
                .append("1. Questions 1-5 → Aptitude\n")
                .append("2. Questions 6-10 → Science\n")
                .append("3. Questions 11-15 → Mathematics\n")
                .append("4. Questions 16-20 → Social Science\n\n")

                .append("STEP 1: Evaluate the quiz performance:\n")
                .append("1. For each section, count the number of correct answers.\n")
                .append("2. Calculate the percentage score for each section separately.\n")
                .append("3. Identify the student's strongest and weakest sections.\n\n")

                .append("SECTION INTERPRETATION:\n")
                .append("- Aptitude strong → Lean towards PCM (Engineering/Tech focus).\n")
                .append("- Science strong → Lean towards PCB (Medical/Life Sciences).\n")
                .append("- Mathematics strong → Supports PCM, or PCMB if Science is also strong.\n")
                .append("- Social Science strong → Lean towards Commerce or Fine Arts.\n\n")

                .append("STEP 2: Determine Recommended Stream:\n")
                .append("Use the following decision rules strictly:\n")
                .append("1. If both Science and Maths are strong → Recommend PCMB.\n")
                .append("2. If Science is strong but Maths is weak → Recommend PCB.\n")
                .append("3. If Maths is strong but Science is weak → Recommend PCM.\n")
                .append("4. If Aptitude is strong but others are weak → Recommend PCM.\n")
                .append("5. If Social Science is strongest → Recommend Commerce or Fine Arts based on preference.\n")
                .append("6. If all areas are weak → Recommend Fine Arts (default safe stream).\n\n")

                .append("⚖ Weightage Rule:\n")
                .append("- Final recommendation is based on 60% weightage to student's preference and 40% to quiz performance.\n")
                .append("- If there is a conflict between performance and preference, the stream closest to the student's preference should be chosen unless performance is very poor (<40%).\n\n")

                .append("⚠ STRICT RULE: The 'courseName' value in your final JSON MUST exactly match one of these database values:\n")
                .append("- PCM\n")
                .append("- PCB\n")
                .append("- PCMB\n")
                .append("- Fine Arts\n")
                .append("- Commerce\n\n")

                .append("Descriptions for each stream:\n")
                .append("PCM → Science stream focusing on Physics, Chemistry, and Mathematics. Prepares students for engineering, tech, and analytical fields.\n")
                .append("PCB → Science stream focusing on Physics, Chemistry, and Biology. Foundation for medical and life sciences.\n")
                .append("PCMB → Combination of PCM and PCB providing both medical and engineering foundations.\n")
                .append("Fine Arts → Focus on visual and performing arts including painting, sculpture, music, and design.\n")
                .append("Commerce → Focus on accounting, finance, business management, economics, and entrepreneurship.\n\n")

                .append("⚠ OUTPUT FORMAT — return ONLY this JSON object with no other text:\n")
                .append("{\n")
                .append("  \"courseName\": \"string\",\n")
                .append("  \"description\": \"string\",\n")
                .append("  \"careerPath\": \"string\",\n")
                .append("  \"industry\": \"string\"\n")
                .append("}\n\n")

                .append("❌ Do NOT include any extra text, markdown, or explanations outside the JSON.\n")
                .append("❌ Do NOT return graduation course names like B.Tech or MBBS. Only recommend one of the five streams.\n\n")

                .append("Quiz JSON data:\n").append(jsonString).append("\n\n")
                .append("Student preference:\n").append(preference).append("\n\n")

                .append("Final Safety Check before answering:\n")
                .append("1. Ensure courseName exactly matches one of the 5 allowed database values.\n")
                .append("2. Ensure JSON structure is correct with only four keys.\n")
                .append("3. Output ONLY the JSON object, nothing else.")
                .toString();
    }

    private String buildClass12Prompt(String jsonString, String preference, String quizTitle) {
        return new StringBuilder()
                .append("You are a highly experienced Indian career counselor and strict rule-based assistant.\n")
                .append("Your job has TWO critical steps:\n")
                .append("STEP 1: Evaluate the student's raw quiz answers and calculate their percentage score.\n")
                .append("STEP 2: Based ONLY on the calculated score, the quiz title (stream), and the student's stated preference, recommend ONE valid undergraduate course.\n\n")

                .append("⚠️ STRICT RULES ⚠️\n")
                .append("1. You MUST complete STEP 1 before proceeding to STEP 2.\n")
                .append("2. The student's stream is determined ONLY by the quiz title provided below.\n")
                .append("3. Your final output must be STRICTLY valid JSON — no extra text, no explanations, no markdown.\n")
                .append("4. If the stream is PCB, NEVER recommend a PCM course like B.Tech or Engineering-related courses.\n")
                .append("5. Combine weightage: 60% student's stated preference + 40% calculated performance.\n\n")

                .append("STEP 1: EVALUATE RAW QUIZ DATA:\n")
                .append("For each question, compare selectedOptionText or selectedOptionId with correctOptionText or correctOptionId.\n")
                .append("Count total questions → TOTAL_QUESTIONS.\n")
                .append("Count total correct answers → TOTAL_CORRECT.\n")
                .append("Calculate PERCENTAGE = (TOTAL_CORRECT / TOTAL_QUESTIONS) * 100.\n\n")

                .append("Performance Interpretation:\n")
                .append("- >= 80% → Strong performance\n")
                .append("- >= 60% and < 80% → Average performance\n")
                .append("- < 60% → Weak performance\n\n")

                .append("STEP 2: DETERMINE STREAM BASED ON QUIZ TITLE:\n")
                .append("- 'PCM' quiz title → PCM stream\n")
                .append("- 'PCB' quiz title → PCB stream\n")
                .append("- 'PCMB' quiz title → PCMB stream\n")
                .append("- 'COMMERCE' quiz title → Commerce stream\n")
                .append("- 'FINE ARTS' quiz title → Fine Arts stream\n\n")

                .append("ALLOWED COURSE NAMES (courseName must exactly match one of these — do not modify, extend, or combine them):\n\n")
                .append("PCM → B.Tech\n\n")
                .append("PCB → MBBS, BDS, BAMS, BHMS, BUMS, BPT, B.Pharm, B.Sc Nursing, B.Sc Biotechnology, B.Sc Microbiology, B.Sc Genetics, B.V.Sc, B.Sc Agriculture, B.Sc Forestry\n\n")
                .append("Commerce → B.Com, B.Com (Hons), BBA, BBM, BMS, BA Economics, CA, CS, CFA, B.Voc, B.Sc Finance, B.Sc Banking\n\n")
                .append("Fine Arts → BA\n\n")
                .append("PCMB → Can select from either PCM or PCB list above.\n\n")

                .append("FINAL OUTPUT FORMAT — return ONLY this JSON with no other text:\n")
                .append("{\n")
                .append("  \"courseName\": \"string\",\n")
                .append("  \"description\": \"string\",\n")
                .append("  \"careerPath\": \"string\",\n")
                .append("  \"industry\": \"string\"\n")
                .append("}\n\n")

                .append("Where:\n")
                .append("- 'courseName' is exactly one from the allowed list for that stream.\n")
                .append("- 'description' explains what the course teaches (max 50 words).\n")
                .append("- 'careerPath' lists top job roles or future study options.\n")
                .append("- 'industry' specifies the primary industry for this course.\n\n")

                .append("QUIZ TITLE (Determines Stream): ").append(quizTitle).append("\n\n")
                .append("RAW QUIZ JSON DATA:\n").append(jsonString).append("\n\n")
                .append("STUDENT PREFERENCE:\n").append(preference).append("\n\n")

                .append("⚠️ Final Rule: Output ONLY the JSON object. No explanations, no markdown, no extra text.")
                .toString();
    }


    @Tool(description = "ye tool tickets book karta hai")
    public Object bookTicket(@ToolParam String request) {
        // business logic

        return new Object();
    }
}
