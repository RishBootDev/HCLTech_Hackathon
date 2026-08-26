package org.bootforce.aipoweredcareermentor.dto;


import java.util.ArrayList;

public class FinalAnswer{
    public int questionId;
    public String questionText;
    public String category;
    public ArrayList<Option> options;
    public int correctOptionId;
    public String correctOptionText;
    public int selectedOptionId;
    public String selectedOptionText;
    public boolean isAttempted;
}
