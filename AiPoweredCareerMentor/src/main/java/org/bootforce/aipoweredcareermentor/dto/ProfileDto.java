package org.bootforce.aipoweredcareermentor.dto;


import lombok.*;

import java.time.LocalDate;
import org.bootforce.aipoweredcareermentor.model.CourseRecommendation;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class ProfileDto {
    public ProfileDto(String fullName, String email, String password, String phoneNumber, String gender, LocalDate dateOfBirth, String location, int credit, String educationLevel, String preference, String interests, String skills) {
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.phoneNumber = phoneNumber;
        this.gender = gender;
        this.dateOfBirth = dateOfBirth;
        this.location = location;
        this.credit = credit;
        this.educationLevel = educationLevel;
        this.preference = preference;
        this.interests = interests;
        this.skills = skills;
    }

    private Integer id;
    private Long userId;
    private String fullName;
    private String email;
    private String password;
    private String phoneNumber;
    private String gender;
    private LocalDate dateOfBirth;
    private String location;
    private int credit;
    private String educationLevel;
    private String stream;
    private String schoolDetails;
    private String preference;
    private String interests;
    private String skills;
    private boolean isOnline;
    private CourseRecommendation courseRecommendations;
    private PersonalMentorDto humanMentor;
}
