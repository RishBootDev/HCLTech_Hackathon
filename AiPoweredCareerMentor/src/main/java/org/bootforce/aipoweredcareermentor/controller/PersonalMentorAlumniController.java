package org.bootforce.aipoweredcareermentor.controller;

import lombok.RequiredArgsConstructor;
import org.bootforce.aipoweredcareermentor.dto.PersonalMentorDto;
import org.bootforce.aipoweredcareermentor.model.PersonalMentorAlumni;
import org.bootforce.aipoweredcareermentor.service.PersonalMentorAlumniService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/app/mentor")
@RequiredArgsConstructor
@CrossOrigin
public class PersonalMentorAlumniController {

    private final PersonalMentorAlumniService serv;

    @PostMapping("/register")
    public ResponseEntity<PersonalMentorDto> register(@RequestBody PersonalMentorAlumni mentor) {
        return ResponseEntity.ok(serv.registerMentor(mentor));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestParam String email, @RequestParam String password) {
        try {
            return ResponseEntity.ok(serv.login(email, password));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<PersonalMentorDto> getMentor(@PathVariable int id) {
        return ResponseEntity.ok(serv.getMentorDetails(id));
    }

    @GetMapping("/email/{email:.+}")
    public ResponseEntity<PersonalMentorDto> getMentorByEmail(@PathVariable String email) {
        return ResponseEntity.ok(serv.getMentorDetailsByEmail(email));
    }

    @GetMapping("/all")
    public ResponseEntity<List<PersonalMentorDto>> getAllMentors() {
        return ResponseEntity.ok(serv.getAllMentors());
    }

    @GetMapping("/available")
    public ResponseEntity<List<PersonalMentorDto>> getAvailableMentors() {
        return ResponseEntity.ok(serv.getAvailableMentors());
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<PersonalMentorDto>> getMentorsByCourse(@PathVariable Integer courseId) {
        return ResponseEntity.ok(serv.getMentorsByCourse(courseId));
    }

    @PostMapping("/assign")
    public ResponseEntity<?> assignStudent(@RequestParam int mentorId, @RequestParam int profileId) {
        try {
            serv.assignStudentToMentor(mentorId, profileId);
            return ResponseEntity.ok("Student assigned to mentor successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/students/{id}")
    public ResponseEntity<List<org.bootforce.aipoweredcareermentor.dto.ProfileDto>> getStudents(@PathVariable int id) {
        return ResponseEntity.ok(serv.getListOfStudents(id));
    }

    @PutMapping("/availability/{id}")
    public ResponseEntity<PersonalMentorDto> updateAvailability(@PathVariable int id, @RequestParam boolean available) {
        return ResponseEntity.ok(serv.updateMentorAvailability(id, available));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PersonalMentorDto> updateMentor(@PathVariable int id, @RequestBody PersonalMentorAlumni mentor) {
        return ResponseEntity.ok(serv.updateMentor(id, mentor));
    }

}
