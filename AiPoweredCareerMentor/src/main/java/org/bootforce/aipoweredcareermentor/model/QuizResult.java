package org.bootforce.aipoweredcareermentor.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class QuizResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int score;
    private int totalScore;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Category is required")
    private String category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id")
    private Quiz quiz;

    @Builder.Default
    private LocalDateTime dateTaken = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id")
    @JsonIgnore
    private Profile profile;

    public QuizResult(int score, int totalScore, String title, String category, Quiz quiz, Profile profile) {
        this.score = score;
        this.totalScore = totalScore;
        this.title = title;
        this.category = category;
        this.quiz = quiz;
        this.profile = profile;
        this.dateTaken = LocalDateTime.now();
    }

    public QuizResult(int score, int totalScore, String title, String category, LocalDateTime time) {
        this.dateTaken = time;
        this.score = score;
        this.title = title;
        this.category = category;
        this.totalScore = totalScore;
    }
}
