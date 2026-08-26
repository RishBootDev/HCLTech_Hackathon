package org.bootforce.aipoweredcareermentor.controller;

import org.bootforce.aipoweredcareermentor.model.Lesson;
import org.bootforce.aipoweredcareermentor.model.Module;
import org.bootforce.aipoweredcareermentor.model.Tutorial;
import org.bootforce.aipoweredcareermentor.model.Profile;
import org.bootforce.aipoweredcareermentor.repository.ModuleRepository;
import org.bootforce.aipoweredcareermentor.repository.ProfileRepo;
import org.bootforce.aipoweredcareermentor.service.SmartLearnContentService;
import org.bootforce.aipoweredcareermentor.service.SmartLearnRecommendationService;
import org.bootforce.aipoweredcareermentor.service.SmartLearnTutorService;
import org.bootforce.aipoweredcareermentor.service.SmartLearnQuizService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/smartlearn")
@CrossOrigin
@RequiredArgsConstructor
public class SmartLearnController {

    private final SmartLearnContentService contentService;
    private final SmartLearnTutorService tutorService;
    private final SmartLearnRecommendationService recommendationService;
    private final SmartLearnQuizService quizService;
    private final ProfileRepo profileRepo;
    private final ModuleRepository moduleRepository;

    @PostMapping("/course/{courseId}/module")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MENTOR')")
    public ResponseEntity<Module> addModule(@PathVariable Integer courseId,
                                            @RequestParam String title,
                                            @RequestParam String description) {
        return ResponseEntity.ok(contentService.addModule(courseId, title, description));
    }

    @GetMapping("/course/{courseId}/modules")
    public ResponseEntity<List<Module>> getModulesByCourse(@PathVariable Integer courseId) {
        return ResponseEntity.ok(moduleRepository.findByCourseId(courseId));
    }

    @PostMapping("/module/{moduleId}/lesson")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MENTOR')")
    public ResponseEntity<Lesson> addLesson(@PathVariable Long moduleId,
                                            @RequestParam String title,
                                            @RequestParam(required = false) String content,
                                            @RequestParam(required = false) String videoUrl,
                                            @RequestParam(required = false) Integer durationMinutes,
                                            @RequestParam(required = false) MultipartFile file) {
        return ResponseEntity.ok(contentService.addLesson(moduleId, title, content, videoUrl, durationMinutes, file));
    }

    @PostMapping("/course/{courseId}/tutorial")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MENTOR')")
    public ResponseEntity<Tutorial> addTutorial(@PathVariable Integer courseId,
                                                @RequestBody Tutorial tutorial) {
        return ResponseEntity.ok(contentService.addTutorial(courseId, tutorial));
    }

    @GetMapping("/lesson/{lessonId}")
    public ResponseEntity<Lesson> getLessonById(@PathVariable Long lessonId) {
        return ResponseEntity.ok(contentService.getLessonById(lessonId));
    }

    @GetMapping("/module/{moduleId}/lessons")
    public ResponseEntity<List<Lesson>> getLessonsByModule(@PathVariable Long moduleId) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found: " + moduleId));
        return ResponseEntity.ok(module.getLessons());
    }

    @PostMapping("/tutor/ask")
    public ResponseEntity<String> askTutor(@RequestParam Integer profileId,
                                           @RequestParam(required = false) Long lessonId,
                                           @RequestParam String question,
                                           @RequestParam(defaultValue = "DOUBT") String modeStr) {
        Profile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        SmartLearnTutorService.TutorMode mode = SmartLearnTutorService.TutorMode.valueOf(modeStr.toUpperCase());
        return ResponseEntity.ok(tutorService.askTutor(profile, lessonId, question, mode));
    }

    @PostMapping("/tutor/ask-about-news")
    public ResponseEntity<String> askTutorAboutNews(@RequestParam Integer profileId,
                                                   @RequestParam Long articleId,
                                                   @RequestParam String question) {
        Profile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        return ResponseEntity.ok(tutorService.askTutorAboutNews(profile, articleId, question));
    }

    @GetMapping("/recommendation/next-lesson/{profileId}")
    public ResponseEntity<Map<String, Object>> getNextLessonRecommendation(@PathVariable Integer profileId) {
        Profile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        return ResponseEntity.ok(recommendationService.getNextLessonRecommendation(profile));
    }

    @GetMapping("/quiz/generate/{lessonId}")
    public ResponseEntity<String> generateQuiz(@PathVariable Long lessonId) {
        return ResponseEntity.ok(quizService.generateQuiz(lessonId));
    }

    @GetMapping("/quiz/generate-from-news/{articleId}")
    public ResponseEntity<String> generateArticleQuiz(@PathVariable Long articleId) {
        return ResponseEntity.ok(quizService.generateArticleQuiz(articleId));
    }

    @PostMapping("/quiz/attempt")
    public ResponseEntity<?> saveLessonAttempt(@RequestParam Integer profileId,
                                               @RequestParam Long lessonId,
                                               @RequestParam int score,
                                               @RequestParam(required = false) Integer totalQuestions,
                                               @RequestParam(required = false) Integer correctAnswers) {
        Profile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        return ResponseEntity.ok(quizService.saveAttempt(profile, lessonId, score, totalQuestions, correctAnswers));
    }

    @PostMapping("/lesson/video/progress")
    public ResponseEntity<?> saveVideoProgress(@RequestParam Integer profileId,
                                               @RequestParam Long lessonId,
                                               @RequestParam int videoProgress,
                                               @RequestParam(required = false, defaultValue = "0") int lastTimestampSeconds) {
        Profile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        return ResponseEntity.ok(quizService.saveVideoProgress(profile, lessonId, videoProgress, lastTimestampSeconds));
    }

    @GetMapping("/quiz/generate-from-skill/{skillName}")
    public ResponseEntity<String> generateSkillQuiz(@PathVariable String skillName) {
        return ResponseEntity.ok(quizService.generateSkillQuiz(skillName));
    }

    @PostMapping("/quiz/attempt-skill")
    public ResponseEntity<?> saveSkillAttempt(@RequestParam Integer profileId,
                                              @RequestParam String skillName,
                                              @RequestParam int score) {
        Profile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        return ResponseEntity.ok(quizService.saveSkillAttempt(profile, skillName, score));
    }

    @GetMapping("/progress/{profileId}")
    public ResponseEntity<List<?>> getLessonAttempts(@PathVariable Integer profileId) {
        Profile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        return ResponseEntity.ok(profile.getLessonAttempts());
    }

    @GetMapping("/progress/courses/{profileId}")
    public ResponseEntity<List<org.bootforce.aipoweredcareermentor.dto.CourseProgressDto>> getCourseProgress(@PathVariable Integer profileId) {
        Profile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        return ResponseEntity.ok(recommendationService.getCourseProgress(profile));
    }
}
