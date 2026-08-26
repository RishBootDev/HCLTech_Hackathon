package org.bootforce.aipoweredcareermentor.dto;

import lombok.Builder;
import java.util.List;

@Builder
public record SkillGapReport(
        int matchPercentage,
        List<String> matchedSkills,
        List<String> missingSkills,
        String overallFeedBack
) {}
