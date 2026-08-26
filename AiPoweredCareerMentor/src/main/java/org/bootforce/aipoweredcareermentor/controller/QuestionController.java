package org.bootforce.aipoweredcareermentor.controller;

import lombok.RequiredArgsConstructor;
import org.bootforce.aipoweredcareermentor.model.Question;
import org.bootforce.aipoweredcareermentor.service.QuizService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/questions")
@RequiredArgsConstructor
@CrossOrigin
public  class QuestionController {

    private final QuizService serv;

    @GetMapping("/all")
    public List<Question> getAllQuestions(){
        return serv.getAllQuestions();
    }

    @GetMapping("/category/{category}")
    public List<Question> getByCategory(@PathVariable String category){
        return serv.getByCategory(category);
    }

    @PostMapping("/add")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MENTOR')")
    public Question addQuestion(@RequestBody Question question){
        return serv.addQuestion(question);
    }

}