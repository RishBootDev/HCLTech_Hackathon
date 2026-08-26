package org.bootforce.aipoweredcareermentor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserSummaryDto {
    private Integer id;
    private Long userId;
    private String fullName;
    private String email;
    private String role;
    private String humanMentorEmail; 
    private Integer mentorId;
}
