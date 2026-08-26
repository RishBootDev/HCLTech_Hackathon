package org.bootforce.aipoweredcareermentor.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer qid;

    @NotBlank(message = "Question title is required")
    @Column(nullable = false, length = 500)
    private String questionTitle;

    @NotBlank(message = "Option 1 is required")
    private String option1;

    @NotBlank(message = "Option 2 is required")
    private String option2;

    @NotBlank(message = "Option 3 is required")
    private String option3;

    @NotBlank(message = "Option 4 is required")
    private String option4;

    @NotBlank(message = "Right answer is required")
    private String rightAnswer;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Difficulty level is required")
    private String difficultyLevel;

    public Question(String questionTitle, String option1,
                    String option2, String option3, String option4,
                    String rightAnswer, String difficultyLevel, String category) {
        this.questionTitle = questionTitle;
        this.option1 = option1;
        this.option2 = option2;
        this.option3 = option3;
        this.option4 = option4;
        this.rightAnswer = rightAnswer;
        this.difficultyLevel = difficultyLevel;
        this.category = category;
    }
}
