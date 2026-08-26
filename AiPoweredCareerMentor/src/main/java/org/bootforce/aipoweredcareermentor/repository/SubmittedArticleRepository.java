package org.bootforce.aipoweredcareermentor.repository;

import org.bootforce.aipoweredcareermentor.model.SubmittedArticle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SubmittedArticleRepository extends JpaRepository<SubmittedArticle, Long> {
    List<SubmittedArticle> findByStatusOrderByCreatedAtDesc(String status);
}
