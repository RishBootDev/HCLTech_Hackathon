package org.bootforce.aipoweredcareermentor.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bootforce.aipoweredcareermentor.dto.NewsApiResponseDto;
import org.bootforce.aipoweredcareermentor.dto.NewsArticleDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NewsApiService {

    private final RestTemplate restTemplate;

    @Value("${news.api.key}")
    private String apiKey;

    public List<NewsArticleDto> getTopNews(String field) {
        try {
            String query = (field == null || field.isEmpty()) ? "technology" : field;
            
            String url = UriComponentsBuilder.fromUriString("https://newsapi.org/v2/everything")
                    .queryParam("q", query)
                    .queryParam("language", "en")
                    .queryParam("sortBy", "publishedAt")
                    .queryParam("pageSize", 10)
                    .queryParam("apiKey", apiKey)
                    .toUriString();

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("User-Agent", "CareerXpertApp/1.0");
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);

            org.springframework.http.ResponseEntity<NewsApiResponseDto> responseEntity = 
                restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, NewsApiResponseDto.class);
            
            NewsApiResponseDto response = responseEntity.getBody();

            if (response != null && response.getArticles() != null) {
                log.info("NewsAPI returned {} total results for query: '{}'. Processing top 10.", response.getTotalResults(), query);
                
                List<NewsArticleDto> results = response.getArticles().stream()
                        .filter(a -> a.getTitle() != null && a.getUrl() != null && !"[Removed]".equals(a.getTitle()))
                        .map(a -> NewsArticleDto.builder()
                                .title(a.getTitle())
                                .description(a.getDescription() != null ? a.getDescription() : "No description available.")
                                .url(a.getUrl())
                                .sourceName(a.getSource() != null ? a.getSource().getName() : "Unknown Source")
                                .publishedAt(a.getPublishedAt())
                                .build())
                        .collect(Collectors.toList());
                
                log.info("Returning {} filtered articles.", results.size());
                return results;
            } else {
                log.warn("NewsAPI response was null or had no articles. Status: {}", response != null ? response.getStatus() : "null");
            }
        } catch (Exception e) {
            log.error("Error fetching news from NewsAPI: {}", e.getMessage());
        }
        return Collections.emptyList();
    }
}
