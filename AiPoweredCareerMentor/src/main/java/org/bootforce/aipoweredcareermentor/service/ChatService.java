package org.bootforce.aipoweredcareermentor.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bootforce.aipoweredcareermentor.dto.NewsArticleDto;
import org.bootforce.aipoweredcareermentor.model.*;
import org.bootforce.aipoweredcareermentor.repository.*;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.select.Elements;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatClient chatClient;
    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;
    private final ProfileRepo profileRepo;
    private final NewsApiService newsApiService;


    @Transactional
    public Map<String, Object> processMessage(Integer profileId, Long sessionId, String userMessage) {
        Profile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        ChatSession session = getOrCreateSession(profile, sessionId, userMessage);

        ChatMessage userMsg = ChatMessage.builder()
                .session(session)
                .role("user")
                .content(userMessage)
                .intent("GENERAL")
                .build();
        messageRepository.save(userMsg);

        String intent = detectIntent(userMessage);
        log.info("Detected intent: {} for message: {}", intent, userMessage);

        String assistantResponse;
        try {
            assistantResponse = switch (intent) {
                case "VERIFY_LINK" -> handleLinkVerification(session, userMessage, profile);
                case "NEWS_SEARCH" -> handleNewsSearchRequest(session, userMessage);
                case "HOW_IT_WORKS" -> handleHowItWorks();
                case "HELP" -> handleHelp();
                default -> handleGeneralChat(session, userMessage);
            };
        } catch (Exception e) {
            log.error("Error processing chat message", e);
            assistantResponse = "I encountered an issue processing your request. Please try again.";
            intent = "ERROR";
        }

        ChatMessage assistantMsg = ChatMessage.builder()
                .session(session)
                .role("assistant")
                .content(assistantResponse)
                .intent(intent)
                .build();
        messageRepository.save(assistantMsg);

        sessionRepository.save(session);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("sessionId", session.getId());
        response.put("intent", intent);
        response.put("message", assistantResponse);
        return response;
    }

    public List<Map<String, Object>> getSessionHistory(Integer profileId, Long sessionId) {
        Profile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        ChatSession session = sessionRepository.findByIdAndProfile(sessionId, profile)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        return messageRepository.findBySessionOrderByCreatedAtAsc(session).stream()
                .map(msg -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", msg.getId());
                    m.put("role", msg.getRole());
                    m.put("content", msg.getContent());
                    m.put("intent", msg.getIntent());
                    m.put("createdAt", msg.getCreatedAt());
                    return m;
                })
                .toList();
    }

    public List<Map<String, Object>> getUserSessions(Integer profileId, int limit) {
        Profile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        return sessionRepository.findByProfileOrderByUpdatedAtDesc(profile, PageRequest.of(0, limit))
                .stream()
                .map(s -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", s.getId());
                    m.put("title", s.getTitle());
                    m.put("active", s.isActive());
                    m.put("createdAt", s.getCreatedAt());
                    m.put("updatedAt", s.getUpdatedAt());
                    return m;
                })
                .toList();
    }

    private String handleLinkVerification(ChatSession session, String userMessage, Profile profile) {
        String url = extractFirstUrl(userMessage);
        if (url == null) {
            return "I couldn't find a valid URL in your message. Please share the link you'd like me to fact-check.";
        }

        log.info("Verifying article at URL: {}", url);
        try {
            String content = scrapeContent(url);
            if (content == null || content.length() < 100) {
                return "I couldn't read the content at that URL. Please ensure the link is publicly accessible.";
            }

            String title = extractTitle(url);
            String verificationResult = verifyContentWithAI(title, content);
            return verificationResult;
        } catch (Exception e) {
            log.error("Link verification failed for URL: {}", url, e);
            return "I had trouble verifying that URL. It may be paywalled or unavailable. You can also paste the article text directly.";
        }
    }

    private String handleNewsSearchRequest(ChatSession session, String userMessage) {
        log.info("Fetching real-time news for query: {}", userMessage);
        List<NewsArticleDto> articles = newsApiService.getTopNews(userMessage);
        
        String newsContext = articles.isEmpty() ? "No recent news found for this query." :
                articles.stream()
                        .map(a -> String.format("- %s (Source: %s)\n  URL: %s", a.getTitle(), a.getSourceName(), a.getUrl()))
                        .collect(Collectors.joining("\n\n"));

        String historyContext = buildHistoryContext(session);
        String prompt = String.format("""
            You are NewsAI, an AI fact-checking and news analysis assistant.
            The user is asking about recent news or current events.
            
            Based on the following recent news articles I found:
            %s
            
            Conversation history:
            %s
            
            User message: %s
            
            Provide a factual, balanced response based on the provided articles. 
            If the articles don't cover the topic well, mention that.
            Always include the URLs of the most relevant articles in your response so the user can verify them.
            Keep response under 400 words.
            """, newsContext, historyContext, userMessage);

        return chatClient.prompt().user(prompt).call().content();
    }

    private String handleGeneralChat(ChatSession session, String userMessage) {
        String historyContext = buildHistoryContext(session);
        String prompt = String.format("""
            You are an AI fact-checker, an AI-powered career and news fact-checking assistant integrated into AiPoweredCareerMentor platform.
            
            Your capabilities:
            - Fact-check news articles (paste URL or article text)
            - Answer career-related questions
            - Provide credibility scores for content
            - Help with skill gap analysis and career guidance
            - Retrieve and synthesize information
            
            Conversation history:
            %s
            
            User: %s
            
            Respond helpfully and concisely. For fact-checking tasks, be precise and evidence-based.
            """, historyContext, userMessage);

        return chatClient.prompt().user(prompt).call().content();
    }

    private String handleHowItWorks() {
        return """
            ## How NewsAI Works 🔍
            
            I'm an AI-powered fact-checking assistant. Here's what I can do:
            
            **1. Verify Article Links**
            Paste any news URL and I'll:
            - Scrape and analyze the content
            - Extract key claims
            - Assign a credibility score (0–100)
            - Give a verdict: TRUE, FALSE, MIXED, or UNVERIFIABLE
            
            **2. Search Recent News**
            Ask me about current events and I'll provide a balanced summary.
            
            **3. Answer Career Questions**
            I'm integrated with the career mentoring platform, so I can help with:
            - Skill gap analysis
            - Career roadmaps
            - Interview preparation
            
            **Getting Started:**
            - Paste a URL → I'll fact-check it
            - Ask any question → I'll research and respond
            - Type `help` → See all commands
            """;
    }

    private String handleHelp() {
        return """
            ## NewsAI Help 📖
            
            **Commands:**
            - **Verify a link**: Just paste the URL (e.g. `https://example.com/article`)
            - **Search news**: Ask e.g. "What's the latest on AI regulation?"
            - **How it works**: Type `how does this work`
            - **Career help**: Ask about skills, jobs, career paths
            
            **Examples:**
            ```
            https://bbc.com/news/...   → Fact-check that article
            Is XYZ technology real?    → I'll analyze and verify
            What skills do I need for ML?  → Career guidance
            ```
            """;
    }

    private ChatSession getOrCreateSession(Profile profile, Long sessionId, String seed) {
        if (sessionId != null) {
            Optional<ChatSession> existing = sessionRepository.findByIdAndProfile(sessionId, profile);
            if (existing.isPresent()) return existing.get();
        }

        String title = seed.length() > 50 ? seed.substring(0, 50) + "..." : seed;
        ChatSession session = ChatSession.builder()
                .profile(profile)
                .title(title)
                .build();
        return sessionRepository.save(session);
    }

    private String detectIntent(String message) {
        String lower = message.toLowerCase();

        if (lower.matches(".*https?://\\S+.*")) return "VERIFY_LINK";
        if (lower.contains("how does") && (lower.contains("work") || lower.contains("NewsAI"))) return "HOW_IT_WORKS";
        if (lower.equals("help") || lower.equals("/help")) return "HELP";
        if (lower.contains("latest") || lower.contains("current") || lower.contains("recent") ||
            lower.contains("today") || lower.contains("news") || lower.contains("what happened")) {
            return "NEWS_SEARCH";
        }
        return "GENERAL";
    }

    private String extractFirstUrl(String message) {
        Pattern pattern = Pattern.compile("https?://\\S+");
        Matcher matcher = pattern.matcher(message);
        return matcher.find() ? matcher.group() : null;
    }

    private String scrapeContent(String url) {
        try {
            Document doc = Jsoup.connect(url).timeout(10_000).get();
            Elements paragraphs = doc.select("p");
            StringBuilder text = new StringBuilder();
            for (var p : paragraphs) {
                text.append(p.text()).append("\n");
            }
            return text.toString().trim();
        } catch (Exception e) {
            log.warn("Could not scrape URL: {}", url);
            return null;
        }
    }

    private String extractTitle(String url) {
        try {
            Document doc = Jsoup.connect(url).timeout(10_000).get();
            return doc.title();
        } catch (Exception e) {
            return url;
        }
    }

    private String verifyContentWithAI(String title, String content) {
        String prompt = String.format("""
            You are an AI fact-checker, an expert AI fact-checker.
            
            Analyze the following article for factual accuracy, logical consistency, and potential misinformation.
            
            ARTICLE TITLE: %s
            ARTICLE CONTENT: %s
            
            Provide your analysis in this format:
            
            **Credibility Score: [0-100]**
            **Verdict: [TRUE / FALSE / MIXED / UNVERIFIABLE]**
            
            **Key Claims:**
            - Claim 1: [TRUE/FALSE/UNVERIFIABLE] - brief explanation
            - Claim 2: [TRUE/FALSE/UNVERIFIABLE] - brief explanation
            
            **Summary:**
            [2-3 sentence balanced summary]
            
            **Overall Assessment:**
            [Your final judgment on the article's credibility]
            """, title, content.length() > 3000 ? content.substring(0, 3000) : content);

        return chatClient.prompt().user(prompt).call().content();
    }

    private String buildHistoryContext(ChatSession session) {
        List<ChatMessage> history = messageRepository.findBySessionOrderByCreatedAtAsc(session);
        if (history.isEmpty()) return "No previous context.";

        int start = Math.max(0, history.size() - 6);
        StringBuilder sb = new StringBuilder();
        for (ChatMessage msg : history.subList(start, history.size())) {
            sb.append(msg.getRole().toUpperCase()).append(": ").append(msg.getContent()).append("\n");
        }
        return sb.toString();
    }
}
