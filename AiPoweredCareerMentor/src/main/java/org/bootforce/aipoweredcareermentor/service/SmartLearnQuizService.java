package org.bootforce.aipoweredcareermentor.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.bootforce.aipoweredcareermentor.model.*;
import org.bootforce.aipoweredcareermentor.repository.*;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SmartLearnQuizService {

    private final ChatClient chatClient;
    private final LessonAttemptRepository attemptRepository;
    private final LessonRepository lessonRepository;
    private final ArticleRepository articleRepository;
    private final ProfileRepo profileRepo;
    private final LearningSkillProgressRepository skillProgressRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String generateQuiz(Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

        try {
            String content = lesson.getContent() != null && !lesson.getContent().isBlank()
                    ? lesson.getContent()
                    : "Topic: " + lesson.getTitle() + "\nPlease generate a quiz based on general knowledge of this topic as there is no specific text content provided.";

            String prompt = String.format("""
                You are an expert educational quiz generator. Generate exactly 10 multiple-choice questions for the following lesson.
                Return ONLY a valid JSON array.
                Format:
                [
                  {
                    "question": "What is...?",
                    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                    "correctAnswer": 0
                  }
                ]
                
                LESSON DETAILS:
                %s
                """, content);

            String response = chatClient.prompt().user(prompt).call().content();
            if (response != null) {
                response = response.replaceAll("(?ms)^```json\\n?", "").replaceAll("(?ms)^```\\n?", "").trim();
            }
            return response;
        } catch (Exception e) {
            log.error("Failed to generate AI quiz, falling back", e);
            return generateFallbackQuiz(lesson);
        }
    }

    public String generateArticleQuiz(Long articleId) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new RuntimeException("Article not found"));

        try {
            String prompt = String.format("""
                You are a quiz generator. Generate exactly 5 multiple-choice questions for the following verified news article.
                Use the verified facts and synthesized narrative as source.
                Format the output as a beautiful markdown text. DO NOT use JSON.
                Example format:
                **Q1. What was the verdict on...?**
                A) Option A
                B) Option B
                C) Option C
                D) Option D
                
                *Correct Answer: A*
                
                ARTICLE SUMMARY:
                %s
                KEY FINDINGS:
                %s
                """, article.getSynthesizedNarrative(), article.getKeyFindings());

            return chatClient.prompt().user(prompt).call().content();
        } catch (Exception e) {
            log.error("Failed to generate AI article quiz", e);
            return "Unable to generate quiz for this article at the moment. Please try again later.";
        }
    }

    public String generateSkillQuiz(String skillName) {
        try {
            String prompt = String.format("""
                You are a quiz generator. Generate exactly 10 multiple-choice questions to assess proficiency in: %s.
                Vary the difficulty from easy to advanced.
                Return ONLY a valid JSON array.
                Format:
                [
                  {
                    "question": "What is...?",
                    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                    "correctAnswer": 0
                  }
                ]
                """, skillName);

            String response = chatClient.prompt().user(prompt).call().content();
            if (response != null) {
                response = response.replaceAll("(?ms)^```json\\n?", "").replaceAll("(?ms)^```\\n?", "").trim();
            }
            return response;
        } catch (Exception e) {
            log.error("Failed to generate AI skill quiz for: {}", skillName, e);
            return "[]";
        }
    }

    private String generateFallbackQuiz(Lesson lesson) {
        return "[{\"question\":\"What is the main topic of " + lesson.getTitle() + "?\",\"options\":[\"" + lesson.getTitle() + "\",\"Unrelated Concept\",\"Nothing\",\"I don't know\"],\"correctAnswer\":0}]";
    }

    public LessonAttempt saveAttempt(Profile profile, Long lessonId, int score, Integer totalQuestions, Integer correctAnswers) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

        Optional<LessonAttempt> existingAttempt = attemptRepository.findFirstByProfileAndLessonOrderByAttemptedAtDesc(profile, lesson);
        LessonAttempt attempt;

        if (existingAttempt.isPresent()) {
            attempt = existingAttempt.get();
            boolean isFirstQuiz = attempt.getTotalQuestions() == null || attempt.getTotalQuestions() == 0;

            // Only update score metadata if they beat their high score, OR if it's their very first quiz attempt 
            // (fixes legacy bug where video completion forced score=100 before quiz was taken)
            if (isFirstQuiz || score > attempt.getScore()) {
                attempt.setScore(score);
                if (totalQuestions != null) {
                    attempt.setTotalQuestions(totalQuestions);
                }
                if (correctAnswers != null) {
                    attempt.setCorrectAnswers(correctAnswers);
                }
            }
        } else {
            attempt = LessonAttempt.builder()
                    .profile(profile)
                    .lesson(lesson)
                    .score(score)
                    .totalQuestions(totalQuestions)
                    .correctAnswers(correctAnswers)
                    .build();
        }

        int currentCredits = profile.getCredit();

        // only give credit if it's the first time scoring high
        if (score >= 70 && (!existingAttempt.isPresent() || existingAttempt.get().getScore() < 70)) {
            profile.setCredit(currentCredits + 50);
        }
        profileRepo.save(profile);

        log.info("the status updated for the video completion : {}", score);
        return attemptRepository.save(attempt);

    }

    public LessonAttempt saveVideoProgress(Profile profile, Long lessonId, int videoProgress, int lastTimestampSeconds) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

        // Clamp to 0-100
        int progress = Math.max(0, Math.min(100, videoProgress));

        Optional<LessonAttempt> existingAttempt = attemptRepository.findFirstByProfileAndLessonOrderByAttemptedAtDesc(profile, lesson);
        LessonAttempt attempt;

        if (existingAttempt.isPresent()) {
            attempt = existingAttempt.get();
            // Only update forward progress
            if (progress > attempt.getVideoProgress()) {
                attempt.setVideoProgress(progress);
            }
            // Always update the timestamp so resume point is current
            if (lastTimestampSeconds > 0) {
                attempt.setLastTimestampSeconds(lastTimestampSeconds);
            }
            // Mark completed at 95%+ and give one-time credit
            if (progress >= 95 && !attempt.isVideoCompleted()) {
                attempt.setVideoCompleted(true);
                profile.setCredit(profile.getCredit() + 10);
                profileRepo.save(profile);
                log.info("Video completion milestone hit for lesson: {} by profile: {}", lessonId, profile.getId());
            }
        } else {
            boolean isComplete = progress >= 95;
            attempt = LessonAttempt.builder()
                    .profile(profile)
                    .lesson(lesson)
                    .score(0)
                    .videoProgress(progress)
                    .lastTimestampSeconds(lastTimestampSeconds)
                    .videoCompleted(isComplete)
                    .build();
            if (isComplete) {
                profile.setCredit(profile.getCredit() + 10);
                profileRepo.save(profile);
            }
        }

        log.info("Video progress {}% (timestamp={}s) saved for lesson: {}", progress, lastTimestampSeconds, lessonId);
        return attemptRepository.save(attempt);
    }

    public LearningSkillProgress saveSkillAttempt(Profile profile, String skillName, int score) {
        LearningSkillProgress progress = skillProgressRepository.findFirstByProfileAndSkillNameOrderByCreatedAtDesc(profile, skillName)
                .orElseThrow(() -> new RuntimeException("Skill progress not found for: " + skillName));

        if (score > (progress.getMasteryScore() != null ? progress.getMasteryScore() : 0)) {
            progress.setMasteryScore(score);
        }
        progress.setTotalAttempts(progress.getTotalAttempts() + 1);
        if (score >= 60) {
            progress.setPassedAttempts(progress.getPassedAttempts() + 1);
        }


        int reward = (score >= 90) ? 100 : (score >= 70) ? 50 : 20;
        profile.setCredit(profile.getCredit() + reward);
        profileRepo.save(profile);

        log.info("Skill '{}' updated via quiz for profile {}. New Score: {}", skillName, profile.getId(), score);
        return skillProgressRepository.save(progress);
    }
}
