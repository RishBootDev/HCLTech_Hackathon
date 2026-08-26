package org.bootforce.aipoweredcareermentor.controller;

import lombok.RequiredArgsConstructor;
import org.bootforce.aipoweredcareermentor.model.LearningSkillProgress;
import org.bootforce.aipoweredcareermentor.service.LearningSkillProgressService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/skill-progress")
@CrossOrigin
@RequiredArgsConstructor
public class LearningSkillProgressController {

    private final LearningSkillProgressService progressService;

    @GetMapping("/{profileId}")
    public ResponseEntity<List<LearningSkillProgress>> getAllProgress(@PathVariable Integer profileId) {
        return ResponseEntity.ok(progressService.getProgressForProfile(profileId));
    }

    @GetMapping("/{profileId}/mastered")
    public ResponseEntity<List<LearningSkillProgress>> getMasteredSkills(@PathVariable Integer profileId) {
        return ResponseEntity.ok(progressService.getMasteredSkills(profileId));
    }

    @GetMapping("/{profileId}/in-progress")
    public ResponseEntity<List<LearningSkillProgress>> getInProgressSkills(@PathVariable Integer profileId) {
        return ResponseEntity.ok(progressService.getInProgressSkills(profileId));
    }

    @GetMapping("/{profileId}/skill/{skillName}")
    public ResponseEntity<LearningSkillProgress> getSkillProgress(
            @PathVariable Integer profileId,
            @PathVariable String skillName) {
        return ResponseEntity.ok(progressService.getSkillProgress(profileId, skillName));
    }

    @PostMapping("/{profileId}/update")
    public ResponseEntity<LearningSkillProgress> updateSkillProgress(
            @PathVariable Integer profileId,
            @RequestBody Map<String, Object> body) {

        String skillName = (String) body.get("skillName");
        String category = (String) body.getOrDefault("category", "General");
        int masteryScore = ((Number) body.get("masteryScore")).intValue();

        return ResponseEntity.ok(progressService.updateSkillProgress(profileId, skillName, category, masteryScore));
    }

    @PutMapping("/{profileId}/skill/{skillName}")
    public ResponseEntity<LearningSkillProgress> updateSkillByName(
            @PathVariable Integer profileId,
            @PathVariable String skillName,
            @RequestParam int masteryScore,
            @RequestParam(defaultValue = "General") String category) {
        return ResponseEntity.ok(progressService.updateSkillProgress(profileId, skillName, category, masteryScore));
    }

    @DeleteMapping("/{progressId}")
    public ResponseEntity<String> deleteProgress(@PathVariable Long progressId) {
        progressService.deleteSkillProgress(progressId);
        return ResponseEntity.ok("Skill progress entry deleted");
    }
}
