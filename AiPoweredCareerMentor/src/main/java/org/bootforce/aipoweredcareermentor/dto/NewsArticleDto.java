package org.bootforce.aipoweredcareermentor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsArticleDto {
    private String title;
    private String description;
    private String url;
    private String sourceName;
    private String publishedAt;
}
