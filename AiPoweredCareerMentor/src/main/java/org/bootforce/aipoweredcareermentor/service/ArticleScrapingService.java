package org.bootforce.aipoweredcareermentor.service;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ArticleScrapingService {

    @Setter
    @Getter
    public static class ScrapedArticle {
        private String title;
        private String content;
        private String description;
        private String author;
        private String imageUrl;
        private String sourceUrl;

    }

    public ScrapedArticle scrapeArticle(String url) {
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(12_000)
                    .followRedirects(true)
                    .get();

            ScrapedArticle result = new ScrapedArticle();
            result.setSourceUrl(url);

            result.setTitle(doc.title());
            Element ogTitle = doc.selectFirst("meta[property=og:title]");
            if (ogTitle != null && !ogTitle.attr("content").isBlank()) {
                result.setTitle(ogTitle.attr("content"));
            }

            Element metaDesc = doc.selectFirst("meta[name=description]");
            if (metaDesc != null) result.setDescription(metaDesc.attr("content"));
            Element ogDesc = doc.selectFirst("meta[property=og:description]");
            if (ogDesc != null && !ogDesc.attr("content").isBlank()) result.setDescription(ogDesc.attr("content"));

            Element metaAuthor = doc.selectFirst("meta[name=author]");
            if (metaAuthor != null) result.setAuthor(metaAuthor.attr("content"));

            Element ogImage = doc.selectFirst("meta[property=og:image]");
            if (ogImage != null) result.setImageUrl(ogImage.attr("content"));

            String[] contentSelectors = {"article", "main", "[class*=article-body]", "[class*=post-content]", "[class*=story-body]", "[itemprop=articleBody]"};
            StringBuilder text = new StringBuilder();
            for (String selector : contentSelectors) {
                Elements candidate = doc.select(selector + " p");
                if (!candidate.isEmpty()) {
                    for (Element p : candidate) {
                        String t = p.text().trim();
                        if (t.length() > 30) text.append(t).append("\n");
                    }
                    if (text.length() > 200) break;
                }
            }

            if (text.length() < 200) {
                text.setLength(0);
                for (Element p : doc.select("p")) {
                    String t = p.text().trim();
                    if (t.length() > 30) text.append(t).append("\n");
                }
            }

            result.setContent(text.toString().trim());
            log.debug("Scraped article from {}: {} chars", url, result.getContent().length());
            return result;

        } catch (Exception e) {
            log.warn("Could not scrape article from URL: {} - {}", url, e.getMessage());
            return null;
        }
    }
}
