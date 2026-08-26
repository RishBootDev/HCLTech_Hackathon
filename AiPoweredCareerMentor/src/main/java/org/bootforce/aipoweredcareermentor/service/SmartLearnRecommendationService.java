package org.bootforce.aipoweredcareermentor.service;

import lombok.extern.slf4j.Slf4j;
import org.bootforce.aipoweredcareermentor.model.Course;
import org.bootforce.aipoweredcareermentor.model.Lesson;
import org.bootforce.aipoweredcareermentor.model.LessonAttempt;
import org.bootforce.aipoweredcareermentor.model.Module;
import org.bootforce.aipoweredcareermentor.model.Profile;
import org.bootforce.aipoweredcareermentor.repository.CourseRepository;
import org.bootforce.aipoweredcareermentor.repository.LessonAttemptRepository;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SmartLearnRecommendationService {

    private final CourseRepository courseRepository;
    private final LessonAttemptRepository attemptRepository;
    private final ChatClient chatClient;

    public Map<String, Object> getNextLessonRecommendation(Profile profile) {
        if (profile.getHumanMentor() == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "LOCKED");
            response.put("aiReason", "Connect with a mentor to unlock your personalized learning path.");
            return response;
        }

        Integer mentorId = profile.getHumanMentor().getId();
        List<Course> courses = courseRepository.findByCreatedBy(mentorId);
        List<LessonAttempt> attempts = attemptRepository.findByProfile(profile);
        Map<String, Object> recommendation = new HashMap<>();

        for (Course course : courses) {
            if (course.getModules() != null) {
                for (Module module : course.getModules()) {
                    if (module.getLessons() != null) {
                        for (Lesson lesson : module.getLessons()) {
                            boolean isCompleted = attempts.stream()
                                    .anyMatch(a -> a.getLesson().getId().equals(lesson.getId()) && a.getScore() >= 60);

                            if (!isCompleted) {
                                recommendation.put("courseId", course.getId());
                                recommendation.put("courseName", course.getCourseName());
                                recommendation.put("moduleId", module.getId());
                                recommendation.put("moduleTitle", module.getTitle());
                                recommendation.put("lessonId", lesson.getId());
                                recommendation.put("lessonTitle", lesson.getTitle());
                                recommendation.put("status", "IN_PROGRESS");
                                recommendation.put("aiReason", "Continue this lesson to progress in your learning path.");

                                enhanceWithAI(recommendation, attempts);
                                return recommendation;
                            }
                        }
                    }
                }
            }
        }

        recommendation.put("status", "COMPLETED");
        recommendation.put("aiReason", "You have completed all available courses! Great job.");
        return recommendation;
    }

    public List<org.bootforce.aipoweredcareermentor.dto.CourseProgressDto> getCourseProgress(Profile profile) {
        if (profile.getHumanMentor() == null) {
            return java.util.Collections.emptyList();
        }

        Integer mentorId = profile.getHumanMentor().getId();
        List<Course> courses = courseRepository.findByCreatedBy(mentorId);
        List<LessonAttempt> attempts = attemptRepository.findByProfile(profile);

        return courses.stream().map(course -> {
            int totalLessons = 0;
            int completedLessons = 0;

            if (course.getModules() != null) {
                for (Module module : course.getModules()) {
                    if (module.getLessons() != null) {
                        for (Lesson lesson : module.getLessons()) {
                            totalLessons++;
                            boolean isCompleted = attempts.stream()
                                    .anyMatch(a -> a.getLesson().getId().equals(lesson.getId()) && a.getScore() >= 60);
                            if (isCompleted) {
                                completedLessons++;
                            }
                        }
                    }
                }
            }

            double percentage = totalLessons > 0 ? (double) completedLessons / totalLessons * 100 : 0;
            return org.bootforce.aipoweredcareermentor.dto.CourseProgressDto.builder()
                    .courseId(course.getId())
                    .courseName(course.getCourseName())
                    .totalLessons(totalLessons)
                    .completedLessons(completedLessons)
                    .progressPercentage(Math.round(percentage * 10.0) / 10.0)
                    .build();
        }).filter(dto -> dto.getTotalLessons() > 0).collect(java.util.stream.Collectors.toList());
    }

    private void enhanceWithAI(Map<String, Object> recommendation, List<LessonAttempt> attempts) {
        try {
            StringBuilder prompt = new StringBuilder("You are an academic advisor recommending the next step.\n");
            prompt.append("Student Recent Activity:\n");
            attempts.stream().limit(5).forEach(a ->
                    prompt.append("- ").append(a.getLesson().getTitle()).append(": ").append(a.getScore()).append("%\n"));

            prompt.append("\nRecommended Next Step: ").append(recommendation.get("lessonTitle"));
            prompt.append("\nGive a 1-sentence encouraging reason why they should complete this.");

            String reason = chatClient.prompt().user(prompt.toString()).call().content();
            if (reason != null && !reason.isBlank()) {
                recommendation.put("aiReason", reason.trim());
            }
        } catch (Exception ignored) {
            log.info("Some error occured by our side");
        }
    }
}
