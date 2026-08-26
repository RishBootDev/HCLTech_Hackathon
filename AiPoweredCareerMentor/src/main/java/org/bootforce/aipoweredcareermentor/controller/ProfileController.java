package org.bootforce.aipoweredcareermentor.controller;


import com.fasterxml.jackson.core.JsonProcessingException;
import lombok.RequiredArgsConstructor;
import org.bootforce.aipoweredcareermentor.dto.FinalRoot;
import org.bootforce.aipoweredcareermentor.dto.ProfileDto;
import org.bootforce.aipoweredcareermentor.model.College;
import org.bootforce.aipoweredcareermentor.model.CourseRecommendation;
import org.bootforce.aipoweredcareermentor.model.PersonalMentorAlumni;
import org.bootforce.aipoweredcareermentor.model.QuizResult;
import org.bootforce.aipoweredcareermentor.service.ProfileService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@CrossOrigin
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/{id}")
    public ProfileDto getProfileById(@PathVariable Integer id) {
        return profileService.getProfileById(id);
    }

    @GetMapping("/email/{email:.+}")
    public ProfileDto getProfileByEmail(@PathVariable String email) {
        return profileService.getProfileByEmail(email);
    }


    @GetMapping("/{id}/quizzes")
    public List<QuizResult> getUserQuizzesResult(@PathVariable Integer id) {
        List<QuizResult> quizzes = profileService.getUserQuizzesResult(id);
        return quizzes;
    }

    @GetMapping("/{id}/mentorship")
    public PersonalMentorAlumni getMentorshipSessions(@PathVariable Integer id) {
        PersonalMentorAlumni mentor = profileService.getMentorshipSessions(id);
        return mentor;
    }


    @PostMapping("/{id}/getCourse")
    public CourseRecommendation getCourseRecommendation(@PathVariable int id, @RequestBody FinalRoot root) throws JsonProcessingException {
        return profileService.getCourseRecommendation(id, root);
    }

    @GetMapping("/{id}/course")
    public CourseRecommendation getCourse(@PathVariable int id){
        return profileService.getCourseRecommendation(id);
    }

    @PostMapping("/{id}/recommendColleges")
    public List<College>  recommendColleges(@PathVariable int id,@RequestParam String city){
        return profileService.getCollegeRecommendations(id,city);
    }

    @GetMapping("/{id}/getColleges")
    public List<College>  getColleges(@PathVariable int id){
        return profileService.getCollege(id);
    }

//    @PutMapping("/{id}/recharge")
//    public String recharge(@PathVariable int id, @RequestParam int amount) {
//        profileService.addCredits(id, amount);
//        return "Credits recharged successfully";
//    }
}
