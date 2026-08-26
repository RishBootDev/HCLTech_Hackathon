package org.bootforce.aipoweredcareermentor.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PersonalMentorDto {

    private Integer id;
    private Long userId;
    private String name;
    private String jobRole;
    private String email;
    private String phone;
    private String specialization;
    private int credits;
    private int requiredCredits;
    private String description;
    private int rating;
    private int experience;
    private boolean available;
    private boolean isOnline;
}
