package org.bootforce.aipoweredcareermentor.model;


import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "course_recommendations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("courseName")
    private String courseName;

    @JsonProperty("description")
    @Column(columnDefinition = "TEXT")
    private String description;

    @JsonProperty("careerPath")
    private String careerPath;

    @JsonProperty("industry")
    private String industry;

}
