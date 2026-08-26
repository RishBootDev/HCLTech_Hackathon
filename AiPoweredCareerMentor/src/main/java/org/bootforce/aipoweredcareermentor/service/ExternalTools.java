package org.bootforce.aipoweredcareermentor.service;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExternalTools {

    private final NewsApiService newsApiService;

    @Tool(description = "Fetches the most relevant video tutorial from the web")
    public String fetchWebTutorials(@ToolParam String skillName) {
        if (skillName == null) skillName = "";

        Map<String, String> topVideos = Map.of(
                "rust", "https://www.youtube.com/watch?v=ms7uxf9798U",
                "docker", "https://www.youtube.com/watch?v=pTFZFxd4hOI",
                "java", "https://www.youtube.com/watch?v=A74TOX803D0",
                "kubernetes", "https://www.youtube.com/watch?v=X48VuDVv0do",
                "spring boot", "https://www.youtube.com/watch?v=vtPkZShrpr0"
        );

        String finalSkillName = skillName.toLowerCase();
        String finalUrl = topVideos.entrySet().stream()
                .filter(entry -> finalSkillName.contains(entry.getKey()))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse("https://www.youtube.com/results?search_query=" + skillName.replace(" ", "+") + "+tutorial");

        String title = skillName + " Professional Tutorial";

        return String.format("COURSE_NAME: %s, COURSE_URL: %s", title, finalUrl);
    }

    @Tool(description = "Fetches top news articles for a given professional field or industry from the web")
    public String fetchTopNews(@ToolParam String field) {
        var articles = newsApiService.getTopNews(field);
        if (articles.isEmpty()) {
            return "No news found for this field.";
        }
        
        StringBuilder sb = new StringBuilder("Top News articles for " + field + ":\n");
        for (var a : articles) {
            sb.append("- ").append(a.getTitle()).append(": ").append(a.getUrl()).append("\n");
        }
        return sb.toString();
    }
}
