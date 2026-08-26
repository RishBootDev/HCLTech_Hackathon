package org.bootforce.aipoweredcareermentor.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class NewsApiResponseDto {
    private String status;
    private Integer totalResults;
    private List<Article> articles;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Article {
        private String title;
        private String description;
        private String url;
        private Source source;
        private String publishedAt;

        @Data
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class Source {
            private String id;
            private String name;
        }
    }
}
