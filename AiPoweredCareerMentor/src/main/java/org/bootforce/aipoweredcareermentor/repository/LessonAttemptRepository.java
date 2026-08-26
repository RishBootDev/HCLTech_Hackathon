package org.bootforce.aipoweredcareermentor.repository;

import org.bootforce.aipoweredcareermentor.model.LessonAttempt;
import org.bootforce.aipoweredcareermentor.model.Lesson;
import org.bootforce.aipoweredcareermentor.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LessonAttemptRepository extends JpaRepository<LessonAttempt, Long> {
    List<LessonAttempt> findByProfile(Profile profile);
    Optional<LessonAttempt> findFirstByProfileAndLessonOrderByAttemptedAtDesc(Profile profile, Lesson lesson);
}
