package org.bootforce.aipoweredcareermentor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
@AllArgsConstructor
public class Answer {
    private int questionId;
    private String selectedOption;
    private boolean isCorrect;
}
