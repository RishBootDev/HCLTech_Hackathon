package org.bootforce.aipoweredcareermentor.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bootforce.aipoweredcareermentor.model.Article;
import org.bootforce.aipoweredcareermentor.repository.ArticleRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiNewsGeneratorService {

    private final AggregatorService aggregatorService;

    private static final List<String> DEFAULT_CATEGORIES = List.of(
            "TECHNOLOGY", "CAREER", "AI", "BUSINESS"
    );

    @Scheduled(fixedDelayString = "${news.ai.generation.interval:14400000}", // 4 hours
            initialDelayString = "${news.ai.generation.initial-delay:60000}")
    public void generateNewsForDefaultCategories() {
        log.info("Starting scheduled AI news generation cycle at {}", LocalDateTime.now());
        for (String category : DEFAULT_CATEGORIES) {
            try {
                aggregatorService.generateNewsFromApi(category);
            } catch (Exception e) {
                log.error("Failed to generate AI news for category {}: {}", category, e.getMessage());
            }
        }
        log.info("Completed scheduled AI news generation cycle.");
    }

    public Map<String, Object> triggerManualGeneration(String category) {
        log.info("Manually triggering AI news generation for category: {}", category);
        int generatedCount = aggregatorService.generateNewsFromApi(category);
        return Map.of(
                "category", category,
                "articlesGenerated", generatedCount,
                "timestamp", LocalDateTime.now().toString()
        );
    }
}
