package org.bootforce.aipoweredcareermentor.controller;

import lombok.RequiredArgsConstructor;
import org.bootforce.aipoweredcareermentor.model.Course;
import org.bootforce.aipoweredcareermentor.service.CourseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
@CrossOrigin
public class CourseController {

    private final CourseService serv;

    @GetMapping("/get/{id}")
    public ResponseEntity<Course> getCourseById(@PathVariable int id) {
        return ResponseEntity.ok(serv.getCourseById(id));
    }

    @GetMapping("/{name}/get")
    public ResponseEntity<List<Course>> getCourseByName(@PathVariable String name) {
        return ResponseEntity.ok(serv.getCourseByName(name));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Course>> getAllCourses() {
        return ResponseEntity.ok(serv.getAllCourses());
    }

    @PostMapping("/create")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MENTOR')")
    public ResponseEntity<Course> createCourse(@RequestBody Course course, @RequestParam Integer mentorId) {
        return ResponseEntity.ok(serv.createCourse(course, mentorId));
    }

    @GetMapping("/mentor/{mentorId}")
    public ResponseEntity<List<Course>> getCoursesByMentor(@PathVariable Integer mentorId) {
        return ResponseEntity.ok(serv.getCoursesByMentor(mentorId));
    }

    @DeleteMapping("/delete/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MENTOR')")
    public ResponseEntity<String> deleteCourse(@PathVariable int id) {
        serv.deleteCourse(id);
        return ResponseEntity.ok("Course deleted successfully");
    }
}
