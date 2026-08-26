package org.bootforce.aipoweredcareermentor.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bootforce.aipoweredcareermentor.model.Profile;
import org.bootforce.aipoweredcareermentor.model.Article;
import org.bootforce.aipoweredcareermentor.model.SavedArticle;
import org.bootforce.aipoweredcareermentor.repository.ProfileRepo;
import org.bootforce.aipoweredcareermentor.repository.ArticleRepository;
import org.bootforce.aipoweredcareermentor.repository.SavedArticleRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.annotation.Scope;
import org.springframework.data.repository.cdi.Eager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AggregatorService {

    private final ArticleRepository articleRepository;
    private final SavedArticleRepository savedArticleRepository;
    private final ProfileRepo profileRepo;
    private final ChatClient chatClient;
    private final NewsApiService newsApiService;

    public int generateNewsFromApi(String topic) {
        log.info("Generating AI News for topic: {}", topic);
        int processedCount = 0;
        try {
            var articles = newsApiService.getTopNews(topic);
            for (var articleDto : articles) {
                // Check if already exists by URL
                if (articleRepository.existsBySourceUrl(articleDto.getUrl())) {
                    continue;
                }

                String fallbackDesc = articleDto.getDescription();
                String content = scrapeArticleContent(articleDto.getUrl(), fallbackDesc);
                
                boolean saved = synthesizeAndSaveArticle(articleDto.getTitle(), content, articleDto.getUrl(), topic.toUpperCase(), articleDto.getSourceName());
                if (saved) {
                    processedCount++;
                }
            }
        } catch (Exception e) {
            log.error("Failed to generate AI news for topic {}", topic, e);
        }
        return processedCount;
    }

    private String scrapeArticleContent(String url, String fallbackDesc) {
        try {
            Document doc = Jsoup.connect(url).timeout(10000).get();
            Elements paragraphs = doc.select("p");
            StringBuilder text = new StringBuilder();
            for (Element p : paragraphs) {
                text.append(p.text()).append("\n");
            }
            if (text.length() < 100) return fallbackDesc;
            return text.toString();
        } catch (Exception e) {
            return fallbackDesc;
        }
    }

    private final ObjectMapper objectMapper = new ObjectMapper();

    private boolean synthesizeAndSaveArticle(String title, String content, String link, String category, String sourceName) {
        log.info("Synthesizing article: {}", title);
        try {
            String prompt = String.format("""
                You an AI-powered Fact-Checking and Content Synthesis agent.
                Analyze the following article content.
                
                Required JSON output format:
                {
                   "synthesizedNarrative": "A clean, unbiased summary of the article",
                   "keyFindings": "A bulleted string of key points",
                   "credibilityScore": 85.0,
                   "verdict": "TRUE",
                   "trueClaims": 3,
                   "falseClaims": 0,
                   "claimsCount": 3
                }
                
                ARTICLE TITLE: %s
                ARTICLE CONTENT: %s
                """, title, content.length() > 3000 ? content.substring(0, 3000) : content);

            String response = chatClient.prompt().user(prompt).call().content();
            if (response != null) {
                response = response.replaceAll("(?ms)^```json\\n?", "").replaceAll("(?ms)^```\\n?", "").trim();
                
                Map<String, Object> synthesis = objectMapper.readValue(response, new TypeReference<>() {});
                
                Article article = Article.builder()
                        .title(title)
                        .originalContent(content)
                        .synthesizedNarrative((String) synthesis.get("synthesizedNarrative"))
                        .keyFindings((String) synthesis.get("keyFindings"))
                        .sourceUrl(link)
                        .category(category)
                        .rssFeedSource(sourceName)
                        .credibilityScore(Double.valueOf(synthesis.get("credibilityScore").toString()))
                        .verdict((String) synthesis.get("verdict"))
                        .trueClaims((Integer) synthesis.get("trueClaims"))
                        .falseClaims((Integer) synthesis.get("falseClaims"))
                        .claimsCount((Integer) synthesis.get("claimsCount"))
                        .status("VERIFIED")
                        .build();

                articleRepository.save(article);
                log.info("Successfully saved synthesized article: {}", title);
                return true;
            }
        } catch (Exception e) {
            log.error("Synthesis failed for article: {}", title, e);
        }
        return false;
    }

    public List<Article> getTrendingArticles() {
        return articleRepository.findByIsTrendingTrueOrderByCreatedAtDesc();
    }
    
    public List<Article> getTopCredibleArticles() {
        return articleRepository.findByStatusOrderByCredibilityScoreDesc("VERIFIED");
    }

    public List<Article> getArticlesByCategory(String category) {
        return articleRepository.findByCategoryIgnoreCase(category);
    }

    @Transactional
    public void saveArticleForUser(Integer profileId, Long articleId, String notes) {
        Profile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new RuntimeException("Article not found"));

        Optional<SavedArticle> existing = savedArticleRepository.findByProfileAndArticle(profile, article);
        if (existing.isEmpty()) {
            SavedArticle savedArticle = SavedArticle.builder()
                    .profile(profile)
                    .article(article)
                    .userNotes(notes)
                    .build();
            savedArticleRepository.save(savedArticle);
        }
    }

    public List<SavedArticle> getSavedArticles(Integer profileId) {
        Profile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        return savedArticleRepository.findByProfile(profile);
    }
}
