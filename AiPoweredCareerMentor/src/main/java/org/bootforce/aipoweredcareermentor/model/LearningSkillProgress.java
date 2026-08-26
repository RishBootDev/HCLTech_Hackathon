package org.bootforce.aipoweredcareermentor.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "learning_skill_progress",
        uniqueConstraints = @UniqueConstraint(columnNames = {"profile_id", "skill_name"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearningSkillProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    @JsonIgnore
    private Profile profile;

    @Column(name = "skill_name", nullable = false)
    private String skillName;

    @Column(name = "category")
    private String category;

    @Builder.Default
    @Column(name = "mastery_score")
    private Integer masteryScore = 0;

    @Builder.Default
    @Column(name = "total_attempts")
    private Integer totalAttempts = 0;

    @Builder.Default
    @Column(name = "passed_attempts")
    private Integer passedAttempts = 0;

    @Builder.Default
    @Column(name = "status")
    private String status = "NOT_STARTED";

    @Builder.Default
    @Column(name = "last_practiced_at")
    private LocalDateTime lastPracticedAt = LocalDateTime.now();

    @Builder.Default
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (lastPracticedAt == null) lastPracticedAt = LocalDateTime.now();
        updateStatus();
    }

    @PreUpdate
    protected void onUpdate() {
        lastPracticedAt = LocalDateTime.now();
        updateStatus();
    }

    private void updateStatus() {
        if (masteryScore == null || masteryScore == 0) {
            this.status = "NOT_STARTED";
        } else if (masteryScore >= 80) {
            this.status = "MASTERED";
        } else {
            this.status = "IN_PROGRESS";
        }
    }
}
