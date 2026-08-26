package org.bootforce.aipoweredcareermentor.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.bootforce.aipoweredcareermentor.dto.QuizDto;
import org.bootforce.aipoweredcareermentor.exception.ResourceNotFoundException;
import org.bootforce.aipoweredcareermentor.model.Profile;
import org.bootforce.aipoweredcareermentor.model.Question;
import org.bootforce.aipoweredcareermentor.model.Quiz;
import org.bootforce.aipoweredcareermentor.repository.ProfileRepo;
import org.bootforce.aipoweredcareermentor.repository.QuestionRepo;
import org.bootforce.aipoweredcareermentor.repository.QuizRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository repo;
    private final QuestionRepo qrepo;
    private final ProfileRepo prepo;
    private final ModelMapper mapper;

    public Quiz createQuiz(Quiz quiz, Integer creatorId) {
        if (creatorId != null) {
            Profile creator = prepo.findById(creatorId).orElseThrow(() -> new ResourceNotFoundException("Creator Profile not found"));
            quiz.setCreator(creator);
        }
        return repo.save(quiz);
    }

    public Question addQuestion(int id, int questionId) {
        Quiz quiz = repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        Question question = qrepo.findById(questionId).orElseThrow(() -> new ResourceNotFoundException("Question not found"));
        
        quiz.addQuestion(question);
        repo.save(quiz);
        return question;
    }

    public void removeQuestionFromQuiz(int id, int quizId) {
        Quiz quiz = repo.findById(quizId).orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        Question question = qrepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        quiz.getQuestionList().remove(question);
        quiz.setNumQ(quiz.getQuestionList().size());
        repo.save(quiz);
    }

    public List<Question> getAllQuestions() {
        return qrepo.findAll();
    }

    public List<Question> getByCategory(String category) {
        return qrepo.getByCategory(category);
    }

    public Question addQuestion(Question question) {
        return qrepo.save(question);
    }


    public List<QuizDto> getAllQuizzes() {
        return repo.findByCreatorIsNull().stream()
                .map(quiz -> mapper.map(quiz, QuizDto.class))
                .collect(Collectors.toList());
    }


    public List<QuizDto> getMyQuizzes(Integer creatorId) {
        return repo.findByCreator_Id(creatorId).stream()
                .map(quiz -> mapper.map(quiz, QuizDto.class))
                .collect(Collectors.toList());
    }

    public List<QuizDto> getQuizzesForUser(Integer profileId) {
        List<QuizDto> publicQuizzes = repo.findByCreatorIsNull().stream()
                .map(quiz -> mapper.map(quiz, QuizDto.class))
                .collect(Collectors.toList());
        List<QuizDto> myQuizzes = repo.findByCreator_Id(profileId).stream()
                .map(quiz -> mapper.map(quiz, QuizDto.class))
                .collect(Collectors.toList());
        publicQuizzes.addAll(myQuizzes);
        return publicQuizzes;
    }

    @Deprecated
    public List<QuizDto> getQuizzesByCreator(Integer creatorId) {
        return getMyQuizzes(creatorId);
    }

    public QuizDto getQuizDtoById(int id) {
        Quiz quiz = repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        return mapper.map(quiz, QuizDto.class);
    }

    public Quiz getQuizById(int id) {
        return repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
    }

    public List<Question> addAllQuestions(int quizId, List<Question> qlist) {
        Quiz quiz = repo.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        qlist.forEach(quiz::addQuestion);
        repo.save(quiz);

        return quiz.getQuestionList();
    }
}
