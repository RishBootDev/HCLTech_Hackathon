package org.bootforce.aipoweredcareermentor.controller;



import lombok.RequiredArgsConstructor;
import org.bootforce.aipoweredcareermentor.model.ChatMessage;
import org.bootforce.aipoweredcareermentor.model.Quiz;
import org.bootforce.aipoweredcareermentor.service.GemmaService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;

import java.util.List;



@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class ChatBotController {

   private final GemmaService gemma;

    @PostMapping("/describe")
    public Flux<String> getAnalysis(@RequestParam String query, @RequestParam MultipartFile file) {

        return gemma.getAnalysis(query,file);

    }
    @PostMapping("/text")
    public Flux<String> getResponse(@RequestParam int profileId, @RequestParam String message) {
        return gemma.getResponse(profileId, message);
    }

    @GetMapping("/history/{profileId}")
    public List<ChatMessage> getChatHistory(@PathVariable int profileId) {
        return gemma.getChatHistory(profileId);
    }

    @PostMapping("/multiImages")
    public Flux<String> getAnalysis(@RequestParam String query,
                                    @RequestParam MultipartFile[] files) {

        return gemma.getAnalysis(query,files);
    }

    @PostMapping("/generateQuiz")
    public Quiz createRandomQuiz(@RequestBody Quiz quiz,@RequestParam String difficulty) throws Exception {
        return gemma.generateAndSaveQuestions(quiz,difficulty);
    }

    @PostMapping("/{currentCourse}/free")
    public Flux<String> getFreeResponse(@PathVariable String currentCourse,@RequestParam String message){

        return gemma.getFreeResponse(currentCourse,message);
    }

    @GetMapping(value = "/mock-interview", produces = "application/json")
    public String generateMockInterview(@RequestParam String role, @RequestParam(defaultValue = "Entry Level") String experience) {
        return gemma.generateMockInterview(role, experience);
    }

    @PostMapping(value = "/resume-review", produces = "application/json")
    public String reviewResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "role", required = false) String targetedRole) {
        return gemma.reviewResume(file, targetedRole);
    }

    @GetMapping(value = "/skill-gap/{profileId}", produces = "application/json")
    public String getSkillGapAnalysis(@PathVariable int profileId) {
        return gemma.getSkillGapAnalysis(profileId);
    }

    @GetMapping(value = "/learning-roadmap/{profileId}", produces = "application/json")
    public String generateLearningRoadmap(@PathVariable int profileId, @RequestParam String targetRole) {
        return gemma.generateLearningRoadmap(profileId, targetRole);
    }

    @PostMapping(value = "/resume-compatibility", produces = "application/json")
    public String getResumeCompatibility(
            @RequestParam("file") MultipartFile file,
            @RequestParam("jobDescription") String jobDescription) {
        return gemma.getResumeCompatibility(file, jobDescription);
    }

}
