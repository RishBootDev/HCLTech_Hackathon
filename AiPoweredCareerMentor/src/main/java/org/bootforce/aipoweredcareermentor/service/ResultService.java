package org.bootforce.aipoweredcareermentor.service;


import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bootforce.aipoweredcareermentor.dto.Answer;
import org.bootforce.aipoweredcareermentor.dto.Root;
import org.bootforce.aipoweredcareermentor.model.Profile;
import org.bootforce.aipoweredcareermentor.model.Question;
import org.bootforce.aipoweredcareermentor.model.QuizResult;
import org.bootforce.aipoweredcareermentor.repository.ProfileRepo;
import org.bootforce.aipoweredcareermentor.repository.QuestionRepo;
import org.bootforce.aipoweredcareermentor.repository.QuizRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResultService {

    private final QuestionRepo repo;
    private final ProfileRepo prepo;
    private final QuizRepository qzrepo;
    private final NotificationService nserv;


    @Transactional
    public Root result(Root root,int profileId){

        System.out.println(root);

        int count=0;
        for(Answer answer : root.getAnswers()){
            Question question = repo.findById(answer.getQuestionId()).orElse(null);

            if (question != null && answer.getSelectedOption() != null &&
                    answer.getSelectedOption().equalsIgnoreCase(question.getRightAnswer())) {

                System.out.println("[ResultService] Correct Answer: " + question.getRightAnswer());
                answer.setCorrect(true);
                count++;
            }

            if (question != null) {
                System.out.println("[ResultService] Question ID: " + question.getQid()
                        + " | Correct: " + question.getRightAnswer()
                        + " == Selected: " + answer.getSelectedOption());
            } else {
                System.err.println("[ResultService] Warning: Question not found for ID: " + answer.getQuestionId());
            }
        }


        Profile profile = prepo.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found with id: " + profileId));

        QuizResult result = QuizResult.builder()
                .score(count)
                .totalScore(root.getAnswers().size())
                .title(root.getQuiztitle())
                .category(root.getQuizCategory())
                .dateTaken(LocalDateTime.now())
                .profile(profile)
                .quiz(qzrepo.findById(root.getQuizId()).orElse(null))
                .build();


        int person_credit = profile.getCredit();
        double fractionCorrect = (count * 1.0) / root.getAnswers().size();

        String message;
        if (fractionCorrect >= 0.8) {
            profile.setCredit(person_credit + 100);
            message = " 🎉 Great job," + profile.getFullName() + " You earned 100 points for your recent quiz. Your total score is now "+
            (person_credit + 100) + ". Keep it up! 🚀";
        }
        else if (fractionCorrect >= 0.6) {
            profile.setCredit(person_credit + 50);
            message = " 🎉 Good job," + profile.getFullName() + " You earned 50 points for your recent quiz. Your total score is now "+
                    (person_credit + 50) + ". Good learning! 🚀";
        }
        else if (fractionCorrect >= 0.4) {
            profile.setCredit(person_credit + 25);
            message = " 🎉 Your can do better next time," + profile.getFullName() + " You earned 25 points for your recent quiz. Your total score is now "+
                    (person_credit + 25) + ". Keep it up! 🚀";
        }
        else {
            profile.setCredit(person_credit + 5);
            message="Bhai padh le yaar career bana le apna nahi to kuch bhi nahi hoga";
        }


        profile.getQuizResults().add(result);
        prepo.save(profile);

        // Notify user about quiz reward
   //     nserv.saveNotification(profile, "Quiz Reward", message);

        return root;
    }

}
