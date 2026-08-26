package org.bootforce.aipoweredcareermentor.model;

import jakarta.persistence.*;
import lombok.*;
import org.bootforce.aipoweredcareermentor.enums.SubmittedArticleStatus;

import java.time.LocalDateTime;

@Entity
@Table(name = "submitted_articles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmittedArticle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "source_url", length = 500)
    private String sourceUrl;

    @Column(name = "author")
    private String author;

    // PENDING, VERIFYING, VERIFIED, FAILED
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubmittedArticleStatus status;

    // TRUE, FALSE, MIXED, UNVERIFIABLE
    @Column(name = "verdict")
    private String verdict;

    @Column(name = "credibility_score")
    private Double credibilityScore;

    @Column(columnDefinition = "TEXT")
    private String synthesizedNarrative;

    @Column(columnDefinition = "TEXT")
    private String keyFindings;

    @Column(name = "claims_count")
    private Integer claimsCount;

    @Column(name = "true_claims")
    private Integer trueClaims;

    @Column(name = "false_claims")
    private Integer falseClaims;

    @Column(name = "unverifiable_claims")
    private Integer unverifiableClaims;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by_profile_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Profile submittedBy;

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
