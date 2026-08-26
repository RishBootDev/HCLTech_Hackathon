package org.bootforce.aipoweredcareermentor.service;


import lombok.RequiredArgsConstructor;
import org.bootforce.aipoweredcareermentor.exception.ResourceNotFoundException;
import org.bootforce.aipoweredcareermentor.model.Course;
import org.bootforce.aipoweredcareermentor.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository repo;

    public Course getCourseById(int id) {
        return repo.findById(id).orElseThrow(()-> new ResourceNotFoundException("Course nahi mila"));
    }

    public List<Course> getCourseByName(String keyword) {
        return repo.findByCourseNameContainingIgnoreCase(keyword);
    }

    public List<Course> getAllCourses() {
        return repo.findAll();
    }

    public Course createCourse(Course course, Integer mentorId) {
        course.setCreatedBy(mentorId);
        return repo.save(course);
    }

    public List<Course> getCoursesByMentor(Integer mentorId) {
        return repo.findByCreatedBy(mentorId);
    }

    public void deleteCourse(int id) {
        if (!repo.existsById(id)) {
            throw new ResourceNotFoundException("Course not found with id: " + id);
        }
        repo.deleteById(id);
    }
}
