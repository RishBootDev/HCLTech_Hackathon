package org.bootforce.aipoweredcareermentor.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
@Entity
@Table(name = "articles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Article {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String originalContent;

    @Column(columnDefinition = "TEXT")
    private String synthesizedNarrative;

    @Column(name = "source_url", length = 500)
    private String sourceUrl;

    @Column(name = "original_source")
    private String originalSource;

    @Column(name = "rss_feed_source")
    private String rssFeedSource;

    @Column(name = "author")
    private String author;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "publish_date")
    private LocalDateTime publishDate;

    @Column(name = "url")
    private String url;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by_profile_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Profile submittedBy;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "credibility_score")
    private Double credibilityScore;

    @Column(name = "status")
    private String status; // PENDING, VERIFIED

    @Column(name = "verdict")
    private String verdict;

    @Column(name = "category")
    private String category;

    @Column(columnDefinition = "TEXT")
    private String keyFindings;

    @Column(columnDefinition = "TEXT")
    private String timeline;

    @Column(name = "claims_count")
    private Integer claimsCount;

    @Column(name = "true_claims")
    private Integer trueClaims;

    @Column(name = "false_claims")
    private Integer falseClaims;

    @Column(name = "unverifiable_claims")
    private Integer unverifiableClaims;

    @Column(name = "verified_claims_count")
    private Integer verifiedClaimsCount;

    @Builder.Default
    @Column(name = "view_count")
    private Long viewCount = 0L;

    @Builder.Default
    @Column(name = "is_trending")
    private Boolean isTrending = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

}
