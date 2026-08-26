package org.bootforce.aipoweredcareermentor.controller;

import lombok.RequiredArgsConstructor;
import org.bootforce.aipoweredcareermentor.dto.NewsArticleDto;
import org.bootforce.aipoweredcareermentor.model.Article;
import org.bootforce.aipoweredcareermentor.model.Profile;
import org.bootforce.aipoweredcareermentor.model.SubmittedArticle;
import org.bootforce.aipoweredcareermentor.repository.ArticleRepository;
import org.bootforce.aipoweredcareermentor.repository.ProfileRepo;
import org.bootforce.aipoweredcareermentor.service.AggregatorService;
import org.bootforce.aipoweredcareermentor.service.NewsApiService;
import org.bootforce.aipoweredcareermentor.service.VerificationService;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/articles")
@CrossOrigin
@RequiredArgsConstructor
public class ArticleController {

    private final AggregatorService aggregatorService;
    private final VerificationService verificationService;
    private final ArticleRepository articleRepository;
    private final ProfileRepo profileRepo;
    private final NewsApiService newsApiService;
    private final org.bootforce.aipoweredcareermentor.service.AiNewsGeneratorService aiNewsGeneratorService;

    @GetMapping
    public ResponseEntity<List<Article>> getAllArticles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer profileId) {

        List<Article> articles;
        if (profileId != null) {
            Profile profile = profileRepo.findById(profileId).orElse(null);
            if (profile != null) {
                articles = articleRepository.findPublicAndUserArticles(profile, PageRequest.of(page, size)).getContent();
            } else {
                articles = articleRepository.findBySubmittedByIsNull(PageRequest.of(page, size)).getContent();
            }
        } else if (category != null) {
            articles = aggregatorService.getArticlesByCategory(category);
        } else if ("verified".equalsIgnoreCase(status)) {
            articles = aggregatorService.getTopCredibleArticles();
        } else {
            articles = articleRepository.findBySubmittedByIsNull(PageRequest.of(page, size)).getContent();
        }
        return ResponseEntity.ok(articles);
    }

    @GetMapping("/trending")
    public ResponseEntity<List<Article>> getTrending() {
        return ResponseEntity.ok(aggregatorService.getTrendingArticles());
    }

    @GetMapping("/top-credible")
    public ResponseEntity<List<Article>> getTopCredible() {
        return ResponseEntity.ok(aggregatorService.getTopCredibleArticles());
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Article>> getByCategory(
            @PathVariable String category,
            @RequestParam(required = false) Integer profileId) {
        
        if (profileId != null) {
            Profile profile = profileRepo.findById(profileId).orElse(null);
            if (profile != null) {
                return ResponseEntity.ok(articleRepository.findPublicAndUserArticlesByCategory(category, profile));
            }
        }
        return ResponseEntity.ok(articleRepository.findByCategoryIgnoreCaseAndSubmittedByIsNull(category));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Article> getArticle(@PathVariable Long id) {
        return articleRepository.findById(id)
                .map(a -> {
                    a.setViewCount(a.getViewCount() == null ? 1L : a.getViewCount() + 1);
                    articleRepository.save(a);
                    return ResponseEntity.ok(a);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/save")
    public ResponseEntity<String> saveArticle(@PathVariable Long id,
                                              @RequestParam Integer profileId,
                                              @RequestParam(required = false) String notes) {
        aggregatorService.saveArticleForUser(profileId, id, notes);
        return ResponseEntity.ok("Article saved successfully!");
    }

    @GetMapping("/saved")
    public ResponseEntity<?> getSavedArticles(@RequestParam Integer profileId) {
        return ResponseEntity.ok(aggregatorService.getSavedArticles(profileId));
    }

    @PostMapping("/admin/generate-news")
    public ResponseEntity<java.util.Map<String, Object>> generateAiNews(@RequestParam(defaultValue = "TECHNOLOGY") String category) {
        return ResponseEntity.ok(aiNewsGeneratorService.triggerManualGeneration(category));
    }


    @PostMapping("/submit")
    public ResponseEntity<SubmittedArticle> submitArticle(
            @RequestParam Integer profileId,
            @RequestParam String title,
            @RequestParam String content,
            @RequestParam(required = false) String sourceUrl,
            @RequestParam(required = false) String author) {
        return ResponseEntity.ok(verificationService.submitArticleForVerification(profileId, title, content, sourceUrl, author));
    }

    @PostMapping("/submit/url")
    public ResponseEntity<SubmittedArticle> quickVerifyUrl(@RequestParam Integer profileId,
                                                                   @RequestParam String url) {
        return ResponseEntity.ok(verificationService.quickVerifyUrl(profileId, url));
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<SubmittedArticle> verifyArticle(@PathVariable Long id) {
        return ResponseEntity.ok(verificationService.verifyArticle(id));
    }

    @GetMapping("/{id}/progress")
    public ResponseEntity<Map<String, Object>> getVerificationProgress(@PathVariable Long id) {
        return ResponseEntity.ok(verificationService.getVerificationProgress(id));
    }

    @PostMapping("/top-news")
    public ResponseEntity<Map<String, Object>> getTopNews(@RequestBody Map<String, String> payload) {
        String msg = payload.get("msg");
        if (msg == null) msg = payload.get("field");
        
        List<NewsArticleDto> articles = newsApiService.getTopNews(msg);
        
        Map<String, Object> response = new HashMap<>();
        response.put("msg", "Top news fetched successfully");
        response.put("data", articles);
        
        return ResponseEntity.ok(response);
    }
}
