package org.bootforce.aipoweredcareermentor.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bootforce.aipoweredcareermentor.enums.SubmittedArticleStatus;
import org.bootforce.aipoweredcareermentor.model.*;
import org.bootforce.aipoweredcareermentor.repository.*;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.select.Elements;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class VerificationService {

    private final ChatClient chatClient;
    private final SubmittedArticleRepository submittedArticleRepository;
    private final ProfileRepo profileRepo;
    private final ArticleRepository articleRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public SubmittedArticle submitArticleForVerification(Integer profileId, String title, String content, String sourceUrl, String author) {
        Profile profile = profileRepo.findById(profileId).orElse(null);

        SubmittedArticle article = SubmittedArticle.builder()
                .title(title)
                .content(content)
                .sourceUrl(sourceUrl)
                .author(author)
                .status(SubmittedArticleStatus.PENDING)
                .submittedBy(profile)
                .build();

        return submittedArticleRepository.save(article);
    }

    @Transactional
    public SubmittedArticle verifyArticle(Long articleId) {
        SubmittedArticle article = submittedArticleRepository.findById(articleId)
                .orElseThrow(() -> new RuntimeException("Article not found: " + articleId));

        article.setStatus(SubmittedArticleStatus.VERIFYING);
        submittedArticleRepository.save(article);

        try {
            String content = article.getContent();

            if ((content == null || content.isBlank()) && article.getSourceUrl() != null) {
                content = scrapeContent(article.getSourceUrl());
                article.setContent(content);
            }

            String prompt = String.format("""
                You are an AI fact-checker, an expert fact-checking AI.

                Analyze the following article thoroughly. Return ONLY valid JSON.

                {
                  "verdict": "TRUE or FALSE or MIXED or UNVERIFIABLE",
                  "credibilityScore": 75.0,
                  "synthesizedNarrative": "Concise unbiased 2-3 sentence summary",
                  "keyFindings": "• Finding 1\\n• Finding 2\\n• Finding 3",
                  "trueClaims": 3,
                  "falseClaims": 1,
                  "unverifiableClaims": 1,
                  "claimsCount": 5
                }

                ARTICLE TITLE: %s
                ARTICLE CONTENT: %s
                """, article.getTitle(), content != null && content.length() > 500 ? content.substring(0, 500) : content);

            String response = chatClient.prompt().user(prompt).call().content();
            if (response != null) {
                response = response.replaceAll("(?ms)^```json\\n?", "").replaceAll("(?ms)^```\\n?", "").trim();
                Map<String, Object> result = objectMapper.readValue(response, new TypeReference<>() {});

                article.setVerdict((String) result.get("verdict"));
                article.setCredibilityScore(Double.valueOf(result.get("credibilityScore").toString()));
                article.setSynthesizedNarrative((String) result.get("synthesizedNarrative"));
                article.setKeyFindings((String) result.get("keyFindings"));
                article.setTrueClaims(Integer.valueOf(result.get("trueClaims").toString()));
                article.setFalseClaims(Integer.valueOf(result.get("falseClaims").toString()));
                article.setUnverifiableClaims(Integer.valueOf(result.get("unverifiableClaims").toString()));
                article.setClaimsCount(Integer.valueOf(result.get("claimsCount").toString()));
                article.setStatus(SubmittedArticleStatus.VERIFIED);

                if (!"FALSE".equalsIgnoreCase((String) result.get("verdict"))) {
                    Article globalArticle = Article.builder()
                            .title(article.getTitle())
                            .originalContent(content)
                            .synthesizedNarrative(article.getSynthesizedNarrative())
                            .keyFindings(article.getKeyFindings())
                            .sourceUrl(article.getSourceUrl())
                            .category("General")
                            .credibilityScore(article.getCredibilityScore())
                            .verdict(article.getVerdict())
                            .trueClaims(article.getTrueClaims())
                            .falseClaims(article.getFalseClaims())
                            .claimsCount(article.getClaimsCount())
                            .status("VERIFIED")
                            .submittedBy(article.getSubmittedBy())
                            .build();
                    articleRepository.save(globalArticle);
                }
            }
        } catch (Exception e) {
            log.error("Verification failed for article: {}", articleId, e);
            article.setStatus(SubmittedArticleStatus.FAILED);
        }

        return submittedArticleRepository.save(article);
    }

    @Transactional
    public SubmittedArticle quickVerifyUrl(Integer profileId, String url) {
        log.info("Quick verifying URL: {}", url);
        String content = scrapeContent(url);
        String title = extractTitle(url);

        if (content == null || content.isBlank()) {
            throw new RuntimeException("Could not scrape content from URL: " + url);
        }

        SubmittedArticle article = submitArticleForVerification(profileId, title, content, url, "Auto-scraped");
        return verifyArticle(article.getId());
    }

    public Map<String, Object> getVerificationProgress(Long articleId) {
        SubmittedArticle article = submittedArticleRepository.findById(articleId)
                .orElseThrow(() -> new RuntimeException("Article not found"));

        int progress = switch (article.getStatus()) {
            case SubmittedArticleStatus.PENDING -> 0;
            case SubmittedArticleStatus.VERIFYING -> 50;
            case SubmittedArticleStatus.VERIFIED -> 100;
            default -> 0;
        };

        return Map.of(
                "articleId", articleId,
                "title", article.getTitle(),
                "status", article.getStatus(),
                "progress", progress,
                "verdict", article.getVerdict() != null ? article.getVerdict() : "PENDING",
                "credibilityScore", article.getCredibilityScore() != null ? article.getCredibilityScore() : 0.0
        );
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
}
