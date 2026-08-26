package org.bootforce.aipoweredcareermentor.repository;


import org.bootforce.aipoweredcareermentor.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizRepository extends JpaRepository<Quiz, Integer> {
    List<Quiz> findByCreator_Id(Integer creatorId);

    List<Quiz> findByCreatorIsNull();
}
