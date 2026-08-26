package org.bootforce.aipoweredcareermentor.controller;

import lombok.RequiredArgsConstructor;
import org.bootforce.aipoweredcareermentor.model.Question;
import org.bootforce.aipoweredcareermentor.model.Quiz;
import org.bootforce.aipoweredcareermentor.service.QuizService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.bootforce.aipoweredcareermentor.dto.QuizDto;

@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
@CrossOrigin
public class QuizController {

    private final QuizService serv;

    @PostMapping("/create")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MENTOR')")
    public ResponseEntity<Quiz> createQuiz(
            @RequestParam String category,
            @RequestParam String title,
            @RequestParam(required = false) Integer creatorId) {
        Quiz quiz = new Quiz(title, category);
        return ResponseEntity.ok(serv.createQuiz(quiz, creatorId));
    }

    @PostMapping("/addQuestion/{questionId}/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MENTOR')")
    public Question addQuestion(@PathVariable int questionId, @PathVariable int id) {
        return serv.addQuestion(id, questionId);
    }

    @DeleteMapping("/{quizId}/question/{questionId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MENTOR')")
    public ResponseEntity<String> removeQuestion(@PathVariable int quizId, @PathVariable int questionId) {
        serv.removeQuestionFromQuiz(questionId, quizId);
        return ResponseEntity.ok("Question removed from quiz successfully");
    }

    @GetMapping("/all")
    public List<QuizDto> getAllQuizzes() {
        return serv.getAllQuizzes();
    }

    @GetMapping("/my/{profileId}")
    public List<QuizDto> getMyQuizzes(@PathVariable Integer profileId) {
        return serv.getMyQuizzes(profileId);
    }

    @GetMapping("/for/{profileId}")
    public List<QuizDto> getQuizzesForUser(@PathVariable Integer profileId) {
        return serv.getQuizzesForUser(profileId);
    }

    @GetMapping("/{id}")
    public QuizDto getQuizById(@PathVariable int id) {
        return serv.getQuizDtoById(id);
    }

    @PostMapping("/addBulkQuestions/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MENTOR')")
    public List<Question> addQuestions(@PathVariable int id, @RequestBody List<Question> qlist) {
        return serv.addAllQuestions(id, qlist);
    }
}
