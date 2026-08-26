package org.bootforce.aipoweredcareermentor.repository;

import org.bootforce.aipoweredcareermentor.model.Tutorial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TutorialRepository extends JpaRepository<Tutorial, Integer> {
}
