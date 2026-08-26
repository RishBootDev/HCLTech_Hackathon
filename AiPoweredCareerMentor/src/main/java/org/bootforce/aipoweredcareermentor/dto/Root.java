package org.bootforce.aipoweredcareermentor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;


@Data
@Getter
@Setter
@AllArgsConstructor
public class Root {
    private int quizId;
    private String quiztitle;
    private String quizCategory;
    private ArrayList<Answer> answers;
}
