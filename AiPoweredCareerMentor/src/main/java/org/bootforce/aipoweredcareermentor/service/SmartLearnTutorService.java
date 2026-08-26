package org.bootforce.aipoweredcareermentor.service;

import org.bootforce.aipoweredcareermentor.model.Lesson;
import org.bootforce.aipoweredcareermentor.model.Profile;
import org.bootforce.aipoweredcareermentor.repository.LessonRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SmartLearnTutorService {

    private final ChatClient chatClient;
    private final LessonRepository lessonRepository;
    private final org.bootforce.aipoweredcareermentor.repository.ArticleRepository articleRepository;

    public enum TutorMode {
        TEACHING, DOUBT
    }

    public String askTutor(Profile profile, Long lessonId, String question, TutorMode mode) {
        String systemPrompt = "You are a highly intelligent and encouraging AI tutor.";

        if (mode == TutorMode.TEACHING) {
            systemPrompt += " Your goal is to explain concepts step-by-step to the student.";
        } else if (mode == TutorMode.DOUBT) {
            systemPrompt += " Your goal is to clarify the student's specific doubts concisely.";
        }

        String context = "";
        if (lessonId != null) {
            Lesson lesson = lessonRepository.findById(lessonId).orElse(null);
            if (lesson != null && lesson.getContent() != null) {
                context = "\n\nContext from the current lesson (" + lesson.getTitle() + "):\n" + lesson.getContent();
            }
        } else {
            context = "\n\nYou are functioning as a global, open-domain tutor.";
        }

        String finalPrompt = systemPrompt + context + "\n\nStudent asks: " + question;

        return chatClient.prompt().user(finalPrompt).call().content();
    }

    public String askTutorAboutNews(Profile profile, Long articleId, String question) {
        org.bootforce.aipoweredcareermentor.model.Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new RuntimeException("Article not found"));

        String systemPrompt = "You are an AI news analyst and expert tutor. Use the following verified facts to answer the student's question.";
        String context = "\n\nVerified News Context (" + article.getTitle() + "):\n" +
                "Summary: " + article.getSynthesizedNarrative() + "\n" +
                "Key Findings: " + article.getKeyFindings() + "\n" +
                "Verdict: " + article.getVerdict();

        String finalPrompt = systemPrompt + context + "\n\nStudent asks: " + question;

        return chatClient.prompt().user(finalPrompt).call().content();
    }
}
