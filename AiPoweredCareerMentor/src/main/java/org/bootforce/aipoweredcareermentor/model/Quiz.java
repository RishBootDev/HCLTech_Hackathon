package org.bootforce.aipoweredcareermentor.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quizzes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Transient
    @JsonProperty("creatorId")
    private Integer tempCreatorId;

    @NotBlank(message = "Title is required")
    private String title;

    private Integer numQ;

    @NotBlank(message = "Category is required")
    private String category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Profile creator;

    @Builder.Default
    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "quiz_questions_mapping", // rename the mapping table to prevent migration collisions
            joinColumns = @JoinColumn(name = "quiz_id"),
            inverseJoinColumns = @JoinColumn(name = "question_id")
    )
    private List<Question> questionList = new ArrayList<>();

    public Quiz(String title, String category) {
        this.title = title;
        this.category = category;
    }

    public void addQuestion(Question question) {
        if (this.questionList == null) {
            this.questionList = new ArrayList<>();
        }
        this.questionList.add(question);
        this.numQ = this.questionList.size();
    }
}
