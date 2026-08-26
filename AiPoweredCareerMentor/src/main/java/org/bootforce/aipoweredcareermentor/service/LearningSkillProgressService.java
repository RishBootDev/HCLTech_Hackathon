package org.bootforce.aipoweredcareermentor.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bootforce.aipoweredcareermentor.exception.ResourceNotFoundException;
import org.bootforce.aipoweredcareermentor.model.LearningSkillProgress;
import org.bootforce.aipoweredcareermentor.model.Profile;
import org.bootforce.aipoweredcareermentor.repository.LearningSkillProgressRepository;
import org.bootforce.aipoweredcareermentor.repository.ProfileRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class LearningSkillProgressService {

    private final LearningSkillProgressRepository progressRepository;
    private final ProfileRepo profileRepo;

    public List<LearningSkillProgress> getProgressForProfile(Integer profileId) {
        Profile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found: " + profileId));
        return progressRepository.findByProfile(profile);
    }

    public List<LearningSkillProgress> getMasteredSkills(Integer profileId) {
        Profile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found: " + profileId));
        return progressRepository.findByProfileAndStatus(profile, "MASTERED");
    }

    public List<LearningSkillProgress> getInProgressSkills(Integer profileId) {
        Profile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found: " + profileId));
        return progressRepository.findByProfileAndStatus(profile, "IN_PROGRESS");
    }

    @Transactional
    public LearningSkillProgress updateSkillProgress(Integer profileId, String skillName, String category, int masteryScore) {
        Profile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found: " + profileId));

        Optional<LearningSkillProgress> existing = progressRepository.findFirstByProfileAndSkillNameOrderByCreatedAtDesc(profile, skillName);

        LearningSkillProgress progress;
        if (existing.isPresent()) {
            progress = existing.get();
            if (masteryScore > (progress.getMasteryScore() != null ? progress.getMasteryScore() : 0)) {
                progress.setMasteryScore(masteryScore);
            }
            progress.setTotalAttempts(progress.getTotalAttempts() + 1);
            if (masteryScore >= 60) {
                progress.setPassedAttempts(progress.getPassedAttempts() + 1);
            }
        } else {
            progress = LearningSkillProgress.builder()
                    .profile(profile)
                    .skillName(skillName)
                    .category(category)
                    .masteryScore(masteryScore)
                    .totalAttempts(1)
                    .passedAttempts(masteryScore >= 60 ? 1 : 0)
                    .build();
        }

        log.info("Updating skill '{}' for profile {} → score: {}", skillName, profileId, masteryScore);
        return progressRepository.save(progress);
    }

    public LearningSkillProgress getSkillProgress(Integer profileId, String skillName) {
        Profile profile = profileRepo.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found: " + profileId));
        return progressRepository.findFirstByProfileAndSkillNameOrderByCreatedAtDesc(profile, skillName)
                .orElseThrow(() -> new ResourceNotFoundException("No progress found for skill: " + skillName));
    }

    @Transactional
    public void deleteSkillProgress(Long progressId) {
        progressRepository.deleteById(progressId);
    }
}
