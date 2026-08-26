package org.bootforce.aipoweredcareermentor.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "lesson_attempts")
public class LessonAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @Column(nullable = false)
    private int score;

    @Builder.Default
    @Column(name = "video_progress", nullable = false)
    private int videoProgress = 0;

    @Builder.Default
    @Column(name = "last_timestamp_seconds", nullable = false)
    private int lastTimestampSeconds = 0;

    @Builder.Default
    @Column(name = "video_completed", nullable = false)
    private boolean videoCompleted = false;

    @Column(name = "total_questions")
    private Integer totalQuestions;

    @Column(name = "correct_answers")
    private Integer correctAnswers;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    @JsonIgnore
    private Profile profile;

    @Builder.Default
    @Column(name = "attempted_at", nullable = false, updatable = false)
    private LocalDateTime attemptedAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (attemptedAt == null) {
            attemptedAt = LocalDateTime.now();
        }
    }
}
