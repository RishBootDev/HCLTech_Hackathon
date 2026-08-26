package org.bootforce.aipoweredcareermentor.repository;

import org.bootforce.aipoweredcareermentor.model.LearningSkillProgress;
import org.bootforce.aipoweredcareermentor.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LearningSkillProgressRepository extends JpaRepository<LearningSkillProgress, Long> {
    List<LearningSkillProgress> findByProfile(Profile profile);
    List<LearningSkillProgress> findByProfileAndStatus(Profile profile, String status);
    Optional<LearningSkillProgress> findFirstByProfileAndSkillNameOrderByCreatedAtDesc(Profile profile, String skillName);
    List<LearningSkillProgress> findByProfileAndCategory(Profile profile, String category);
}
