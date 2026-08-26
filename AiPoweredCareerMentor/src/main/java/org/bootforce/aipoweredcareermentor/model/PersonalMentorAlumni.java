package org.bootforce.aipoweredcareermentor.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonalMentorAlumni {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank(message = "Name is required")
    private String name;

    @Column
    private String email;

    @NotBlank(message = "Phone is required")
    private String phone;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @NotBlank(message = "Job role is required")
    private String jobRole;

    @NotBlank(message = "Specialization is required")
    private String specialization;

    private int credits;
    private int requiredCredits;
    
    @Column(length = 1000)
    private String description;
    
    private int rating;
    private int experience;

    @Builder.Default
    private boolean available = true;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Course course;

    @Builder.Default
    @OneToMany(mappedBy = "humanMentor", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Profile> students = new ArrayList<>();
}
