package org.bootforce.aipoweredcareermentor.service;

import org.bootforce.aipoweredcareermentor.model.Course;
import org.bootforce.aipoweredcareermentor.model.Lesson;
import org.bootforce.aipoweredcareermentor.model.Module;
import org.bootforce.aipoweredcareermentor.repository.CourseRepository;
import org.bootforce.aipoweredcareermentor.repository.LessonRepository;
import org.bootforce.aipoweredcareermentor.repository.ModuleRepository;
import org.bootforce.aipoweredcareermentor.repository.TutorialRepository;
import org.bootforce.aipoweredcareermentor.model.Tutorial;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.IOException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmartLearnContentService {

    private final CourseRepository courseRepository;
    private final ModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final TutorialRepository tutorialRepository;
    private final ExtractionService extractionService;

    @Transactional
    public Module addModule(Integer courseId, String title, String description) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        Module module = Module.builder()
                .title(title)
                .description(description)
                .course(course)
                .build();
        
        return moduleRepository.save(module);
    }

    @Transactional
    public Lesson addLesson(Long moduleId, String title, String content, String videoUrl, Integer durationMinutes, MultipartFile file) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found"));

        String finalContent = content;
        if (file != null && !file.isEmpty()) {
            try {
                String extracted = extractionService.extractText(file);
                finalContent = (content != null ? content + "\n\n" : "") + extracted;
            } catch (IOException e) {
                log.error("Failed to extract content from file: {}", file.getOriginalFilename(), e);
                throw new RuntimeException("File extraction failed", e);
            }
        }

        Lesson lesson = Lesson.builder()
                .title(title)
                .content(finalContent)
                .videoUrl(videoUrl)
                .durationMinutes(durationMinutes)
                .module(module)
                .build();

        module.getLessons().add(lesson);
        return lessonRepository.save(lesson);
    }

    public Lesson getLessonById(Long id) {
        return lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));
    }

    @Transactional
    public Tutorial addTutorial(Integer courseId, Tutorial tutorial) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        Tutorial saved = tutorialRepository.save(tutorial);
        course.getTutorials().add(saved);
        courseRepository.save(course);
        return saved;
    }
}
